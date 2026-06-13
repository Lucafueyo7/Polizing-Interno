from pydantic import BaseModel, Field


class OutboundMessageRequest(BaseModel):
    phone: str = Field(min_length=6)
    message: str = Field(min_length=1)


class OutboundTemplateRequest(BaseModel):
    phone: str = Field(min_length=6)
    template_name: str = Field(min_length=1)
    language_code: str = "es_AR"
    components: list = Field(default_factory=list)


class CirculationCardPayload(BaseModel):
    phone: str
    policy_id: int


class PaymentReceiptPayload(BaseModel):
    phone: str
    policies: list[dict] = []
    files: list[dict] = []


class ClaimPayload(BaseModel):
    phone: str
    payload: dict
