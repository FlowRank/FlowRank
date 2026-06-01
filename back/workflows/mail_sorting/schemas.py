from datetime import datetime

from pydantic import BaseModel, Field


class EmailToSort(BaseModel):
    """Représentation minimale d'un email en entrée du workflow de tri."""

    id: str
    subject: str = ""
    sender: str = ""
    snippet: str = ""
    body: str = ""
    received_at: datetime | None = None
    labels: list[str] = Field(default_factory=list)


class SortedMail(BaseModel):
    """Résultat produit par un MailSorter pour un email."""

    email_id: str
    category: str
    priority: int = 0
    reason: str | None = None
    labels_to_add: list[str] = Field(default_factory=list)
