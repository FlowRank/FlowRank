from sqlalchemy import Column, Integer, String, Text

from connection import BaseAccount


class Compte(BaseAccount):
    __tablename__ = "compte"

    id = Column(Integer, primary_key=True)
    email = Column(Text, unique=True)
    hash_mdp = Column(String(255))


