from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import JSONResponse

from back.dao.account import CompteDao
from back.dao.schemas.account import LoginResponseSchema, LoginSchema, UserData
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
    validate_data
)

router = APIRouter(prefix="/account", tags=["account"])


@router.post(
    "/register",
    responses={
        409: {"model": ErrorSchema},
        422: {"model": ErrorSchema},
    },
    status_code=status.HTTP_201_CREATED,
)
def register(user: RegisterSchema, db: Session = Depends(get_db)):
    try:
        validate_data(user, db)
    except EmailFormatError as e:
        return JSONResponse(status_code=422, content=e.__dict__)
    except EmailAlreadyExist as e:
        return JSONResponse(status_code=409, content=e.__dict__)

    create_account(user.email, user.password, db)

    return {"message": "Account created"}


@router.post(
    "/login",
    responses={
        400: {"model": ErrorSchema},
        404: {"model": ErrorSchema},
        409: {"model": ErrorSchema},
        200: {"model": LoginResponseSchema},
    },
)
def login(account: LoginSchema, db: Session = Depends(get_db)):
    compte_dao = CompteDao(db)

    compte = compte_dao.get_account(account.email)
    if not compte:
        return JSONResponse(status_code=404, content=AccountNotFound().__dict__)

    try:
        check_password(account.password, compte.hash_mdp)
    except IncorrectPassword as e:
        return JSONResponse(status_code=400, content=e.__dict__)

    token = create_access_token({"sub": account.email})

    return LoginResponseSchema(message="Login success", access_token=token)