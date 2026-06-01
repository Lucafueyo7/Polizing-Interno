import json
from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.intents.utils import format_policies, parse_index
from app.main_system_client import MainSystemClient
from app.messages import get_message
from app.models import Conversation
from app.whatsapp import WhatsAppClient


class BaseFlowHandler(ABC):
    def __init__(self, db: Session, whatsapp: WhatsAppClient, main_system: MainSystemClient) -> None:
        self.db = db
        self.whatsapp = whatsapp
        self.main_system = main_system

    @abstractmethod
    async def handle(self, conversation: Conversation, inbound: dict) -> None: ...

    def _data(self, conversation: Conversation) -> dict:
        return json.loads(conversation.data_json or "{}")

    def _save_data(self, conversation: Conversation, data: dict) -> None:
        conversation.data_json = json.dumps(data, ensure_ascii=True)
        self.db.commit()

    def _reset(self, conversation: Conversation) -> None:
        conversation.current_flow = None
        conversation.current_step = None
        conversation.data_json = "{}"
        self.db.commit()

    async def _advance(self, conversation: Conversation, data: dict, next_step: str, message_key: str) -> None:
        conversation.current_step = next_step
        conversation.data_json = json.dumps(data, ensure_ascii=True)
        self.db.commit()
        await self.whatsapp.send_text(conversation.phone, get_message(self.db, message_key))

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
