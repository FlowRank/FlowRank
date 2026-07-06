import logging
import os

from back import config
from back.dao.connection import SessionLocal
from back.dao.label import LabelDao
from back.dao.mail import MailDao
from back.dao.models import Link
from back.workflows.mail_sorting import EmailToSort, load_mail_sorter

LOG_DIR = config.LOG_DIR
LOG_FILE = f"{LOG_DIR}/sort_mails.log"

os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("sort_mails")
logger.setLevel(logging.INFO)

_file_handler = logging.FileHandler(LOG_FILE)
_file_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
if not logger.handlers:
    logger.addHandler(_file_handler)


def sort_unlabeled_mails() -> None:
    db = SessionLocal()
    mail_dao = MailDao(db)
    label_dao = LabelDao(db)

    try:
        sorter = load_mail_sorter()
        links = db.query(Link).all()
        logger.info("[sort_mails] links=%s", len(links))

        total_sorted = 0
        for link in links:
            mails = mail_dao.get_unlabeled_by_link_id(
                link.id,
                limit=config.MAIL_SORT_BATCH_SIZE,
            )
            if not mails:
                continue

            logger.info("[sort_mails] link_id=%s unlabeled=%s", link.id, len(mails))

            for mail in mails:
                email = EmailToSort(
                    id=mail.provider_message_id,
                    subject=mail.subject or "",
                    body=mail.body or "",
                    sender=mail.sender_email or "",
                )
                try:
                    result = sorter.sort(email)
                except Exception as exc:
                    logger.error(
                        "[sort_mails] inference_failed mail_id=%s error=%s",
                        mail.id,
                        exc,
                    )
                    continue

                label_names = result.labels_to_add or [result.category]
                for name in label_names:
                    if not name:
                        continue
                    label = label_dao.get_or_create(link.id, name)
                    label_dao.attach_to_mail(mail, label)

                db.commit()
                total_sorted += 1
                logger.info(
                    "[sort_mails] sorted mail_id=%s labels=%s",
                    mail.id,
                    label_names,
                )

        logger.info("[sort_mails] done total_sorted=%s", total_sorted)
    finally:
        db.close()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )
    sort_unlabeled_mails()


if __name__ == "__main__":
    main()
