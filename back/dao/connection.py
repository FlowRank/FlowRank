from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from back.config import (
    DB_HOST,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USERNAME,
)


class BaseData(DeclarativeBase):
    pass


DATA_DATABASE_URL = f"postgresql+psycopg://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine_data = create_engine(DATA_DATABASE_URL)

session = sessionmaker()

session.configure(binds={BaseData: engine_data})