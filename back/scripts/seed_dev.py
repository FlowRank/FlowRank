import argparse
import logging
import os

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.dao.account import CompteDao
from back.dao.schemas.account import AccountSchema
from back.utils.routers.account import hash_password

logger = logging.getLogger(__name__)


def _must_allow_seed(*, force: bool) -> None:
    if force:
        return
    if os.getenv("APP_ENV") != "dev":
        raise RuntimeError("Application environment is not set to dev")


def _ensure_schema() -> None:
    """
    Ensure the database schema exists before seeding.

    TODO: Replace this with proper migrations (Alembic) once introduced.
    """

    # Import local pour éviter les effets de bord au chargement du module
    from back.dao.connection import BaseData, engine_data

    BaseData.metadata.create_all(bind=engine_data)
    with engine_data.begin() as conn:
        conn.execute(
            text("ALTER TABLE IF EXISTS compte ADD COLUMN IF NOT EXISTS google_refresh_token TEXT")
        )


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
    parser = argparse.ArgumentParser(description="Seed dev data (FlowRank).")
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Force seed even if APP_ENV is not dev.",
    )
    args = parser.parse_args()

    _must_allow_seed(force=args.force)

    _ensure_schema()

    # Import local pour éviter les effets de bord au chargement du module
    from back.dao.connection import session

    db = session()
    try:
        seed_dev(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
