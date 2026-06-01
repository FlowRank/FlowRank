import os


def must_allow_seed(*, force: bool) -> None:
    if force:
        return
    if os.getenv("APP_ENV") != "dev":
        raise RuntimeError("Application environment is not set to dev")


def ensure_schema() -> None:
    """
    Ensure the database schema exists before seeding.

    TODO: Replace this with proper migrations (Alembic) once introduced.
    """

    from back.dao.connection import BaseData, engine_data

    BaseData.metadata.create_all(bind=engine_data)
