from app.intents.base import BaseFlowHandler
from app.intents.utils import valid_media
from app.main_system_client import media_payload
from app.messages import get_message
from app.models import Conversation


class ClaimHandler(BaseFlowHandler):
    async def handle(self, conversation: Conversation, inbound: dict) -> None:
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
             # Se descarga el archivo de los servidores de meta y lo convierte a base64 para guardarlo
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
