from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.models.base import Base


class Admin(Base):
    __tablename__ = "admins"
    
    username: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str]

