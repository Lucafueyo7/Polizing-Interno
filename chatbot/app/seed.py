from sqlalchemy.orm import Session

from app.messages import seed_messages
from app.models import MockClient, MockPolicy


def seed_all(db: Session) -> None:
    seed_messages(db)
    seed_mock_data(db)


def seed_mock_data(db: Session) -> None:
    if db.query(MockClient).first():
        return

    client = MockClient(phone="5491112345678", full_name="Cliente Demo", active=True)
    db.add(client)
    db.flush()
    db.add_all(
        [
            MockPolicy(
                client_id=client.id,
                policy_number="AUTO-1001",
                insurance_type="Automotor",
                category="auto",
                coverage_name="todo_riesgo",
                domain="AB123CD",
                description="Auto demo AB123CD",
                active=True,
            ),
            MockPolicy(
                client_id=client.id,
                policy_number="MOTO-2001",
                insurance_type="Automotor",
                category="auto",
                coverage_name="terceros_completo",
                domain="A123BCD",
                description="Moto demo A123BCD",
                active=True,
            ),
        ]
    )
    db.commit()
