from datetime import datetime

from pydantic import BaseModel


class MailSchema(BaseModel):
    link_id: int
    provider_message_id: str
    sender_email: str | None = None
    recipient_email: str | None = None
    subject: str | None = None
    body: str | None = None
    received_at: datetime | None = None
