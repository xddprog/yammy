"""Admin panel schema migrations."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260619_admin_panel"
down_revision = "add_msg_previous_version"
branch_labels = None
depends_on = None

ADMIN_ROLE = sa.Enum("ADMIN", "SUPPORT", name="adminroleenum", create_type=False)
REPORT_STATUS = sa.Enum(
    "PENDING", "REVIEWED", "DISMISSED", name="reportstatusenum", create_type=False
)


def _enum_exists(conn, name: str) -> bool:
    return (
        conn.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
            {"name": name},
        ).scalar()
        is not None
    )


def _table_exists(conn, table: str) -> bool:
    return inspect(conn).has_table(table)


def _column_exists(conn, table: str, column: str) -> bool:
    if not _table_exists(conn, table):
        return False
    return column in {c["name"] for c in inspect(conn).get_columns(table)}


def _widen_alembic_version_num(conn) -> None:
    max_length = conn.execute(
        sa.text(
            """
            SELECT character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'alembic_version'
              AND column_name = 'version_num'
            """
        )
    ).scalar()
    if max_length is not None and max_length < 64:
        op.execute("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(64)")


def upgrade() -> None:
    conn = op.get_bind()
    _widen_alembic_version_num(conn)

    if not _enum_exists(conn, "adminroleenum"):
        sa.Enum("ADMIN", "SUPPORT", name="adminroleenum").create(conn, checkfirst=True)

    if not _column_exists(conn, "admins", "role"):
        op.add_column(
            "admins",
            sa.Column(
                "role",
                ADMIN_ROLE,
                nullable=False,
                server_default="SUPPORT",
            ),
        )
        op.execute("UPDATE admins SET role = 'ADMIN' WHERE username = 'admin'")

    if not _enum_exists(conn, "reportstatusenum"):
        sa.Enum(
            "PENDING", "REVIEWED", "DISMISSED", name="reportstatusenum"
        ).create(conn, checkfirst=True)

    if not _column_exists(conn, "reports", "status"):
        op.add_column(
            "reports",
            sa.Column(
                "status",
                REPORT_STATUS,
                nullable=False,
                server_default="PENDING",
            ),
        )

    if not _column_exists(conn, "reports", "reviewed_at"):
        op.add_column(
            "reports",
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _column_exists(conn, "reports", "review_note"):
        op.add_column("reports", sa.Column("review_note", sa.Text(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()

    if _column_exists(conn, "reports", "review_note"):
        op.drop_column("reports", "review_note")
    if _column_exists(conn, "reports", "reviewed_at"):
        op.drop_column("reports", "reviewed_at")
    if _column_exists(conn, "reports", "status"):
        op.drop_column("reports", "status")
    if _enum_exists(conn, "reportstatusenum"):
        sa.Enum(
            "PENDING", "REVIEWED", "DISMISSED", name="reportstatusenum"
        ).drop(conn, checkfirst=True)

    if _column_exists(conn, "admins", "role"):
        op.drop_column("admins", "role")
    if _enum_exists(conn, "adminroleenum"):
        sa.Enum("ADMIN", "SUPPORT", name="adminroleenum").drop(conn, checkfirst=True)
