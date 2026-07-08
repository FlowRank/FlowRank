from typing import Annotated

import jwt
from back import config
from back.dao.account import CompteDao
from back.dao.link import LinkDao
from back.utils import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

router = APIRouter(prefix="/links", tags=["links"])


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


@router.get("/")
def get_links(
    db: Session = Depends(get_db),
    current_account=Depends(get_current_account),
):
    links = LinkDao(db).get_by_account_id(current_account.id)

    return links


@router.delete("/{link_id}")
def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_account=Depends(get_current_account),
):
    link_dao = LinkDao(db)
    link = link_dao.get_by_id(link_id)

    if link is None or link.compte_id != current_account.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    link_dao.delete(link_id)
    return {"message": "Mailbox removed"}
