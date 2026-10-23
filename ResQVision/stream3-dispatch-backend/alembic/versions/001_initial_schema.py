"""Initial schema for disaster_events and dispatch_logs

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-17 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create disaster_events table
    op.create_table(
        'disaster_events',
        sa.Column('event_id', sa.String(length=36), primary_key=True),
        sa.Column('disaster_type', sa.String(length=100), nullable=True),
        sa.Column('damage_score_out_of_100', sa.Integer(), nullable=False),
        sa.Column('affected_population_estimate', sa.Integer(), nullable=False),
        sa.Column('critical_zones', sa.JSON(), nullable=False),
        sa.Column('dispatch_status', sa.String(length=50), nullable=False, server_default='received'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_disaster_events_event_id', 'disaster_events', ['event_id'])
    op.create_index('ix_disaster_events_dispatch_status', 'disaster_events', ['dispatch_status'])

    # Create dispatch_logs table
    op.create_table(
        'dispatch_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('event_id', sa.String(length=36), sa.ForeignKey('disaster_events.event_id', ondelete='CASCADE'), nullable=False),
        sa.Column('wave_number', sa.Integer(), nullable=False),
        sa.Column('team_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='sent'),
        sa.Column('sent_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('message_content', sa.Text(), nullable=False),
    )
    op.create_index('ix_dispatch_logs_id', 'dispatch_logs', ['id'])
    op.create_index('ix_dispatch_logs_event_id', 'dispatch_logs', ['event_id'])


def downgrade() -> None:
    op.drop_table('dispatch_logs')
    op.drop_table('disaster_events')
