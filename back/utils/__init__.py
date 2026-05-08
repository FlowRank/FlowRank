from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from jwt import InvalidTokenError
from starlette import status

from back.config import ALGORITHM, SECRET_KEY, oauth2_scheme
from back.dao.connection import session


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except InvalidTokenError:
        raise credentials_exception
