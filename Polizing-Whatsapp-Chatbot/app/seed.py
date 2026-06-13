from sqlalchemy.orm import Session

from app.messages import seed_messages
from app.models import MockClient, MockPolicy


def seed_all(db: Session) -> None:
    seed_messages(db)
    seed_mock_data(db)


def seed_mock_data(db: Session) -> None:
    if db.query(MockClient).first():
        return

    # Cliente corporativo: ve la opción de adjuntar comprobantes de pago y tiene
    # pólizas de varias categorías (un pago puede cubrir varias).
    corp = MockClient(
        phone="5491112345678", full_name="Empresa Demo SA", active=True, is_corporate=True
    )
    db.add(corp)
    db.flush()
    db.add_all(
        [
            MockPolicy(
                client_id=corp.id,
                policy_number="AUTO-1001",
                insurance_type="Automotor",
                category="auto",
                coverage_name="todo_riesgo",
                domain="AB123CD",
                description="Auto demo AB123CD",
                active=True,
            ),
            MockPolicy(
                client_id=corp.id,
                policy_number="MOTO-2001",
                insurance_type="Automotor",
                category="auto",
                coverage_name="terceros_completo",
                domain="A123BCD",
                description="Moto demo A123BCD",
                active=True,
            ),
            MockPolicy(
                client_id=corp.id,
                policy_number="COM-3001",
                insurance_type="Comercio",
                category="comercio",
                coverage_name="integral_comercio",
                domain="",
                description="Comercio demo - Local 123",
                active=True,
            ),
        ]
    )

    # Cliente NO corporativo: no debe ver la opción de comprobantes de pago.
    indiv = MockClient(
        phone="5491198765432", full_name="Juan Pérez", active=True, is_corporate=False
    )
    db.add(indiv)
    db.flush()
    db.add(
        MockPolicy(
            client_id=indiv.id,
            policy_number="AUTO-9001",
            insurance_type="Automotor",
            category="auto",
            coverage_name="todo_riesgo",
            domain="CD456EF",
            description="Auto demo CD456EF",
            active=True,
        )
    )
    db.commit()
