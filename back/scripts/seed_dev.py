import argparse
import logging
import os

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.dao.account import CompteDao
from back.dao.schemas.account import AccountSchema
from back.scripts._db import ensure_schema, must_allow_seed
from back.utils.routers.account import hash_password

logger = logging.getLogger(__name__)


def seed_dev(db: Session) -> None:
    email = os.getenv("DEV_SEED_EMAIL", "dev@flowrank.local")
    password = os.getenv("DEV_SEED_PASSWORD", "dev")

    compte_dao = CompteDao(db)

    if compte_dao.get_account(email) is not None:
        logger.info("[seed_dev] account already exists: %s", email)
        return

    try:
        compte_dao.create(
            AccountSchema(
                email=email,
                password=hash_password(password),
            )
        )
    except IntegrityError:
        db.rollback()
        logger.info("[seed_dev] account already exists: %s", email)
        return

    logger.info("[seed_dev] created account: %s", email)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")

    parser = argparse.ArgumentParser(description="Seed dev data (FlowRank).")
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Force seed even if APP_ENV is not dev.",
    )
    args = parser.parse_args()

    must_allow_seed(force=args.force)

    ensure_schema()

    from back.dao.connection import session

    db = session()
    try:
        seed_dev(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
