"""Profile moderation note shown to user after reject."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260625_profile_moderation_feedback"
down_revision = "20260624_profile_moderation_status"
branch_labels = None
depends_on = None


def _column_exists(conn, table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def _enum_exists(conn, name: str) -> bool:
    return (
        conn.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
            {"name": name},
        ).scalar()
        is not None
    )


def upgrade() -> None:
    conn = op.get_bind()

    if not _column_exists(conn, "users", "profile_moderation_note"):
        op.add_column("users", sa.Column("profile_moderation_note", sa.Text(), nullable=True))

    if _column_exists(conn, "users", "profile_moderation_photo_id"):
        op.drop_column("users", "profile_moderation_photo_id")
    if _column_exists(conn, "users", "profile_moderation_issue"):
        op.drop_column("users", "profile_moderation_issue")
    if _enum_exists(conn, "profilemoderationissueenum"):
        sa.Enum(name="profilemoderationissueenum").drop(conn, checkfirst=True)


def downgrade() -> None:
    conn = op.get_bind()

    if _column_exists(conn, "users", "profile_moderation_note"):
        op.drop_column("users", "profile_moderation_note")
