import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.intents.circulation_card import CirculationCardHandler
from app.intents.claim import ClaimHandler
from app.intents.payment_receipt import PaymentReceiptHandler
from app.intents.policy_document import PolicyDocumentHandler
from app.intents.utils import format_policies
from app.main_system_client import MainSystemClient
from app.menu import MenuAction, available_actions, render_menu
from app.messages import get_message
from app.models import Conversation, ReceivedMessage
from app.whatsapp import WhatsAppClient


SESSION_TTL = timedelta(hours=24)


class ConversationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.main_system = MainSystemClient(db)
        self.whatsapp = WhatsAppClient(db)
        self._handlers = {
            "circulation_card": CirculationCardHandler(db, self.whatsapp, self.main_system),
            "payment_receipt": PaymentReceiptHandler(db, self.whatsapp, self.main_system),
            "claim": ClaimHandler(db, self.whatsapp, self.main_system),
            "policy_document": PolicyDocumentHandler(db, self.whatsapp, self.main_system),
        }

    async def process(self, inbound: dict) -> None:
        phone = inbound["phone"]
        if not phone:
            return

        if not self._store_received(inbound):
            return
        client = await self.main_system.get_client_by_phone(phone)
        if not client:
            await self.whatsapp.send_text(phone, get_message(self.db, "client_not_found"))
            return
        is_corporate = bool(client.get("is_corporate"))

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
            await self.whatsapp.send_text(phone, render_menu(self.db, is_corporate))
            return

        if not conversation.current_flow:
            await self._handle_main_menu(conversation, text, is_corporate)
            return

        await self._handlers[conversation.current_flow].handle(conversation, inbound, is_corporate)

    async def _handle_main_menu(self, conversation: Conversation, text: str, is_corporate: bool) -> None:
        actions = available_actions(is_corporate)
        choice = text.strip()
        if choice.isdigit():
            index = int(choice) - 1
            if 0 <= index < len(actions):
                await self._start_policy_selection(conversation, actions[index], is_corporate)
                return
        await self.whatsapp.send_text(conversation.phone, get_message(self.db, "invalid_option"))
        await self.whatsapp.send_text(conversation.phone, render_menu(self.db, is_corporate))

    async def _start_policy_selection(
        self, conversation: Conversation, action: MenuAction, is_corporate: bool
    ) -> None:
        policies = await self.main_system.list_policies(conversation.phone, action.scope)
        if not policies:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_list_empty"))
            await self.whatsapp.send_text(conversation.phone, render_menu(self.db, is_corporate))
            return
        conversation.current_flow = action.flow
        conversation.current_step = "select_policy"
        conversation.data_json = json.dumps({"policies": policies}, ensure_ascii=True)
        self.db.commit()
        await self.whatsapp.send_text(
            conversation.phone, get_message(self.db, action.prompt, policies=format_policies(policies))
        )

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

    def _store_received(self, inbound: dict) -> bool:
        msg_id = inbound.get("id")
        if msg_id and self.db.query(ReceivedMessage).filter(ReceivedMessage.whatsapp_message_id == msg_id).first():
            return False
        media = inbound.get("media") or {}
        self.db.add(
            ReceivedMessage(
                whatsapp_message_id=msg_id,
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
        return True
