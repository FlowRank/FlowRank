from sqlalchemy.orm import Session

from models import Compte
from schemas.account import AccountSchema


class CompteDao:
    def __init__(self, db: Session):
        self.db = db

    def get_account(self, email: str):
        return self.db.query(Compte).filter(Compte.email == email).first()

    def get_by_id(self, id_: int):
        return self.db.query(Compte).filter(Compte.id == id_).first()

    def create(self, account: AccountSchema):

        db_account = Compte(email=account.email, hash_mdp=account.password)
        self.db.add(db_account)
        self.db.commit()
        self.db.refresh(db_account)

        return db_account

    def delete(self, email: str):
        account = self.get_account(email)
        self.db.delete(account)
        self.db.commit()
        return True