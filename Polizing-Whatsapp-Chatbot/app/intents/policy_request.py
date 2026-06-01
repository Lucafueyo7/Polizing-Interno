from app.intents.base import BaseFlowHandler
from app.messages import get_message
from app.models import Conversation


# Steps secuenciales (sin requerir poliza previa):
#   insurance_type -> domain -> brand -> model -> year -> use -> notes
class PolicyRequestHandler(BaseFlowHandler):
    async def handle(self, conversation: Conversation, inbound: dict) -> None:
        text = (inbound.get("text") or "").strip()
        data = self._data(conversation)
        step = conversation.current_step

        if step == "insurance_type":
            choice = text.strip()
            if choice not in ("1", "2"):
                await self._invalid(conversation, "policy_request_type_prompt")
                return
            data["insurance_type"] = "auto" if choice == "1" else "moto"
            await self._advance(conversation, data, "domain", "policy_request_domain_prompt")
            return

        if step == "domain":
            if not text:
                await self._invalid(conversation, "policy_request_domain_prompt")
                return
            data["domain"] = text.upper()
            await self._advance(conversation, data, "brand", "policy_request_brand_prompt")
            return

        if step == "brand":
            if not text:
                await self._invalid(conversation, "policy_request_brand_prompt")
                return
            data["brand"] = text
            await self._advance(conversation, data, "model", "policy_request_model_prompt")
            return

        if step == "model":
            if not text:
                await self._invalid(conversation, "policy_request_model_prompt")
                return
            data["model"] = text
            await self._advance(conversation, data, "year", "policy_request_year_prompt")
            return

        if step == "year":
            if len(text) != 4 or not text.isdigit():
                await self.whatsapp.send_text(
                    conversation.phone, get_message(self.db, "policy_request_invalid_year")
                )
                return
            data["year"] = text
            await self._advance(conversation, data, "use", "policy_request_use_prompt")
            return

        if step == "use":
            choice = text.strip()
            if choice not in ("1", "2"):
                await self._invalid(conversation, "policy_request_use_prompt")
                return
            data["use"] = "particular" if choice == "1" else "comercial"
            await self._advance(conversation, data, "notes", "policy_request_notes_prompt")
            return

        if step == "notes":
            data["notes"] = "" if text == "-" else text
            payload = {
                "insurance_type": data["insurance_type"],
                "domain": data["domain"],
                "brand": data["brand"],
                "model": data["model"],
                "year": data["year"],
                "use": data["use"],
                "notes": data.get("notes", ""),
            }
            result = await self.main_system.register_policy_request(conversation.phone, payload)
            self._reset(conversation)
            await self.whatsapp.send_text(
                conversation.phone,
                get_message(self.db, "policy_request_success", reference=result["reference"]),
            )
            await self.whatsapp.send_text(conversation.phone, get_message(self.db, "welcome_menu"))
            return

    async def _invalid(self, conversation: Conversation, message_key: str) -> None:
        await self.whatsapp.send_text(
            conversation.phone, get_message(self.db, "policy_request_invalid_choice")
        )
        await self.whatsapp.send_text(conversation.phone, get_message(self.db, message_key))
