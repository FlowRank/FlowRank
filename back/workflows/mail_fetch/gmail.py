import base64
import logging
import quopri
from datetime import datetime
from typing import Any

from back.dao.schemas.mail import MailSchema
from back.utils.google.format import html_to_text

logger = logging.getLogger(__name__)


def decode_gmail_body(data: str, charset: str = "utf-8") -> str:
    if not data:
        return ""

    missing_padding = len(data) % 4
    if missing_padding:
        data += "=" * (4 - missing_padding)

    raw_bytes = base64.urlsafe_b64decode(data)
    decoded_bytes = quopri.decodestring(raw_bytes)

    try:
        return decoded_bytes.decode(charset, errors="ignore")
    except (UnicodeDecodeError, LookupError):
        return decoded_bytes.decode("windows-1252", errors="ignore")


def gmail_to_mail_schema(message: dict[str, Any], link_id: int) -> dict[str, Any]:
    payload = message.get("payload", {})
    headers = payload.get("headers", [])

    def get_header(name: str) -> str | None:
        return next((h["value"] for h in headers if h["name"].lower() == name.lower()), None)

    subject = get_header("Subject")
    sender = get_header("From")
    provider_message_id = message.get("id")

    internal_date = message.get("internalDate")
    received_at = datetime.fromtimestamp(int(internal_date) / 1000) if internal_date else None

    raw_body = ""
    if payload.get("body", {}).get("data"):
        raw_body = decode_gmail_body(payload["body"]["data"])
    else:
        for part in payload.get("parts", []):
            if part.get("mimeType") in ["text/html", "text/plain"]:
                data = part.get("body", {}).get("data")
                if data:
                    raw_body = decode_gmail_body(data)
                    break

    body = html_to_text(raw_body)

    return {
        "link_id": link_id,
        "provider_message_id": provider_message_id,
        "sender_email": sender,
        "subject": subject,
        "body": body or message.get("snippet"),
        "received_at": received_at,
    }


def gmail_messages_to_schemas(
    messages: list[dict[str, Any]],
    link_id: int,
) -> list[MailSchema]:
    return [MailSchema.model_validate(gmail_to_mail_schema(msg, link_id)) for msg in messages]
