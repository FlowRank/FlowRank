from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from back.dao.connection import BaseData

class Compte(BaseData):
    """Utilisateur applicatif (login email + mot de passe)."""

    __tablename__ = "compte"

    id = Column(Integer, primary_key=True)
    email = Column(Text, unique=True)
    hash_mdp = Column(String(255))
    # À retirer après bascule OAuth vers link.oauth_refresh_token + migration données
    google_refresh_token = Column(Text, nullable=True)


class Link(BaseData):
    """Boîte externe (Gmail, Outlook, …) reliée à un compte."""

    __tablename__ = "link"
    __table_args__ = (Index("ix_link_compte_id", "compte_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    compte_id = Column(Integer, ForeignKey("compte.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)
    account_email = Column(String(255), nullable=True)
    oauth_refresh_token = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    access_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)


class Mail(BaseData):
    """Message ingéré pour un link donné."""

    __tablename__ = "mail"
    __table_args__ = (
        UniqueConstraint("link_id", "provider_message_id", name="uq_mail_link_provider_message"),
        Index("ix_mail_link_id", "link_id"),
        Index("ix_mail_link_received_at", "link_id", "received_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    link_id = Column(Integer, ForeignKey("link.id", ondelete="CASCADE"), nullable=False)
    provider_message_id = Column(String(255), nullable=False)
    sender_email = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=True)
    folder_label = Column(String(100), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    priority_score = Column(Float, nullable=True)
    extras = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
