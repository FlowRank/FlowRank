import logging
import os

from back import config
from back.dao.connection import SessionLocal
from back.workflows.mail_fetch import fetch_all_gmail_mails

LOG_DIR = config.LOG_DIR
LOG_FILE = f"{LOG_DIR}/fetch_mails.log"

os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("back.workflows.mail_fetch")
if not any(
    isinstance(h, logging.FileHandler) and getattr(h, "baseFilename", None) == LOG_FILE
    for h in logger.handlers
):
    _file_handler = logging.FileHandler(LOG_FILE)
    _file_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
    logger.addHandler(_file_handler)


def get_mails() -> None:
    """Point d'entrée du job planifié (scheduler dans main.py)."""
    db = SessionLocal()
    try:
        fetch_all_gmail_mails(db)
    finally:
        db.close()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )
    get_mails()


if __name__ == "__main__":
    main()
