import base64

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app import mock_system


class MainSystemClient:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    @property
    def use_mock(self) -> bool:
        return self.settings.main_system_base_url == "mock"

    async def get_client_by_phone(self, phone: str) -> dict | None:
        if self.use_mock:
            return mock_system.get_client_by_phone(self.db, phone)
        return await self._get_optional(f"/clients/by-phone/{phone}")

    async def list_policies(self, phone: str) -> list[dict]:
        if self.use_mock:
            return mock_system.list_policies(self.db, phone)
        data = await self._get("/policies", params={"phone": phone})
        return data.get("items", data if isinstance(data, list) else [])

    async def get_policy_for_phone(self, phone: str, policy_id: int) -> dict | None:
        if self.use_mock:
            return mock_system.get_policy_for_phone(self.db, phone, policy_id)
        return await self._get_optional(f"/policies/{policy_id}", params={"phone": phone})

    async def create_policy_request(self, phone: str, payload: dict) -> dict:
        if self.use_mock:
            return mock_system.create_policy_request(self.db, phone, payload)
        return await self._post("/policy-requests", {"phone": phone, **payload})

    async def get_circulation_card(self, phone: str, policy_id: int) -> dict | None:
        if self.use_mock:
            return mock_system.get_circulation_card(self.db, phone, policy_id)
        return await self._post_optional("/circulation-card", {"phone": phone, "policy_id": policy_id})

    async def register_payment_receipt(self, phone: str, payload: dict) -> dict:
        if self.use_mock:
            return mock_system.register_payment_receipt(self.db, phone, payload)
        return await self._post("/payment-receipts", {"phone": phone, **payload})

    async def register_claim(self, phone: str, payload: dict) -> dict:
        if self.use_mock:
            return mock_system.register_claim(self.db, phone, payload)
        return await self._post("/claims", {"phone": phone, **payload})

    async def _get(self, path: str, params: dict | None = None) -> dict:
        async with httpx.AsyncClient(base_url=self.settings.main_system_base_url, timeout=30) as client:
            response = await client.get(path, params=params, headers=self._headers())
            response.raise_for_status()
            return response.json()

    async def _get_optional(self, path: str, params: dict | None = None) -> dict | None:
        async with httpx.AsyncClient(base_url=self.settings.main_system_base_url, timeout=30) as client:
            response = await client.get(path, params=params, headers=self._headers())
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()

    async def _post(self, path: str, payload: dict) -> dict:
        async with httpx.AsyncClient(base_url=self.settings.main_system_base_url, timeout=30) as client:
            response = await client.post(path, json=payload, headers=self._headers())
            response.raise_for_status()
            return response.json()

    async def _post_optional(self, path: str, payload: dict) -> dict | None:
        async with httpx.AsyncClient(base_url=self.settings.main_system_base_url, timeout=30) as client:
            response = await client.post(path, json=payload, headers=self._headers())
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()

    def _headers(self) -> dict:
        return {"X-API-Key": self.settings.main_system_api_key}


def media_payload(media: dict, content: bytes | None = None) -> dict:
    encoded = base64.b64encode(content or b"").decode("ascii") if content is not None else None
    return {
        "media_id": media.get("id"),
        "mime_type": media.get("mime_type"),
        "filename": media.get("filename"),
        "content_base64": encoded,
    }
