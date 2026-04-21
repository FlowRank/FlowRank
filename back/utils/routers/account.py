import re
import smtplib
import string
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from random import choices

import bcrypt
import jwt
from sqlalchemy.orm import Session

from back import config
from back.config import ALGORITHM, EXPIRE_TIME_MINUTE, SECRET_KEY
from back.dao.account import CompteDao
from back.dao.schemas.account import AccountSchema
from back.dao.schemas.register import RegisterSchema
from back.utils.error import (
    EmailAlreadyExist,
    EmailFormatError,
    IncorrectPassword,
)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_TIME_MINUTE)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_account(email: str, password: str, db: Session):
    account = AccountSchema(email=email, password=hash_password(password))
    CompteDao(db).create(account)
    return True


def validate_data(user: RegisterSchema, db: Session):
    compte_dao = CompteDao(db)
    if compte_dao.get_account(user.email):
        raise EmailAlreadyExist()
    if not validate_email(user.email):
        raise EmailFormatError()
    return True


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def validate_email(email):
    return (
        re.match("(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email)
        is not None
    )

def check_password(password: str, db_pwd: str):
    if not bcrypt.checkpw(password.encode("utf-8"), db_pwd.encode("utf-8")):
        raise IncorrectPassword()
    return True