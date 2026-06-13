from app.intents.base import BaseFlowHandler
from app.intents.utils import format_policies, is_keyword, parse_indices, valid_media
from app.main_system_client import media_payload
from app.messages import get_message
from app.models import Conversation


class PaymentReceiptHandler(BaseFlowHandler):
    async def handle(self, conversation: Conversation, inbound: dict, is_corporate: bool) -> None:
        data = self._data(conversation)
        text = (inbound.get("text") or "").strip()

        if conversation.current_step == "select_policy":
            policies = data.get("policies", [])
            indices = parse_indices(text)
            valid = indices is not None and all(0 <= i < len(policies) for i in indices)
            if not valid:
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "invalid_option"))
                await self.whatsapp.send_text(
                    conversation.phone,
                    get_message(self.db, "payment_policy_prompt", policies=format_policies(policies)),
                )
                return
            data["policies"] = [policies[i] for i in indices]
            data["files"] = []
            await self._advance(conversation, data, "file", "payment_file_prompt")
            return

        if conversation.current_step == "file":
            if is_keyword(text, "LISTO") or is_keyword(text, "FINALIZAR"):
                if not data.get("files"):
                    await self.whatsapp.send_text(conversation.phone, get_message(self.db, "payment_no_files"))
                    return
                result = await self.main_system.register_payment_receipt(conversation.phone, data)
                self._reset(conversation)
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "payment_success", reference=result["reference"]))
                await self._send_menu(conversation, is_corporate)
                return
            media = inbound.get("media")
            if not valid_media(media):
                await self.whatsapp.send_text(conversation.phone, get_message(self.db, "payment_invalid_file"))
                return
            content = await self.whatsapp.download_media(media["id"])
            data.setdefault("files", []).append(media_payload(media, content))
            self._save_data(conversation, data)
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "payment_more_files_prompt"))
