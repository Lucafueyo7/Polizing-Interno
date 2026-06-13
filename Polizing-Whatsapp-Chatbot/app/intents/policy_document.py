from app.intents.base import BaseFlowHandler
from app.messages import get_message
from app.models import Conversation


class PolicyDocumentHandler(BaseFlowHandler):
    """Obtener la póliza completa (PDF). Espeja a la tarjeta de circulación:
    mismas restricciones (póliza vigente, propia, vehículo) y entrega por link."""

    async def handle(self, conversation: Conversation, inbound: dict, is_corporate: bool) -> None:
        policy = await self._selected_policy(conversation, inbound)
        if not policy:
            return
        doc = await self.main_system.get_policy_document(conversation.phone, policy["id"])
        self._reset(conversation)
        if not doc:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_doc_not_found"))
        elif doc.get("mode") == "link":
            await self.whatsapp.send_text(
                conversation.phone,
                get_message(self.db, "policy_doc_link", link=doc["source_url"]),
            )
        else:
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "policy_doc_success"))
            await self.whatsapp.send_document_base64(
                conversation.phone,
                doc["filename"],
                doc["mime_type"],
                doc["content_base64"],
                caption="Poliza",
            )
        await self._send_menu(conversation, is_corporate)
