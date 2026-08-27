from datetime import datetime, timezone

from pydantic import BaseModel, Field

from .enums import PaymentStatus


class PaymentDoc(BaseModel):
    id: str = Field(alias="_id")
    booking_id: str
    amount: int
    transaction_id: str
    method: str = "DEMO_UPI"
    status: PaymentStatus = PaymentStatus.SUCCESS
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}
