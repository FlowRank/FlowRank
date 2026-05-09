from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import JSONResponse

from back import config
from back.dao.account import CompteDao
from back.dao.mail import MailDao
from back.dao.link import LinkDao
from back.dao.schemas.account import (
    GoogleAuthUrlResponseSchema,
    GoogleCodeExchangeSchema,
    LoginResponseSchema,
    LoginSchema,
)
from back.dao.schemas.register import RegisterSchema
from back.utils import get_db
from back.utils.error import (
    AccountNotFound,
    EmailAlreadyExist,
    EmailFormatError,
    IncorrectPassword,
)
from back.utils.error.schema import ErrorSchema
from back.utils.routers.account import (
    check_password,
    create_access_token,
    create_account,
    validate_data,
)


router = APIRouter(prefix="/mails", tags=["mails"])


def get_current_account(
    token: Annotated[str, Depends(config.oauth2_scheme)],
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    email = payload.get("sub")
    if not isinstance(email, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    account = CompteDao(db).get_account(email)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return account


@router.get("/")
def get_mails(current_account: CompteDao = Depends(get_current_account)):
    links = LinkDao(get_db()).get_by_account_id(current_account.id)
    mails = []
    for link in links:
        mails.extend(MailDao(get_db()).get_by_link_id(link.id))
    return mails