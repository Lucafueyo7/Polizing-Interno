from app.intents.base import BaseFlowHandler
from app.messages import get_message
from app.models import Conversation


class CirculationCardHandler(BaseFlowHandler):
    async def handle(self, conversation: Conversation, inbound: dict, is_corporate: bool) -> None:
        policy = await self._selected_policy(conversation, inbound)
        if not policy:
            return
        card = await self.main_system.get_circulation_card(conversation.phone, policy["id"])
        self._reset(conversation)
        if not card:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "card_not_found"))
        elif card.get("mode") == "link":
            await self.whatsapp.send_text(
                conversation.phone,
                get_message(self.db, "card_link", link=card["source_url"]),
            )
        else:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "card_success"))
            await self.whatsapp.send_document_base64(
                conversation.phone,
                card["filename"],
                card["mime_type"],
                card["content_base64"],
                caption="Tarjeta de circulacion",
            )
        await self._send_menu(conversation, is_corporate)
