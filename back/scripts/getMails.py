import base64
import quopri
import logging
import os
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.exc import IntegrityError
from back.dao.account import CompteDao
from back.dao.link import LinkDao
from back.dao.mail import MailDao
from back.utils.google.auth import get_google_token
from back.utils.google.gmail import get_google_mails
from back.dao.connection import SessionLocal
from back.dao.schemas.mail import MailSchema
from back.utils.google.format import html_to_text

LOG_DIR = "/var/log/flowrank"
LOG_FILE = f"{LOG_DIR}/fetch_mails.log"

os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("fetch_mails")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler(LOG_FILE)
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(message)s"
)

file_handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(file_handler)
    
# ---------------- MAIN ----------------

def get_mails():
    db = SessionLocal()

    try:
        accounts = get_accounts(db)

        print(f"[INFO] accounts_found={len(accounts)}")

        for account in accounts:

            link = LinkDao(db).get_by_account_and_provider(account.id, "gmail")

            if not link or not link.oauth_refresh_token:
                logger.warning(f"[WARN] no_gmail_link account={account.email}")
                continue

            try:
                logger.info(f"[INFO] processing_account={account.email}")

                token = generate_token(link.oauth_refresh_token)

                mails = get_mails_by_token(
                    token,
                    link.oauth_refresh_token,
                    link.id
                )

                logger.info(f"[INFO] total_mails_found={len(mails)} account={account.email}")
                
                for mail in mails:
                    mail_schema = MailSchema.model_validate(mail)
                    insert_mail(db, mail_schema)

            except Exception as e:
                logger.error(f"[ACCOUNT ERROR] account={account.email} error={str(e)}")

    finally:
        db.close()


# ---------------- HELPERS ----------------

def get_accounts(db):
    return CompteDao(db).get_all_accounts()


def insert_mail(db, mail_schema: MailSchema):
    try:
        MailDao(db).create(mail_schema)
        logger.info(f"[MAIL INSERTED] link_id={mail_schema.link_id} provider_message_id={mail_schema.provider_message_id}")
    except IntegrityError:
        db.rollback()
        logger.info(f"[DUPLICATE MAIL] link_id={mail_schema.link_id} provider_message_id={mail_schema.provider_message_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"[MAIL INSERT ERROR] link_id={mail_schema.link_id} provider_message_id={mail_schema.provider_message_id} error={str(e)}")


def generate_token(refresh_token):
    return get_google_token(refresh_token)


def get_mails_by_token(token, refresh_token, link_id):
    mails_raw = get_google_mails(token, refresh_token)

    return [
        gmail_to_mail_schema(mail, link_id)
        for mail in mails_raw
    ]


# ---------------- DECODING ----------------

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
    except:
        return decoded_bytes.decode("windows-1252", errors="ignore")


def gmail_to_mail_schema(message: Dict[str, Any], link_id: int):
    payload = message.get("payload", {})
    headers = payload.get("headers", [])

    def get_header(name: str):
        return next(
            (h["value"] for h in headers if h["name"].lower() == name.lower()),
            None
        )

    subject = get_header("Subject")
    sender = get_header("From")

    provider_message_id = message.get("id")

    internal_date = message.get("internalDate")
    received_at = (
        datetime.fromtimestamp(int(internal_date) / 1000)
        if internal_date else None
    )

    body = ""
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
        "body": body,
        "folder_label": None,
        "received_at": received_at,
        "priority_score": None,
        "extras": {
            "gmail_id": provider_message_id,
            "snippet": message.get("snippet"),
        },
    }