import base64
from contextlib import asynccontextmanager

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app import mock_system


_PATH_CLIENT_BY_PHONE  = "/clients/by-phone/{phone}"
_PATH_POLICIES         = "/policies"
_PATH_POLICY           = "/policies/{policy_id}"
_PATH_CIRCULATION_CARD = "/circulation-card"
_PATH_PAYMENT_RECEIPTS = "/payment-receipts"
_PATH_CLAIMS           = "/claims"


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
        return await self._get_optional(_PATH_CLIENT_BY_PHONE.format(phone=phone))

    async def list_policies(self, phone: str) -> list[dict]:
        if self.use_mock:
            return mock_system.list_policies(self.db, phone)
        data = await self._get(_PATH_POLICIES, params={"phone": phone})
        return data.get("items", data if isinstance(data, list) else [])

    async def get_policy_for_phone(self, phone: str, policy_id: int) -> dict | None:
        if self.use_mock:
            return mock_system.get_policy_for_phone(self.db, phone, policy_id)
        return await self._get_optional(_PATH_POLICY.format(policy_id=policy_id), params={"phone": phone})

    async def get_circulation_card(self, phone: str, policy_id: int) -> dict | None:
        if self.use_mock:
            return mock_system.get_circulation_card(self.db, phone, policy_id)
        return await self._post_optional(_PATH_CIRCULATION_CARD, {"phone": phone, "policy_id": policy_id})

    async def register_payment_receipt(self, phone: str, payload: dict) -> dict:
        if self.use_mock:
            return mock_system.register_payment_receipt(self.db, phone, payload)
        return await self._post(_PATH_PAYMENT_RECEIPTS, {"phone": phone, **payload})

    async def register_claim(self, phone: str, payload: dict) -> dict:
        if self.use_mock:
            return mock_system.register_claim(self.db, phone, payload)
        return await self._post(_PATH_CLAIMS, {"phone": phone, **payload})

    @asynccontextmanager
    async def _http(self):
        async with httpx.AsyncClient(
            base_url=self.settings.main_system_base_url,
            headers=self._headers(),
            timeout=30,
        ) as client:
            yield client

    async def _get(self, path: str, params: dict | None = None) -> dict:
        async with self._http() as client:
            response = await client.get(path, params=params)
            response.raise_for_status()
            return response.json()

    async def _get_optional(self, path: str, params: dict | None = None) -> dict | None:
        async with self._http() as client:
            response = await client.get(path, params=params)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()

    async def _post(self, path: str, payload: dict) -> dict:
        async with self._http() as client:
            response = await client.post(path, json=payload)
            response.raise_for_status()
            return response.json()

    async def _post_optional(self, path: str, payload: dict) -> dict | None:
        async with self._http() as client:
            response = await client.post(path, json=payload)
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
