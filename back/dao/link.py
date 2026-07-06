from sqlalchemy.orm import Session

from back.dao.models import Link
from back.dao.schemas.link import LinkSchema


class LinkDao:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id_: int):
        return self.db.query(Link).filter(Link.id == id_).first()

    def get_by_account_id(self, compte_id: int):
        return self.db.query(Link).filter(Link.compte_id == compte_id).all()

    def get_by_account_and_provider(self, compte_id: int, provider: str):
        return (
            self.db.query(Link)
            .filter(
                Link.compte_id == compte_id,
                Link.provider == provider,
            )
            .first()
        )

    def create(self, link: LinkSchema):
        db_link = Link(
            compte_id=link.compte_id,
            provider=link.provider,
            account_email=link.account_email,
            oauth_refresh_token=link.oauth_refresh_token,
            access_token=link.access_token,
            access_token_expires_at=link.access_token_expires_at,
        )

        self.db.add(db_link)
        self.db.commit()
        self.db.refresh(db_link)

        return db_link

    def update(self, link_id: int, **kwargs):
        link = self.get_by_id(link_id)
        if link is None:
            return None

        for key, value in kwargs.items():
            if hasattr(link, key):
                setattr(link, key, value)

        self.db.commit()
        self.db.refresh(link)
        return link

    def delete(self, link_id: int):
        link = self.get_by_id(link_id)
        if link is None:
            return False

        self.db.delete(link)
        self.db.commit()
        return True
