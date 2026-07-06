from typing import Annotated

import jwt
from back import config
from back.dao.account import CompteDao
from back.dao.link import LinkDao
from back.dao.mail import MailDao
from back.dao.schemas.dashboard import MailOut
from back.utils import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_current_account(
    token: Annotated[str, Depends(config.oauth2_scheme)],
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    email = payload.get("sub")
    if not isinstance(email, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    account = CompteDao(db).get_account(email)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return account


@router.get("/", response_model=list[MailOut])
def get_mails(
    link_id: int = Query(...),
    db: Session = Depends(get_db),
    current_account=Depends(get_current_account),
):
    link = LinkDao(db).get_by_id(link_id)

    if not link or link.compte_id != current_account.id:
        return []

    mails = MailDao(db).get_by_link_id(link_id)
    return [MailOut.model_validate(mail) for mail in mails]
