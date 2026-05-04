from pydantic import BaseModel, Field


class OutboundMessageRequest(BaseModel):
    phone: str = Field(min_length=6)
    message: str = Field(min_length=1)


class OutboundTemplateRequest(BaseModel):
    phone: str = Field(min_length=6)
    template_name: str = Field(min_length=1)
    language_code: str = "es_AR"
    components: list = Field(default_factory=list)


class PolicyRequestPayload(BaseModel):
    phone: str
    insurance_type: str
    domain: str | None = None
    brand: str | None = None
    model: str | None = None
    year: str | None = None
    use: str | None = None
    notes: str | None = None


class CirculationCardPayload(BaseModel):
    phone: str
    policy_id: int


class PaymentReceiptPayload(BaseModel):
    phone: str
    policy_id: int | None = None
    file: dict


class ClaimPayload(BaseModel):
    phone: str
    payload: dict
