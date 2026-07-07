import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.dao.account import CompteDao
from back.dao.link import LinkDao
from back.dao.mail import MailDao
from back.dao.schemas.mail import MailSchema
from back.utils.google.auth import get_google_token
from back.utils.google.gmail import get_google_mails
from back.workflows.mail_fetch.gmail import gmail_messages_to_schemas

logger = logging.getLogger(__name__)


def _insert_mail(db: Session, mail_schema: MailSchema) -> None:
    try:
        MailDao(db).create(mail_schema)
        logger.info(
            "[mail_fetch] inserted link_id=%s provider_message_id=%s",
            mail_schema.link_id,
            mail_schema.provider_message_id,
        )
    except IntegrityError:
        db.rollback()
        logger.info(
            "[mail_fetch] duplicate link_id=%s provider_message_id=%s",
            mail_schema.link_id,
            mail_schema.provider_message_id,
        )
    except Exception as exc:
        db.rollback()
        logger.error(
            "[mail_fetch] insert error link_id=%s provider_message_id=%s error=%s",
            mail_schema.link_id,
            mail_schema.provider_message_id,
            exc,
        )


def fetch_gmail_mails_for_link(db: Session, link_id: int, refresh_token: str) -> int:
    """Récupère les mails Gmail d'un link et les persiste. Retourne le nombre traité."""

    access_token = get_google_token(refresh_token)
    raw_messages = get_google_mails(access_token, refresh_token)
    mail_schemas = gmail_messages_to_schemas(raw_messages, link_id)

    for mail_schema in mail_schemas:
        _insert_mail(db, mail_schema)

    return len(mail_schemas)


def fetch_all_gmail_mails(db: Session) -> None:
    """Synchronise les boîtes Gmail de tous les comptes ayant un link OAuth."""

    accounts = CompteDao(db).get_all_accounts()
    logger.info("[mail_fetch] accounts_found=%s", len(accounts))

    for account in accounts:
        links = LinkDao(db).get_all_by_account_and_provider(account.id, "gmail")
        active_links = [link for link in links if link.oauth_refresh_token]

        if not active_links:
            logger.warning("[mail_fetch] no_gmail_link account=%s", account.email)
            continue

        for link in active_links:
            try:
                logger.info(
                    "[mail_fetch] processing account=%s link_id=%s mailbox=%s",
                    account.email,
                    link.id,
                    link.account_email,
                )
                count = fetch_gmail_mails_for_link(db, link.id, link.oauth_refresh_token)
                logger.info(
                    "[mail_fetch] total_mails_found=%s account=%s link_id=%s",
                    count,
                    account.email,
                    link.id,
                )
            except Exception as exc:
                logger.error(
                    "[mail_fetch] account=%s link_id=%s error=%s",
                    account.email,
                    link.id,
                    exc,
                )
