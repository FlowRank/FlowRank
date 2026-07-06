from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from back.dao.connection import BaseData

mail_label = Table(
    "mail_label",
    BaseData.metadata,
    Column("mail_id", Integer, ForeignKey("mail.id", ondelete="CASCADE"), primary_key=True),
    Column("label_id", Integer, ForeignKey("label.id", ondelete="CASCADE"), primary_key=True),
    Index("ix_mail_label_label_id", "label_id"),
)


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
    recipient_email = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())

    labels = relationship("Label", secondary=mail_label, back_populates="mails")


class Label(BaseData):
    """Label réutilisable au sein d'une boîte (link), associable à plusieurs mails."""

    __tablename__ = "label"
    __table_args__ = (
        UniqueConstraint("link_id", "name", name="uq_label_link_name"),
        Index("ix_label_link_id", "link_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    link_id = Column(Integer, ForeignKey("link.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7), nullable=False, server_default="#6b7280")
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    mails = relationship("Mail", secondary=mail_label, back_populates="labels")
