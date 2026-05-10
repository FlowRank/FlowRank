from datetime import datetime
from typing import Optional, Any, Dict

from pydantic import BaseModel


class MailSchema(BaseModel):
    link_id: int
    provider_message_id: str
    sender_email: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    folder_label: Optional[str] = None
    received_at: Optional[datetime] = None
    priority_score: Optional[float] = None
    extras: Optional[Dict[str, Any]] = None