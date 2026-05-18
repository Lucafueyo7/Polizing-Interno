from app.intents.base import BaseFlowHandler
from app.intents.utils import valid_media
from app.main_system_client import media_payload
from app.messages import get_message
from app.models import Conversation


class PaymentReceiptHandler(BaseFlowHandler):
    async def handle(self, conversation: Conversation, inbound: dict) -> None:
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
