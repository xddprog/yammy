"""Report adequacy_penalty_applied flag."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260622_report_adequacy_penalty"
down_revision = "20260621_appearance_rating_pairs"
branch_labels = None
depends_on = None


def _table_exists(conn, table: str) -> bool:
    return inspect(conn).has_table(table)


def _column_exists(conn, table: str, column: str) -> bool:
    if not _table_exists(conn, table):
        return False
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()
    if not _column_exists(conn, "reports", "adequacy_penalty_applied"):
        op.add_column(
            "reports",
            sa.Column(
                "adequacy_penalty_applied",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()
    if _column_exists(conn, "reports", "adequacy_penalty_applied"):
        op.drop_column("reports", "adequacy_penalty_applied")
