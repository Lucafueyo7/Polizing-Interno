import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.main_system_client import MainSystemClient, media_payload
from app.messages import get_message
from app.models import Conversation, ReceivedMessage
from app.whatsapp import WhatsAppClient


SESSION_TTL = timedelta(hours=24)
ALLOWED_MEDIA_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


class ConversationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.main_system = MainSystemClient(db)
        self.whatsapp = WhatsAppClient(db)

    async def process(self, inbound: dict) -> None:
        phone = inbound["phone"]
        if not phone:
            return

        self._store_received(inbound)
        client = await self.main_system.get_client_by_phone(phone)
        if not client:
            await self.whatsapp.send_text(phone, get_message(self.db, "client_not_found"))
            return

        conversation = self._get_conversation(phone)
        expired = self._is_expired(conversation)
        if expired:
            self._reset(conversation)
            await self.whatsapp.send_text(phone, get_message(self.db, "session_expired"))

        conversation.last_inbound_at = datetime.utcnow()
        self.db.commit()

        text = (inbound.get("text") or "").strip()
        if text == "0":
            self._reset(conversation)
            await self.whatsapp.send_text(phone, get_message(self.db, "cancelled"))
            await self.whatsapp.send_text(phone, get_message(self.db, "welcome_menu"))
            return

        if not conversation.current_flow:
            await self._handle_main_menu(conversation, text)
            return

        handlers = {
            "policy_request": self._handle_policy_request,
            "circulation_card": self._handle_circulation_card,
            "payment_receipt": self._handle_payment_receipt,
            "claim": self._handle_claim,
        }
        await handlers[conversation.current_flow](conversation, inbound)

    async def _handle_main_menu(self, conversation: Conversation, text: str) -> None:
        option = normalize_option(text)
        if not option:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))
            return
        if option == "1":
            conversation.current_flow = "policy_request"
            conversation.current_step = "type"
            conversation.data_json = "{}"
            self.db.commit()
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_type_prompt"))
        elif option == "2":
            await self._start_policy_selection(conversation, "circulation_card", "select_policy", "policy_list_prompt")
        elif option == "3":
            await self._start_policy_selection(conversation, "payment_receipt", "select_policy", "payment_policy_prompt")
        elif option == "4":
            await self._start_policy_selection(conversation, "claim", "select_policy", "claim_policy_prompt")
        else:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "invalid_option"))
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))

    async def _handle_policy_request(self, conversation: Conversation, inbound: dict) -> None:
        data = self._data(conversation)
        text = (inbound.get("text") or "").strip()
        step = conversation.current_step

        if step == "type":
            option = normalize_option(text)
            if option not in {"1", "2"}:
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_type_prompt"))
                return
            data["insurance_type"] = "auto" if option == "1" else "moto"
            await self._advance(conversation, data, "domain", "policy_domain_prompt")
        elif step == "domain":
            data["domain"] = text.upper() or "SIN DOMINIO"
            await self._advance(conversation, data, "brand", "policy_brand_prompt")
        elif step == "brand":
            data["brand"] = text
            await self._advance(conversation, data, "model", "policy_model_prompt")
        elif step == "model":
            data["model"] = text
            await self._advance(conversation, data, "year", "policy_year_prompt")
        elif step == "year":
            if not text.isdigit() or len(text) != 4:
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_year_prompt"))
                return
            data["year"] = text
            await self._advance(conversation, data, "use", "policy_use_prompt")
        elif step == "use":
            option = normalize_option(text)
            if option not in {"1", "2"}:
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_use_prompt"))
                return
            data["use"] = "particular" if option == "1" else "comercial"
            await self._advance(conversation, data, "notes", "policy_notes_prompt")
        elif step == "notes":
            data["notes"] = "" if text.upper() == "NO" else text
            result = await self.main_system.create_policy_request(conversation.phone, data)
            self._reset(conversation)
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_success", reference=result["reference"]))
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))

    async def _handle_circulation_card(self, conversation: Conversation, inbound: dict) -> None:
        policy = await self._selected_policy(conversation, inbound)
        if not policy:
            return
        card = await self.main_system.get_circulation_card(conversation.phone, policy["id"])
        self._reset(conversation)
        if not card:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "card_not_found"))
        else:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "card_success"))
            await self.whatsapp.send_document_base64(
                conversation.phone,
                card["filename"],
                card["mime_type"],
                card["content_base64"],
                caption="Tarjeta de circulacion",
            )
        await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))

    async def _handle_payment_receipt(self, conversation: Conversation, inbound: dict) -> None:
        data = self._data(conversation)
        if conversation.current_step == "select_policy":
            policy = await self._selected_policy(conversation, inbound, keep_flow=True)
            if not policy:
                return
            data["policy"] = policy
            await self._advance(conversation, data, "file", "payment_file_prompt")
            return

        if conversation.current_step == "file":
            media = inbound.get("media")
            if not valid_media(media):
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "payment_invalid_file"))
                return
            content = await self.whatsapp.download_media(media["id"])
            data["file"] = media_payload(media, content)
            result = await self.main_system.register_payment_receipt(conversation.phone, data)
            self._reset(conversation)
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "payment_success", reference=result["reference"]))
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))

    async def _handle_claim(self, conversation: Conversation, inbound: dict) -> None:
        data = self._data(conversation)
        text = (inbound.get("text") or "").strip()
        step = conversation.current_step

        if step == "select_policy":
            policy = await self._selected_policy(conversation, inbound, keep_flow=True)
            if not policy:
                return
            data["policy"] = policy
            data["additional_files"] = []
            await self._advance(conversation, data, "date", "claim_date_prompt")
        elif step == "date":
            data["date"] = text
            await self._advance(conversation, data, "time", "claim_time_prompt")
        elif step == "time":
            data["time"] = text
            await self._advance(conversation, data, "place", "claim_place_prompt")
        elif step == "place":
            data["place"] = text
            await self._advance(conversation, data, "description", "claim_description_prompt")
        elif step == "description":
            data["description"] = text
            await self._advance(conversation, data, "license", "claim_license_prompt")
        elif step == "license":
            media = inbound.get("media")
            if not valid_media(media):
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "claim_license_prompt"))
                return
            data["driver_license"] = media_payload(media, await self.whatsapp.download_media(media["id"]))
            await self._advance(conversation, data, "vehicle_card", "claim_vehicle_card_prompt")
        elif step == "vehicle_card":
            media = inbound.get("media")
            if not valid_media(media):
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "claim_vehicle_card_prompt"))
                return
            data["vehicle_card"] = media_payload(media, await self.whatsapp.download_media(media["id"]))
            await self._advance(conversation, data, "third_parties", "claim_third_parties_prompt")
        elif step == "third_parties":
            data["third_parties"] = "" if text.upper() == "NO" else text
            await self._advance(conversation, data, "police_report", "claim_police_report_prompt")
        elif step == "police_report":
            media = inbound.get("media")
            if text.upper() == "NO":
                data["police_report"] = None
            elif valid_media(media):
                data["police_report"] = media_payload(media, await self.whatsapp.download_media(media["id"]))
            else:
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "claim_police_report_prompt"))
                return
            await self._advance(conversation, data, "photos", "claim_photos_prompt")
        elif step == "photos":
            media = inbound.get("media")
            if text.upper() == "FINALIZAR":
                result = await self.main_system.register_claim(conversation.phone, data)
                self._reset(conversation)
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "claim_success", reference=result["reference"]))
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))
            elif valid_media(media):
                data.setdefault("additional_files", []).append(media_payload(media, await self.whatsapp.download_media(media["id"])))
                self._save_data(conversation, data)
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "claim_photos_prompt"))
            else:
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "claim_photos_prompt"))

    async def _start_policy_selection(self, conversation: Conversation, flow: str, step: str, message_key: str) -> None:
        policies = await self.main_system.list_policies(conversation.phone)
        if not policies:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_list_empty"))
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))
            return
        conversation.current_flow = flow
        conversation.current_step = step
        conversation.data_json = json.dumps({"policies": policies}, ensure_ascii=True)
        self.db.commit()
        await self.whatsapp.send_text(conversation.phone, get_message(self.db, message_key, policies=format_policies(policies)))

    async def _selected_policy(self, conversation: Conversation, inbound: dict, keep_flow: bool = False) -> dict | None:
        data = self._data(conversation)
        text = (inbound.get("text") or "").strip()
        index = parse_index(text)
        policies = data.get("policies", [])
        if index is None or index < 0 or index >= len(policies):
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "invalid_option"))
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_list_prompt", policies=format_policies(policies)))
            return None
        policy = policies[index]
        if not keep_flow:
            data["selected_policy"] = policy
            self._save_data(conversation, data)
        return policy

    async def _advance(self, conversation: Conversation, data: dict, next_step: str, message_key: str) -> None:
        conversation.current_step = next_step
        conversation.data_json = json.dumps(data, ensure_ascii=True)
        self.db.commit()
        await self.whatsapp.send_text(conversation.phone, get_message(self.db, message_key))

    def _get_conversation(self, phone: str) -> Conversation:
        conversation = self.db.query(Conversation).filter(Conversation.phone == phone).first()
        if conversation:
            return conversation
        conversation = Conversation(phone=phone)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def _is_expired(self, conversation: Conversation) -> bool:
        return bool(conversation.last_inbound_at and datetime.utcnow() - conversation.last_inbound_at > SESSION_TTL)

    def _reset(self, conversation: Conversation) -> None:
        conversation.current_flow = None
        conversation.current_step = None
        conversation.data_json = "{}"
        self.db.commit()

    def _data(self, conversation: Conversation) -> dict:
        return json.loads(conversation.data_json or "{}")

    def _save_data(self, conversation: Conversation, data: dict) -> None:
        conversation.data_json = json.dumps(data, ensure_ascii=True)
        self.db.commit()

    def _store_received(self, inbound: dict) -> None:
        media = inbound.get("media") or {}
        self.db.add(
            ReceivedMessage(
                whatsapp_message_id=inbound.get("id"),
                phone=inbound.get("phone") or "",
                message_type=inbound.get("type") or "unknown",
                text=inbound.get("text"),
                media_id=media.get("id"),
                mime_type=media.get("mime_type"),
                filename=media.get("filename"),
                payload_json=json.dumps(inbound, ensure_ascii=True),
            )
        )
        self.db.commit()


def normalize_option(text: str) -> str | None:
    value = text.strip().lower()
    aliases = {
        "solicitar poliza": "1",
        "poliza": "1",
        "tarjeta": "2",
        "tarjeta de circulacion": "2",
        "comprobante": "3",
        "pago": "3",
        "siniestro": "4",
    }
    if value in {"1", "2", "3", "4"}:
        return value
    return aliases.get(value)


def parse_index(text: str) -> int | None:
    if not text.isdigit():
        return None
    return int(text) - 1


def format_policies(policies: list[dict]) -> str:
    return "\n".join(
        f"{index}. {policy['policy_number']} - {policy['domain']} - {policy['description']}"
        for index, policy in enumerate(policies, start=1)
    )


def valid_media(media: dict | None) -> bool:
    if not media:
        return False
    mime_type = media.get("mime_type")
    return bool(mime_type in ALLOWED_MEDIA_TYPES or str(mime_type).startswith("image/"))
