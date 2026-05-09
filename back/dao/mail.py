from sqlalchemy.orm import Session

from back.dao.models import Mail
from back.dao.schemas.mail import MailSchema


class MailDao:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id_: int):
        return self.db.query(Mail).filter(Mail.id == id_).first()

    def get_by_link_id(self, link_id: int, limit: int = 100):
        return (
            self.db.query(Mail)
            .filter(Mail.link_id == link_id)
            .order_by(Mail.received_at.desc())
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
            subject=mail.subject,
            body=mail.body,
            folder_label=mail.folder_label,
            received_at=mail.received_at,
            priority_score=mail.priority_score,
            extras=mail.extras,
        )

        self.db.add(db_mail)
        self.db.commit()
        self.db.refresh(db_mail)

        return db_mail

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