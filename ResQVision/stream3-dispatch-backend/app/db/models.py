import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class DispatchStatus:
    RECEIVED = "received"
    NDRF_NOTIFIED = "ndrf_notified"
    NDRF_CONFIRMED = "ndrf_confirmed"
    NDRF_DENIED = "ndrf_denied"
    FULLY_DISPATCHED = "fully_dispatched"

    ALL_STATUSES = {
        RECEIVED,
        NDRF_NOTIFIED,
        NDRF_CONFIRMED,
        NDRF_DENIED,
        FULLY_DISPATCHED,
    }


class DispatchLogStatus:
    SENT = "sent"
    DELIVERED = "delivered"
    CONFIRMED = "confirmed"
    FAILED = "failed"


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    # UUID primary key stored as 36-char string for cross-database (Postgres + SQLite) compatibility
    event_id = Column(String(36), primary_key=True, index=True)
    disaster_type = Column(String(100), nullable=True, default="Disaster Anomaly")
    damage_score_out_of_100 = Column(Integer, nullable=False)
    affected_population_estimate = Column(Integer, nullable=False)
    critical_zones = Column(JSON, nullable=False)
    dispatch_status = Column(
        String(50),
        nullable=False,
        default=DispatchStatus.RECEIVED,
        index=True,
    )
    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationship to dispatch logs
    dispatch_logs = relationship(
        "DispatchLog",
        back_populates="disaster_event",
        cascade="all, delete-orphan",
        order_by="DispatchLog.sent_at",
    )

    def __repr__(self):
        return f"<DisasterEvent(id={self.event_id}, status={self.dispatch_status}, score={self.damage_score_out_of_100})>"


class DispatchLog(Base):
    __tablename__ = "dispatch_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id = Column(
        String(36),
        ForeignKey("disaster_events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    wave_number = Column(Integer, nullable=False)  # 1 to 5
    team_name = Column(String(100), nullable=False)  # "NDRF", "Medical", "Police", "Fire", "Command Authority"
    status = Column(String(50), nullable=False, default=DispatchLogStatus.SENT)  # "sent", "delivered", "confirmed", "failed"
    sent_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    message_content = Column(Text, nullable=False)

    disaster_event = relationship("DisasterEvent", back_populates="dispatch_logs")

    def __repr__(self):
        return f"<DispatchLog(id={self.id}, event={self.event_id}, wave={self.wave_number}, team={self.team_name}, status={self.status})>"
