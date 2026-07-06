from sqlalchemy.orm import Session

from back.dao.models import Label, Mail
from back.utils.color import random_label_color


class LabelDao:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, link_id: int, name: str) -> Label:
        label = self.db.query(Label).filter(Label.link_id == link_id, Label.name == name).first()
        if label is not None:
            return label

        label = Label(link_id=link_id, name=name, color=random_label_color())
        self.db.add(label)
        self.db.flush()
        return label

    def attach_to_mail(self, mail: Mail, label: Label) -> None:
        if label not in mail.labels:
            mail.labels.append(label)
