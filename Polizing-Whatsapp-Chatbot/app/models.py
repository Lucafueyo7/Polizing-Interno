from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EditableMessage(Base):
    __tablename__ = "editable_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(180))
    content: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    current_flow: Mapped[str | None] = mapped_column(String(60), nullable=True)
    current_step: Mapped[str | None] = mapped_column(String(80), nullable=True)
    data_json: Mapped[str] = mapped_column(Text, default="{}")
    last_inbound_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReceivedMessage(Base):
    __tablename__ = "received_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    whatsapp_message_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    phone: Mapped[str] = mapped_column(String(40), index=True)
    message_type: Mapped[str] = mapped_column(String(40))
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payload_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class OutboundMessage(Base):
    __tablename__ = "outbound_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(40), index=True)
    message_type: Mapped[str] = mapped_column(String(40))
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="pending")
    response_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MockClient(Base):
    __tablename__ = "mock_clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(180))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    policies: Mapped[list["MockPolicy"]] = relationship(back_populates="client")


class MockPolicy(Base):
    __tablename__ = "mock_policies"
    __table_args__ = (UniqueConstraint("policy_number", name="uq_mock_policy_number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("mock_clients.id"))
    policy_number: Mapped[str] = mapped_column(String(80), index=True)
    # Mantiene el nombre histórico; mapea al `tipos_seguro.nombre` del panel.
    insurance_type: Mapped[str] = mapped_column(String(60))
    # Categoría de la rama del seguro (enum del panel `CategoriaSeguro`).
    category: Mapped[str] = mapped_column(String(20), default="auto")
    # Nombre de la cobertura del catálogo del panel (`coberturas.nombre`).
    coverage_name: Mapped[str] = mapped_column(String(60), default="todo_riesgo")
    domain: Mapped[str] = mapped_column(String(20), index=True)
    description: Mapped[str] = mapped_column(String(180))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    client: Mapped[MockClient] = relationship(back_populates="policies")


class MockOperation(Base):
    __tablename__ = "mock_operations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    operation_type: Mapped[str] = mapped_column(String(80), index=True)
    phone: Mapped[str] = mapped_column(String(40), index=True)
    reference: Mapped[str] = mapped_column(String(80), index=True)
    payload_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
