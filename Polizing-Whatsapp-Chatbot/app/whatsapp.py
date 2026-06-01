import base64
import json
import logging

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import OutboundMessage


logger = logging.getLogger(__name__)


class WhatsAppClient:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.base_url = f"https://graph.facebook.com/{self.settings.whatsapp_api_version}"

    async def send_text(self, phone: str, text: str) -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"preview_url": False, "body": text},
        }
        return await self._send(phone, "text", text, payload)

    async def send_template(self, phone: str, template_name: str, language_code: str = "es_AR", components: list | None = None) -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language_code},
                "components": components or [],
            },
        }
        return await self._send(phone, "template", template_name, payload)

    async def send_document_base64(self, phone: str, filename: str, mime_type: str, content_base64: str, caption: str | None = None) -> dict:
        # WhatsApp requires media upload before sending documents. For the MVP mock we keep a technical trace
        # and return the document metadata; real upload can be enabled when production credentials are present.
        if self.settings.whatsapp_access_token == "change-me":
            content = f"MOCK_DOCUMENT:{filename}:{mime_type}:{len(base64.b64decode(content_base64))}"
            self._store(phone, "document", content, "mocked", {"filename": filename, "caption": caption})
            return {"mocked": True, "filename": filename}

        media_id = await self.upload_media(filename, mime_type, base64.b64decode(content_base64))
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "document",
            "document": {"id": media_id, "filename": filename, "caption": caption or ""},
        }
        return await self._send(phone, "document", filename, payload)

    async def download_media(self, media_id: str) -> bytes:
        if self.settings.whatsapp_access_token == "change-me":
            return b""
        async with httpx.AsyncClient(timeout=60) as client:
            meta = await client.get(f"{self.base_url}/{media_id}", headers=self._headers())
            meta.raise_for_status()
            url = meta.json()["url"]
            response = await client.get(url, headers=self._headers())
            response.raise_for_status()
            return response.content

    async def upload_media(self, filename: str, mime_type: str, content: bytes) -> str:
        async with httpx.AsyncClient(timeout=60) as client:
            files = {"file": (filename, content, mime_type)}
            data = {"messaging_product": "whatsapp", "type": mime_type}
            response = await client.post(
                f"{self.base_url}/{self.settings.whatsapp_phone_number_id}/media",
                headers=self._headers(),
                data=data,
                files=files,
            )
            response.raise_for_status()
            return response.json()["id"]

    async def _send(self, phone: str, message_type: str, content: str, payload: dict) -> dict:
        if self.settings.whatsapp_access_token == "change-me":
            self._store(phone, message_type, content, "mocked", {"payload": payload})
            return {"mocked": True}

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{self.base_url}/{self.settings.whatsapp_phone_number_id}/messages",
                    headers=self._headers(),
                    json=payload,
                )
        except httpx.RequestError as exc:
            body = {"error": "whatsapp_request_failed", "detail": str(exc)}
            self._store(phone, message_type, content, "failed", body)
            logger.warning("WhatsApp request failed for %s: %s", phone, exc)
            return {"sent": False, **body}

        body = response_body(response)
        status = "sent" if response.is_success else "failed"
        self._store(phone, message_type, content, status, body)
        if not response.is_success:
            logger.warning("WhatsApp API rejected message for %s: %s", phone, body)
            return {"sent": False, "status_code": response.status_code, "response": body}
        return {"sent": True, "response": body}

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.settings.whatsapp_access_token}"}

    def _store(self, phone: str, message_type: str, content: str, status: str, response: dict) -> None:
        self.db.add(
            OutboundMessage(
                phone=phone,
                message_type=message_type,
                content=content,
                status=status,
                response_json=json.dumps(response, ensure_ascii=True),
            )
        )
        self.db.commit()


def response_body(response: httpx.Response) -> dict:
    if not response.content:
        return {}
    try:
        return response.json()
    except json.JSONDecodeError:
        return {"raw": response.text}


def extract_messages(payload: dict) -> list[dict]:
    messages: list[dict] = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                messages.append(message)
    return messages


def parse_inbound_message(message: dict) -> dict:
    message_type = message.get("type", "unknown")
    parsed = {
        "id": message.get("id"),
        "phone": message.get("from"),
        "type": message_type,
        "text": None,
        "media": None,
    }
    if message_type == "text":
        parsed["text"] = message.get("text", {}).get("body", "").strip()
    elif message_type == "interactive":
        interactive = message.get("interactive", {})
        parsed["text"] = (
            interactive.get("button_reply", {}).get("id")
            or interactive.get("list_reply", {}).get("id")
            or interactive.get("button_reply", {}).get("title")
            or interactive.get("list_reply", {}).get("title")
        )
    elif message_type in {"image", "document"}:
        media = message.get(message_type, {})
        parsed["media"] = {
            "id": media.get("id"),
            "mime_type": media.get("mime_type"),
            "filename": media.get("filename") or f"whatsapp-{message.get('id')}.{message_type}",
        }
    return parsed
