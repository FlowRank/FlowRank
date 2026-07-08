from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LabelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    color: str


class MailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    link_id: int
    provider_message_id: str
    sender_email: str | None = None
    recipient_email: str | None = None
    subject: str | None = None
    body: str | None = None
    received_at: datetime | None = None
    created_at: datetime | None = None
    labels: list[LabelOut] = Field(default_factory=list)


class MailboxCountOut(BaseModel):
    link_id: int
    count: int


class DashboardStatsOut(BaseModel):
    total_count: int
    by_link: list[MailboxCountOut] = Field(default_factory=list)
