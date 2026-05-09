
from datetime import datetime

from back.dao.account import CompteDao
from back.dao.link import LinkDao
from back.dao.mail import MailDao
from back.dao.schemas.mail import MailSchema
from back.utils.google.auth import get_google_token
from back.utils.google.gmail import get_google_mails
from back.dao.connection import SessionLocal
from typing import Optional, Any, Dict
import base64
import quopri

# Parcours tout les comptes et recupere les mails depuis google, les stoque dans la bd si ils n'existent pas deja, et affiche les mails dans la console(pour debug)
def get_mails():
    db = SessionLocal()
    accounts = get_accounts(db)
    for account in accounts:
        link = LinkDao(db).get_by_account_and_provider(account.id, "gmail")
        if link is None:
            print(f"No Gmail link found for account: {account.email}")
            continue
        refresh_token = link.oauth_refresh_token
        link_id = link.id

        print(f"Account: {account.email}, Refresh Token: {refresh_token}")

        if refresh_token :
            token = generate_token(refresh_token)
            mails = get_mails_by_token(token, refresh_token, link_id)
            print(f"Email: {account.email}, Mails: {mails}")
            if mails:
                for mail in mails:
                    mail_schema = MailSchema.model_validate(mail)
                    insert_mail(db, mail_schema)

def get_accounts(db):
    accounts = CompteDao(db).get_all_accounts()
    return accounts

def insert_mail(db, mail_data):
    mail_dao = MailDao(db)
    mail_dao.create(mail_data, "gmail")

def generate_token(refresh_token):
    token = get_google_token(refresh_token)
    return token

def get_mails_by_token(token, refresh_token, link_id):
    mails_raw = get_google_mails(token, refresh_token)
    mails = []
    for mail in mails_raw:
        mail_data = gmail_to_mail_schema(mail, link_id)
        mails.append(mail_data)
    return mails


def decode_gmail_body(data: str, charset: str = "utf-8") -> str:
    if not data:
        return ""

    # 1) base64url Gmail
    missing_padding = len(data) % 4
    if missing_padding:
        data += "=" * (4 - missing_padding)

    raw_bytes = base64.urlsafe_b64decode(data)

    # 2) quoted-printable (très fréquent en HTML emails)
    decoded_bytes = quopri.decodestring(raw_bytes)

    # 3) charset fallback (windows-1252 fréquent en FR)
    try:
        return decoded_bytes.decode(charset, errors="ignore")
    except:
        return decoded_bytes.decode("windows-1252", errors="ignore")
    
def gmail_to_mail_schema(message: Dict[str, Any], link_id: int):
    payload = message.get("payload", {})
    headers = payload.get("headers", [])

    def get_header(name: str) -> Optional[str]:
        for h in headers:
            if h["name"].lower() == name.lower():
                return h["value"]
        return None

    # subject
    subject = get_header("Subject")

    # sender
    sender = get_header("From")

    # message id (unique Gmail provider id)
    provider_message_id = message.get("id")

    # received date
    internal_date = message.get("internalDate")
    received_at = None
    if internal_date:
        received_at = datetime.fromtimestamp(int(internal_date) / 1000)

    # body extraction (multipart safe)
    body = ""

    if payload.get("body", {}).get("data"):
        body = decode_gmail_body(payload["body"]["data"])
    else:
        for part in payload.get("parts", []):
            mime = part.get("mimeType")
            if mime in ["text/plain", "text/html"]:
                data = part.get("body", {}).get("data")
                if data:
                    body = decode_gmail_body(data)
                    break

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