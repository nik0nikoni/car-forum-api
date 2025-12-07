from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import String, Index
from app.database import Base, int_pk, str_uniq


class User(Base):
    id: Mapped[int_pk]
    username: Mapped[str_uniq] = mapped_column(String(50))
    email: Mapped[str_uniq] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

    # Индексы (ускоряет поиск по логину/почте)
    __table_args__ = (
        Index("ix_users_username", "username", unique=True),
        Index("ix_users_email", "email", unique=True),
    )
