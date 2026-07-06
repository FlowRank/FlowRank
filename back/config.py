import os

from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer

load_dotenv()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT")
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")

ACCOUNT_DB_HOST = os.getenv("ACCOUNT_DB_HOST")
ACCOUNT_DB_PORT = os.getenv("ACCOUNT_DB_PORT")
ACCOUNT_DB_NAME = os.getenv("ACCOUNT_DB_NAME")
ACCOUNT_DB_USERNAME = os.getenv("ACCOUNT_DB_USERNAME")
ACCOUNT_DB_PASSWORD = os.getenv("ACCOUNT_DB_PASSWORD")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

EXPIRE_TIME_MINUTE = os.getenv("EXPIRE_TIME_MINUTE")
if EXPIRE_TIME_MINUTE is not None and EXPIRE_TIME_MINUTE.isdigit():
    EXPIRE_TIME_MINUTE = int(EXPIRE_TIME_MINUTE)
else:
    raise RuntimeError("EXPIRE_TIME_MINUTE Must be an Integer")

APP_URL = os.getenv("APP_URL")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

MAIL_FETCH_INTERVAL_MINUTES = os.getenv("MAIL_FETCH_INTERVAL_MINUTES", "10")
LOG_DIR = os.getenv("LOG_DIR")
if LOG_DIR is None:
    LOG_DIR = "/var/log/flowrank"

MAIL_SORTER_CLASS_PATH = os.getenv("MAIL_SORTER_CLASS_PATH", "")

MAIL_SORT_MODEL_ID = os.getenv("MAIL_SORT_MODEL_ID", "FlowRank/mailSort")

_mail_sort_interval = os.getenv("MAIL_SORT_INTERVAL_MINUTES", "10")
if _mail_sort_interval.isdigit():
    MAIL_SORT_INTERVAL_MINUTES = int(_mail_sort_interval)
else:
    raise RuntimeError("MAIL_SORT_INTERVAL_MINUTES must be an integer")

_mail_sort_batch = os.getenv("MAIL_SORT_BATCH_SIZE", "50")
if _mail_sort_batch.isdigit():
    MAIL_SORT_BATCH_SIZE = int(_mail_sort_batch)
else:
    raise RuntimeError("MAIL_SORT_BATCH_SIZE must be an integer")
