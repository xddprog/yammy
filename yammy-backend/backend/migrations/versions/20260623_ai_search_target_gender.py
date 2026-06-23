"""AI search target gender filter."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260623_ai_search_target_gender"
down_revision = "20260622_report_adequacy_penalty"
branch_labels = None
depends_on = None

GENDER_ENUM = sa.Enum("male", "female", name="genderenum", create_type=False)


def _column_exists(conn, table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "ai_search_history", "target_gender"):
        op.add_column(
            "ai_search_history",
            sa.Column("target_gender", GENDER_ENUM, nullable=True),
        )


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "ai_search_history", "target_gender"):
        op.drop_column("ai_search_history", "target_gender")
