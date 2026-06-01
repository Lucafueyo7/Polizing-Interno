import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.config import get_settings
from app.conversation import ConversationEngine
from app.database import get_db
from app.main_system_client import MainSystemClient
from app.mock_system import get_circulation_card, get_client_by_phone, list_policies, register_claim, register_payment_receipt
from app.schemas import CirculationCardPayload, ClaimPayload, OutboundMessageRequest, OutboundTemplateRequest, PaymentReceiptPayload
from app.security import require_outbound_api_key
from app.whatsapp import WhatsAppClient, extract_messages, parse_inbound_message


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/webhooks/whatsapp")
def verify_whatsapp_webhook(request: Request):
    settings = get_settings()
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if mode == "subscribe" and token == settings.whatsapp_verify_token and challenge:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Webhook verification failed")


@router.post("/webhooks/whatsapp")
async def receive_whatsapp_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.json()
    engine = ConversationEngine(db)
    processed = 0
    failed = 0
    for raw_message in extract_messages(payload):
        try:
            await engine.process(parse_inbound_message(raw_message))
            processed += 1
        except Exception:
            failed += 1
            logger.exception("Failed to process WhatsApp message: %s", raw_message.get("id"))
    return {"status": "ok", "processed": processed, "failed": failed}


@router.post("/api/outbound/messages", dependencies=[Depends(require_outbound_api_key)])
async def send_outbound_message(payload: OutboundMessageRequest, db: Session = Depends(get_db)) -> dict:
    client = MainSystemClient(db)
    registered = await client.get_client_by_phone(payload.phone)
    if not registered:
        raise HTTPException(status_code=404, detail="Client not found")
    result = await WhatsAppClient(db).send_text(payload.phone, payload.message)
    return {"status": "ok", "result": result}


@router.post("/api/outbound/templates", dependencies=[Depends(require_outbound_api_key)])
async def send_outbound_template(payload: OutboundTemplateRequest, db: Session = Depends(get_db)) -> dict:
    client = MainSystemClient(db)
    registered = await client.get_client_by_phone(payload.phone)
    if not registered:
        raise HTTPException(status_code=404, detail="Client not found")
    result = await WhatsAppClient(db).send_template(payload.phone, payload.template_name, payload.language_code, payload.components)
    return {"status": "ok", "result": result}


@router.get("/mock/clients/by-phone/{phone}")
def mock_client_by_phone(phone: str, db: Session = Depends(get_db)) -> dict:
    client = get_client_by_phone(db, phone)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.get("/mock/policies")
def mock_policies(phone: str, db: Session = Depends(get_db)) -> dict:
    return {"items": list_policies(db, phone)}


@router.post("/mock/circulation-card")
def mock_circulation_card(payload: CirculationCardPayload, db: Session = Depends(get_db)) -> dict:
    card = get_circulation_card(db, payload.phone, payload.policy_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("/mock/payment-receipts")
def mock_payment_receipt(payload: PaymentReceiptPayload, db: Session = Depends(get_db)) -> dict:
    return register_payment_receipt(db, payload.phone, payload.model_dump())


@router.post("/mock/claims")
def mock_claim(payload: ClaimPayload, db: Session = Depends(get_db)) -> dict:
    return register_claim(db, payload.phone, payload.payload)
