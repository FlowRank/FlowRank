from datetime import datetime

from pydantic import BaseModel


class LinkSchema(BaseModel):
    compte_id: int
    provider: str
    account_email: str | None = None
    oauth_refresh_token: str | None = None
    access_token: str | None = None
    access_token_expires_at: datetime | None = None
