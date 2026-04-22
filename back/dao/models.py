from sqlalchemy import Column, Integer, String, Text

from back.dao.connection import BaseData


class Compte(BaseData):
    __tablename__ = "compte"

    id = Column(Integer, primary_key=True)
    email = Column(Text, unique=True)
    hash_mdp = Column(String(255))
    google_refresh_token = Column(Text, nullable=True)


