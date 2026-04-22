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

router = APIRouter(prefix="/account", tags=["account"])


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


@router.get(
    "/google/auth-url",
    responses={200: {"model": GoogleAuthUrlResponseSchema}},
)
def google_auth_url(current_account=Depends(get_current_account)):
    if not all([config.GOOGLE_CLIENT_ID, config.GOOGLE_REDIRECT_URI]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    state_payload = {
        "sub": current_account.email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    state = jwt.encode(state_payload, config.SECRET_KEY, algorithm=config.ALGORITHM)

    params = urlencode(
        {
            "response_type": "code",
            "client_id": config.GOOGLE_CLIENT_ID,
            "redirect_uri": config.GOOGLE_REDIRECT_URI,
            "scope": "openid email profile https://www.googleapis.com/auth/gmail.readonly",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
    )
    authorization_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return GoogleAuthUrlResponseSchema(authorization_url=authorization_url)


@router.post("/google/exchange")
async def google_exchange_code(
    payload: GoogleCodeExchangeSchema,
    db: Session = Depends(get_db),
    current_account=Depends(get_current_account),
):
    if not all([config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )

    try:
        state_payload = jwt.decode(payload.state, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state") from exc

    state_email = state_payload.get("sub")
    if state_email != current_account.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="State does not match account")

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": payload.code,
                "client_id": config.GOOGLE_CLIENT_ID,
                "client_secret": config.GOOGLE_CLIENT_SECRET,
                "redirect_uri": config.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token exchange failed",
        )

    token_data = response.json()
    refresh_token = token_data.get("refresh_token")
    if not isinstance(refresh_token, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing refresh token from Google",
        )

    updated = CompteDao(db).update_google_refresh_token(current_account.id, refresh_token)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return {"message": "Google account linked"}