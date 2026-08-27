from datetime import datetime, timezone

from pydantic import BaseModel, Field

from .enums import NotificationType


class NotificationDoc(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    type: NotificationType
    title: str
    body: str
    read: bool = False
    data: dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}
