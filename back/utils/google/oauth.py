from urllib.parse import urlparse

from fastapi import HTTPException, Request
from starlette import status

GOOGLE_CALLBACK_PATH = "/auth/callback"


def resolve_redirect_uri(request: Request) -> str:
    """Construit redirect_uri = {origin du front}/auth/callback depuis la requête entrante."""

    origin = request.headers.get("origin")
    if not origin:
        referer = request.headers.get("referer")
        if referer:
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                origin = f"{parsed.scheme}://{parsed.netloc}"

    if not origin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Origin or Referer header",
        )

    return f"{origin.rstrip('/')}{GOOGLE_CALLBACK_PATH}"
