from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from back.config import (
    ACCOUNT_DB_HOST,
    ACCOUNT_DB_NAME,
    ACCOUNT_DB_PASSWORD,
    ACCOUNT_DB_PORT,
    ACCOUNT_DB_USERNAME,
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USERNAME,
)


class BaseData(DeclarativeBase):
    pass


class BaseAccount(DeclarativeBase):
    pass


DATA_DATABASE_URL = f"mariadb+mariadbconnector://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
ACCOUNT_DATABASE_URL = f"mariadb+mariadbconnector://{ACCOUNT_DB_USERNAME}:{ACCOUNT_DB_PASSWORD}@{ACCOUNT_DB_HOST}:{ACCOUNT_DB_PORT}/{ACCOUNT_DB_NAME}"

engine_data = create_engine(DATA_DATABASE_URL)
engine_account = create_engine(ACCOUNT_DATABASE_URL)

session = sessionmaker()

session.configure(binds={BaseData: engine_data, BaseAccount: engine_account})