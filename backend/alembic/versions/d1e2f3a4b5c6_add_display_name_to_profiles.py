"""add_display_name_to_profiles

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a1b2
Branch Labels: None
Depends On: None

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = 'd1e2f3a4b5c6'
down_revision: str | Sequence[str] | None = 'c3d4e5f6a1b2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('display_name', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'display_name')
