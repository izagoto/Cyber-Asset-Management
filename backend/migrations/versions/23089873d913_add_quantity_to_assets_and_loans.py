"""add quantity to assets and loans

Revision ID: 23089873d913
Revises: 86f0c12a3416
Create Date: 2026-06-23 14:23:52.794318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '23089873d913'
down_revision: Union[str, Sequence[str], None] = '86f0c12a3416'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('assets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('quantity', sa.Integer(), server_default='1', nullable=False))

    with op.batch_alter_table('loans', schema=None) as batch_op:
        batch_op.add_column(sa.Column('quantity', sa.Integer(), server_default='1', nullable=False))

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('loans', schema=None) as batch_op:
        batch_op.drop_column('quantity')

    with op.batch_alter_table('assets', schema=None) as batch_op:
        batch_op.drop_column('quantity')
