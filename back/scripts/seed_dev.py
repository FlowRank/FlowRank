import argparse
import os

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.dao.account import CompteDao
from back.dao.schemas.account import AccountSchema
from back.utils.routers.account import hash_password


def _must_allow_seed(*, force: bool) -> None:
    if force:
        return
    if os.getenv("APP_ENV") != "dev":
        raise RuntimeError("Application environment is not set to dev")


def seed_dev(db: Session) -> None:
    email = os.getenv("DEV_SEED_EMAIL", "dev@flowrank.local")
    password = os.getenv("DEV_SEED_PASSWORD", "dev")

    compte_dao = CompteDao(db)

    if compte_dao.get_account(email) is not None:
        print(f"[seed_dev] account already exists: {email}")
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
        print(f"[seed_dev] account already exists: {email}")
        return

    print(f"[seed_dev] created account: {email}")


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

    # Import local pour éviter les effets de bord au chargement du module
    from back.dao.connection import session

    db = session()
    try:
        seed_dev(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
