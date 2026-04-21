from pydantic import BaseModel


class AccountSchema(BaseModel):
    email: str
    password: str


class LoginSchema(AccountSchema):
    pass


class LoginResponseSchema(BaseModel):
    message: str
    access_token: str


class UserData(BaseModel):
    pseudo: str
    email: str
    id: int