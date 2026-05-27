import base64
import json
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import MockClient, MockOperation, MockPolicy


def get_client_by_phone(db: Session, phone: str) -> dict | None:
    client = db.query(MockClient).filter(MockClient.phone == phone, MockClient.active.is_(True)).first()
    if not client:
        return None
    return {"id": client.id, "phone": client.phone, "full_name": client.full_name, "active": client.active}


def list_policies(db: Session, phone: str) -> list[dict]:
    client = db.query(MockClient).filter(MockClient.phone == phone, MockClient.active.is_(True)).first()
    if not client:
        return []
    policies = (
        db.query(MockPolicy)
        .filter(MockPolicy.client_id == client.id, MockPolicy.active.is_(True))
        .order_by(MockPolicy.policy_number)
        .all()
    )
    return [policy_to_dict(policy) for policy in policies]


def get_policy_for_phone(db: Session, phone: str, policy_id: int) -> dict | None:
    client = db.query(MockClient).filter(MockClient.phone == phone, MockClient.active.is_(True)).first()
    if not client:
        return None
    policy = (
        db.query(MockPolicy)
        .filter(MockPolicy.id == policy_id, MockPolicy.client_id == client.id, MockPolicy.active.is_(True))
        .first()
    )
    return policy_to_dict(policy) if policy else None


def get_circulation_card(db: Session, phone: str, policy_id: int) -> dict | None:
    policy = get_policy_for_phone(db, phone, policy_id)
    if not policy:
        return None
    content = f"Tarjeta de circulacion mock para {policy['policy_number']} - {policy['domain']}"
    return {
        "filename": f"tarjeta-{policy['policy_number']}.pdf",
        "mime_type": "application/pdf",
        "content_base64": base64.b64encode(content.encode("utf-8")).decode("ascii"),
    }


def register_payment_receipt(db: Session, phone: str, payload: dict) -> dict:
    return create_operation(db, "payment_receipt", phone, "PAY", payload)


def register_claim(db: Session, phone: str, payload: dict) -> dict:
    return create_operation(db, "claim", phone, "SIN", payload)


def create_operation(db: Session, operation_type: str, phone: str, prefix: str, payload: dict) -> dict:
    reference = f"{prefix}-{uuid4().hex[:8].upper()}"
    op = MockOperation(
        operation_type=operation_type,
        phone=phone,
        reference=reference,
        payload_json=json.dumps(payload, ensure_ascii=True),
    )
    db.add(op)
    db.commit()
    return {"reference": reference, "status": "ok"}


def policy_to_dict(policy: MockPolicy) -> dict:
    return {
        "id": policy.id,
        "policy_number": policy.policy_number,
        "insurance_type": policy.insurance_type,
        # Categoría de la rama del seguro (categoria enum del panel).
        "category": policy.category,
        # Cobertura del catálogo del tipo de seguro (coberturas.nombre del panel).
        "coverage": policy.coverage_name,
        "domain": policy.domain,
        "description": policy.description,
    }
