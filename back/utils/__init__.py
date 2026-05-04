from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from jwt import InvalidTokenError
from sqlalchemy import text
from starlette import status

from back.config import ALGORITHM, SECRET_KEY, oauth2_scheme
from back.dao.connection import  engine_data, session


def run_command(file, engine):
    # Create an empty command string
    sql_command = ""

    # Iterate over all lines in the sql file
    for line in file:
        # Ignore commented lines
        if not line.startswith("--") and line.strip("\n"):
            # Append line to the command string
            sql_command += line.strip("\n")

            # If the command string ends with ';', it is a full statement
            if sql_command.endswith(";"):
                # Try to execute statement and commit it
                try:
                    engine.execute(text(sql_command))
                    engine.commit()

                # Assert in case of error
                except:
                    print(sql_command)
                    print("Ops")

                # Finally, clear command string
                finally:
                    sql_command = ""


def init_database():

    with engine_data.connect() as con:
        with open("/app/back/sql/account.sql") as file:
            run_command(file, con)


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
