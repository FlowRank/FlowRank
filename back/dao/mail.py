from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from back.dao.label import LabelDao
from back.dao.models import Link, Mail
from back.dao.schemas.mail import MailSchema


class MailDao:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id_: int):
        return self.db.query(Mail).filter(Mail.id == id_).first()

    def get_by_link_id(self, link_id: int, limit: int = 100):
        return (
            self.db.query(Mail)
            .options(joinedload(Mail.labels))
            .filter(Mail.link_id == link_id)
            .order_by(Mail.received_at.desc())
            .limit(limit)
            .all()
        )

    def count_by_link_id(self, link_id: int) -> int:
        return self.db.query(Mail).filter(Mail.link_id == link_id).count()

    def count_by_account_id(self, account_id: int) -> int:
        return (
            self.db.query(Mail)
            .join(Link, Link.id == Mail.link_id)
            .filter(Link.compte_id == account_id)
            .count()
        )

    def count_by_account_grouped_by_link(self, account_id: int) -> list[tuple[int, int]]:
        return (
            self.db.query(Mail.link_id, func.count(Mail.id))
            .join(Link, Link.id == Mail.link_id)
            .filter(Link.compte_id == account_id)
            .group_by(Mail.link_id)
            .all()
        )

    def get_unlabeled_by_link_id(self, link_id: int, limit: int):
        return (
            self.db.query(Mail)
            .filter(Mail.link_id == link_id)
            .filter(~Mail.labels.any())
            .order_by(Mail.received_at.asc())
            .limit(limit)
            .all()
        )

    def get_by_provider_message_id(self, link_id: int, provider_message_id: str):
        return (
            self.db.query(Mail)
            .filter(
                Mail.link_id == link_id,
                Mail.provider_message_id == provider_message_id,
            )
            .first()
        )

    def create(self, mail: MailSchema):
        db_mail = Mail(
            link_id=mail.link_id,
            provider_message_id=mail.provider_message_id,
            sender_email=mail.sender_email,
            recipient_email=mail.recipient_email,
            subject=mail.subject,
            body=mail.body,
            received_at=mail.received_at,
        )

        self.db.add(db_mail)
        self.db.commit()
        self.db.refresh(db_mail)

        return db_mail

    def create_with_label(
        self,
        mail: MailSchema,
        label_name: str,
        *,
        commit: bool = True,
    ) -> Mail:
        """Insère un mail et associe un label ground-truth (sans commit si commit=False)."""

        label_dao = LabelDao(self.db)
        db_mail = Mail(
            link_id=mail.link_id,
            provider_message_id=mail.provider_message_id,
            sender_email=mail.sender_email,
            recipient_email=mail.recipient_email,
            subject=mail.subject,
            body=mail.body,
            received_at=mail.received_at,
        )
        self.db.add(db_mail)
        self.db.flush()

        label = label_dao.get_or_create(mail.link_id, label_name)
        label_dao.attach_to_mail(db_mail, label)

        if commit:
            self.db.commit()
            self.db.refresh(db_mail)
        else:
            self.db.flush()

        return db_mail

    def commit(self) -> None:
        self.db.commit()

    def update(self, mail_id: int, **kwargs):
        mail = self.get_by_id(mail_id)
        if mail is None:
            return None

        for key, value in kwargs.items():
            if hasattr(mail, key):
                setattr(mail, key, value)

        self.db.commit()
        self.db.refresh(mail)
        return mail

    def delete(self, mail_id: int):
        mail = self.get_by_id(mail_id)
        if mail is None:
            return False

        self.db.delete(mail)
        self.db.commit()
        return True
