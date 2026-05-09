from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LinkSchema(BaseModel):
    compte_id: int
    provider: str
    account_email: Optional[str] = None
    oauth_refresh_token: Optional[str] = None
    access_token: Optional[str] = None
    access_token_expires_at: Optional[datetime] = None