"""Unit tests for the State Machine module (Section 11 testing requirement)."""

import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import DisasterEvent, DispatchLog, DispatchStatus, DispatchLogStatus
from app.schemas.schemas import AssessmentCreate, CriticalZone, VerificationRequest
from app.state_machine import StateMachine, EventNotFoundError
from app.telegram.bot_client import TelegramSender


class MockTelegramSender(TelegramSender):
    """Mock Telegram sender that captures all dispatched messages in memory."""
    def __init__(self):
        super().__init__(token="mock")
        self.dispatches = []

    async def send_message(self, agency_name: str, message: str, max_retries: int = 1, backoff_factor: float = 0.0):
        record = {
            "agency": agency_name,
            "message": message,
            "success": True,
            "status": "sent",
        }
        self.dispatches.append(record)
        return record


@pytest.fixture
def test_db():
    """Provides a fresh, isolated in-memory SQLite database session for each test."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def mock_sender():
    return MockTelegramSender()


@pytest.fixture
def state_machine(mock_sender):
    return StateMachine(sender=mock_sender)


def test_handle_new_assessment_triggers_wave1(state_machine, mock_sender, test_db):
    """Verifies that incoming assessment transitions to ndrf_notified and fires Wave 1."""
    async def _test():
        event_id = str(uuid.uuid4())
        assessment = AssessmentCreate(
            event_id=event_id,
            damage_score_out_of_100=72,
            affected_population_estimate=8300,
            disaster_type="Flood",
            critical_zones=[
                CriticalZone(lat=19.0761, lng=72.8780, damage_classification="destroyed"),
                CriticalZone(lat=19.0790, lng=72.8750, damage_classification="major_damage"),
            ],
        )

        event = await state_machine.handle_new_assessment(test_db, assessment)

        assert event.event_id == event_id
        assert event.dispatch_status == DispatchStatus.NDRF_NOTIFIED
        assert event.damage_score_out_of_100 == 72
        assert event.affected_population_estimate == 8300

        # Verify Telegram send captured
        assert len(mock_sender.dispatches) == 1
        assert mock_sender.dispatches[0]["agency"] == "NDRF"
        assert "Flood" in mock_sender.dispatches[0]["message"]

        # Verify DispatchLog row in database
        logs = test_db.query(DispatchLog).filter(DispatchLog.event_id == event_id).all()
        assert len(logs) == 1
        assert logs[0].wave_number == 1
        assert logs[0].team_name == "NDRF"
        assert logs[0].status == DispatchLogStatus.SENT

    import asyncio
    asyncio.run(_test())


def test_verification_confirmed_path_fires_waves_2_to_5(state_machine, mock_sender, test_db):
    """Verifies that NDRF confirmation fires waves 2-5 and marks fully_dispatched."""
    async def _test():
        event_id = str(uuid.uuid4())
        assessment = AssessmentCreate(
            event_id=event_id,
            damage_score_out_of_100=70,
            affected_population_estimate=5000,
            critical_zones=[CriticalZone(lat=20.0, lng=78.0, damage_classification="destroyed")],
        )
        await state_machine.handle_new_assessment(test_db, assessment)
        assert len(mock_sender.dispatches) == 1  # Wave 1

        # NDRF confirms with an adjusted severity of 80
        verification = VerificationRequest(confirmed=True, adjusted_severity=80)
        event, was_changed = await state_machine.verify_and_dispatch(test_db, event_id, verification)

        assert was_changed is True
        assert event.dispatch_status == DispatchStatus.FULLY_DISPATCHED
        assert event.damage_score_out_of_100 == 80  # Adjusted severity applied

        # Total dispatches should now be 1 (Wave 1) + 4 (Waves 2, 3, 4, 5) = 5
        assert len(mock_sender.dispatches) == 5
        dispatched_agencies = [d["agency"] for d in mock_sender.dispatches[1:]]
        assert "Medical" in dispatched_agencies
        assert "Police" in dispatched_agencies
        assert "Fire" in dispatched_agencies
        assert "Command Authority" in dispatched_agencies

        # Check database dispatch logs
        logs = test_db.query(DispatchLog).filter(DispatchLog.event_id == event_id).all()
        assert len(logs) == 5
        wave_nums = [log.wave_number for log in logs]
        assert sorted(wave_nums) == [1, 2, 3, 4, 5]

    import asyncio
    asyncio.run(_test())


def test_verification_denied_path_halts_pipeline(state_machine, mock_sender, test_db):
    """Verifies that NDRF denial marks ndrf_denied and does NOT fire waves 2-5."""
    async def _test():
        event_id = str(uuid.uuid4())
        assessment = AssessmentCreate(
            event_id=event_id,
            damage_score_out_of_100=45,
            affected_population_estimate=1200,
            critical_zones=[CriticalZone(lat=15.0, lng=75.0, damage_classification="moderate_damage")],
        )
        await state_machine.handle_new_assessment(test_db, assessment)
        assert len(mock_sender.dispatches) == 1  # Only Wave 1

        # NDRF reports false alarm (confirmed=False)
        verification = VerificationRequest(confirmed=False)
        event, was_changed = await state_machine.verify_and_dispatch(test_db, event_id, verification)

        assert was_changed is True
        assert event.dispatch_status == DispatchStatus.NDRF_DENIED

        # CRITICAL: No further dispatches fired!
        assert len(mock_sender.dispatches) == 1

        # Verify log in database
        logs = test_db.query(DispatchLog).filter(DispatchLog.event_id == event_id).all()
        # 1 from initial notification + 1 audit entry for denial
        assert len(logs) == 2
        denial_log = [l for l in logs if "FALSE POSITIVE" in l.message_content]
        assert len(denial_log) == 1

    import asyncio
    asyncio.run(_test())


def test_idempotency_prevents_duplicate_dispatch(state_machine, mock_sender, test_db):
    """Verifies that calling verify twice for the same event does not fire waves twice."""
    async def _test():
        event_id = str(uuid.uuid4())
        assessment = AssessmentCreate(
            event_id=event_id,
            damage_score_out_of_100=65,
            affected_population_estimate=3000,
            critical_zones=[CriticalZone(lat=18.0, lng=73.0, damage_classification="destroyed")],
        )
        await state_machine.handle_new_assessment(test_db, assessment)

        # First verify call
        verification = VerificationRequest(confirmed=True)
        event1, changed1 = await state_machine.verify_and_dispatch(test_db, event_id, verification)
        assert changed1 is True
        assert event1.dispatch_status == DispatchStatus.FULLY_DISPATCHED
        assert len(mock_sender.dispatches) == 5

        # Second verify call (e.g. accidental double-click during demo)
        event2, changed2 = await state_machine.verify_and_dispatch(test_db, event_id, verification)
        assert changed2 is False  # Idempotent no-op
        assert event2.dispatch_status == DispatchStatus.FULLY_DISPATCHED
        # MUST NOT have fired waves again
        assert len(mock_sender.dispatches) == 5

        logs = test_db.query(DispatchLog).filter(DispatchLog.event_id == event_id).all()
        assert len(logs) == 5

    import asyncio
    asyncio.run(_test())


def test_verify_unknown_event_raises_event_not_found(state_machine, test_db):
    """Verifies that verifying an unknown UUID raises EventNotFoundError (translates to 404)."""
    async def _test():
        fake_id = str(uuid.uuid4())
        verification = VerificationRequest(confirmed=True)
        with pytest.raises(EventNotFoundError) as exc_info:
            await state_machine.verify_and_dispatch(test_db, fake_id, verification)
        assert fake_id in str(exc_info.value)

    import asyncio
    asyncio.run(_test())
