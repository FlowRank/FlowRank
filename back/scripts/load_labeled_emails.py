import argparse
import logging
import os
from datetime import UTC, datetime, timedelta

from datasets import load_dataset
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.dao.account import CompteDao
from back.dao.link import LinkDao
from back.dao.mail import MailDao
from back.dao.schemas.account import AccountSchema
from back.dao.schemas.link import LinkSchema
from back.dao.schemas.mail import MailSchema
from back.scripts._db import ensure_schema, must_allow_seed
from back.utils.routers.account import hash_password

logger = logging.getLogger(__name__)

HUB_DATASET_ID = "FlowRank/labeled_emails"
DATASET_PROVIDER = "labeled_emails"
BASE_RECEIVED_AT = datetime(2024, 1, 1, tzinfo=UTC)
VALID_SPLITS = frozenset({"train", "test"})


def label_slug(label: str) -> str:
    return label.replace("/", "-").replace(" ", "-")


def resolve_receiver_email() -> str:
    return os.getenv("LABELED_EMAILS_RECEIVER_EMAIL") or os.getenv(
        "DEV_SEED_EMAIL", "dev@flowrank.local"
    )


def ensure_dev_account(db: Session) -> str:
    email = os.getenv("DEV_SEED_EMAIL", "dev@flowrank.local")
    password = os.getenv("DEV_SEED_PASSWORD", "dev")
    compte_dao = CompteDao(db)

    if compte_dao.get_account(email) is not None:
        return email

    try:
        compte_dao.create(
            AccountSchema(
                email=email,
                password=hash_password(password),
            )
        )
        logger.info("[load_labeled_emails] created dev account: %s", email)
    except IntegrityError:
        db.rollback()
        logger.info("[load_labeled_emails] dev account already exists: %s", email)

    return email


def ensure_dataset_link(db: Session, compte_id: int, receiver: str):
    link_dao = LinkDao(db)
    link = link_dao.get_by_account_and_provider(compte_id, DATASET_PROVIDER)
    if link is not None:
        if link.account_email != receiver:
            link_dao.update(link.id, account_email=receiver)
        return link

    return link_dao.create(
        LinkSchema(
            compte_id=compte_id,
            provider=DATASET_PROVIDER,
            account_email=receiver,
        )
    )


def parse_splits(raw: str) -> list[str]:
    splits = [s.strip() for s in raw.split(",") if s.strip()]
    if not splits:
        raise RuntimeError("No splits specified")
    unknown = set(splits) - VALID_SPLITS
    if unknown:
        raise RuntimeError(f"Unknown splits: {', '.join(sorted(unknown))} (use train and/or test)")
    return splits


def load_split(
    db: Session,
    *,
    link_id: int,
    receiver: str,
    split: str,
    with_labels: bool,
) -> tuple[int, int, int]:
    mail_dao = MailDao(db)
    inserted = 0
    skipped = 0
    errors = 0

    logger.info("[load_labeled_emails] loading split=%s from %s", split, HUB_DATASET_ID)
    dataset = load_dataset(HUB_DATASET_ID, split=split)

    for row_index in range(len(dataset)):
        row = dataset[row_index]
        label_name = (row.get("label") or "").strip()
        subject = (row.get("subject") or "").strip()
        body = (row.get("body") or "").strip()
        if not label_name:
            errors += 1
            continue

        provider_message_id = f"hf-labeled-{split}-{row_index}"
        if mail_dao.get_by_provider_message_id(link_id, provider_message_id) is not None:
            skipped += 1
            continue

        slug = label_slug(label_name)
        sender_email = f"labeled-{split}-{row_index}@{slug}.flowrank.local"
        received_at = BASE_RECEIVED_AT + timedelta(minutes=row_index)

        mail_schema = MailSchema(
            link_id=link_id,
            provider_message_id=provider_message_id,
            sender_email=sender_email,
            recipient_email=receiver,
            subject=subject or None,
            body=body or None,
            received_at=received_at,
        )

        try:
            if with_labels:
                mail_dao.create_with_label(mail_schema, label_name)
            else:
                mail_dao.create(mail_schema)
        except IntegrityError:
            db.rollback()
            skipped += 1
            continue
        except Exception:
            db.rollback()
            errors += 1
            continue

        inserted += 1

    return inserted, skipped, errors


def load_labeled_emails(
    db: Session,
    *,
    splits: list[str],
    with_labels: bool,
) -> None:
    receiver = resolve_receiver_email()
    account_email = ensure_dev_account(db)
    account = CompteDao(db).get_account(account_email)
    if account is None:
        raise RuntimeError(f"Dev account not found after ensure: {account_email}")

    link = ensure_dataset_link(db, account.id, receiver)
    logger.info(
        "[load_labeled_emails] link_id=%s provider=%s receiver=%s with_labels=%s",
        link.id,
        DATASET_PROVIDER,
        receiver,
        with_labels,
    )

    total_inserted = 0
    total_skipped = 0
    total_errors = 0

    for split in splits:
        inserted, skipped, errors = load_split(
            db,
            link_id=link.id,
            receiver=receiver,
            split=split,
            with_labels=with_labels,
        )
        total_inserted += inserted
        total_skipped += skipped
        total_errors += errors
        logger.info(
            "[load_labeled_emails] split=%s inserted=%s skipped=%s errors=%s",
            split,
            inserted,
            skipped,
            errors,
        )

    logger.info(
        "[load_labeled_emails] done inserted=%s skipped=%s errors=%s",
        total_inserted,
        total_skipped,
        total_errors,
    )


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")

    parser = argparse.ArgumentParser(
        description="Load FlowRank/labeled_emails from Hugging Face Hub into the database.",
    )
    parser.add_argument(
        "--splits",
        default="train,test",
        help="Splits to load: train, test, or train,test (default: both)",
    )
    parser.add_argument(
        "--with-labels",
        action="store_true",
        help="Also insert ground-truth labels and link them to mails (default: mails only)",
    )
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Force load even if APP_ENV is not dev.",
    )
    args = parser.parse_args()

    must_allow_seed(force=args.force)
    ensure_schema()

    splits = parse_splits(args.splits)

    from back.dao.connection import session

    db = session()
    try:
        load_labeled_emails(db, splits=splits, with_labels=args.with_labels)
    finally:
        db.close()


if __name__ == "__main__":
    main()
