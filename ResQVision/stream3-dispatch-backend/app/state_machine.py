"""State Machine module for ResQVision Stream 3 Dispatch Engine.

Implements the staged, verification-gated, wave-based dispatch:
  Wave 1: NDRF (Ground-truth verification gate)
  Checkpoint: Human-in-the-loop verification
  If Confirmed:
    Wave 2: Medical Corps
    Wave 3: Police & Law Enforcement
    Wave 4: Fire & Rescue
    Wave 5: Command Authority (Consolidated SITREP)
  If Denied:
    Safety abort - logs false alarm and stops pipeline.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.models import DisasterEvent, DispatchLog, DispatchStatus, DispatchLogStatus
from app.schemas.schemas import AssessmentCreate, VerificationRequest
from app.telegram.bot_client import TelegramSender, default_sender
from app.telegram import message_templates

logger = logging.getLogger("resqvision.statemachine")


class StateMachineError(Exception):
    """Base exception for state machine processing errors."""
    pass


class EventNotFoundError(StateMachineError):
    """Raised when an event_id does not exist in the database."""
    pass


class StateMachine:
    def __init__(self, sender: Optional[TelegramSender] = None):
        self.sender = sender or default_sender

    async def handle_new_assessment(
        self,
        db: Session,
        assessment_data: AssessmentCreate,
    ) -> DisasterEvent:
        """
        Executes Step 1 & 2 of the Dispatch State Machine:
        1. Inserts or updates DisasterEvent with status 'received'.
        2. Immediately dispatches Wave 1 to NDRF for ground verification.
        3. Records DispatchLog for Wave 1.
        4. Transitions status to 'ndrf_notified'.
        """
        event_id = assessment_data.event_id
        logger.info(f"[State Machine] Processing new incoming assessment for event {event_id}")

        critical_zones_raw = [z.model_dump() for z in assessment_data.critical_zones]
        disaster_type = assessment_data.disaster_type or "Disaster Anomaly"

        # Check if event already exists (idempotent receipt)
        event = db.query(DisasterEvent).filter(DisasterEvent.event_id == event_id).first()
        if not event:
            event = DisasterEvent(
                event_id=event_id,
                disaster_type=disaster_type,
                damage_score_out_of_100=assessment_data.damage_score_out_of_100,
                affected_population_estimate=assessment_data.affected_population_estimate,
                critical_zones=critical_zones_raw,
                dispatch_status=DispatchStatus.RECEIVED,
            )
            db.add(event)
            db.flush()
            logger.info(f"[State Machine] Event {event_id} created with status 'received'")
        else:
            logger.warning(f"[State Machine] Event {event_id} already exists with status '{event.dispatch_status}'.")
            # If already notified or further along, return existing event
            if event.dispatch_status != DispatchStatus.RECEIVED:
                logger.info(f"[State Machine] Event {event_id} is already in state '{event.dispatch_status}', skipping duplicate Wave 1.")
                return event

        # Step 2: Trigger Wave 1 (NDRF Verification)
        msg_content = message_templates.render_wave1_ndrf(
            event_id=event_id,
            disaster_type=disaster_type,
            damage_score=event.damage_score_out_of_100,
            affected_population=event.affected_population_estimate,
            critical_zones=critical_zones_raw,
        )

        send_res = await self.sender.send_message(
            agency_name="NDRF",
            message=msg_content,
        )

        log_status = DispatchLogStatus.SENT if send_res["success"] else DispatchLogStatus.FAILED

        # Insert Wave 1 log
        dispatch_log = DispatchLog(
            event_id=event_id,
            wave_number=1,
            team_name="NDRF",
            status=log_status,
            message_content=msg_content,
        )
        db.add(dispatch_log)

        # Transition status
        event.dispatch_status = DispatchStatus.NDRF_NOTIFIED
        db.commit()
        db.refresh(event)

        logger.info(
            f"[State Machine] Wave 1 NDRF dispatch complete for event {event_id}. "
            f"Telegram status: '{log_status}'. State updated to '{DispatchStatus.NDRF_NOTIFIED}'."
        )
        return event

    async def verify_and_dispatch(
        self,
        db: Session,
        event_id: str,
        verification: VerificationRequest,
    ) -> Tuple[DisasterEvent, bool]:
        """
        Executes Steps 3, 4, 5 of the State Machine (Human-in-the-loop Verification Gate):
        - Validates event existence.
        - Checks idempotency: if already fully_dispatched or ndrf_denied, no-op return.
        - If confirmed: false -> Marks ndrf_denied and HALTS pipeline.
        - If confirmed: true -> Concurrently fires Waves 2, 3, 4, 5 and updates to fully_dispatched
          within a single atomic database transaction.

        Returns (DisasterEvent, was_state_changed).
        """
        logger.info(f"[State Machine] Verification checkpoint received for event {event_id}: confirmed={verification.confirmed}")

        event = db.query(DisasterEvent).filter(DisasterEvent.event_id == event_id).first()
        if not event:
            logger.error(f"[State Machine] Verification failed: Event {event_id} not found in database.")
            raise EventNotFoundError(f"Event with id '{event_id}' does not exist.")

        # Idempotency Check:
        if event.dispatch_status in (DispatchStatus.FULLY_DISPATCHED, DispatchStatus.NDRF_DENIED):
            logger.info(
                f"[State Machine] Idempotency Guard: Event {event_id} is already '{event.dispatch_status}'. "
                "No-op returning current state without re-dispatching."
            )
            return event, False

        critical_zones = event.critical_zones or []
        disaster_type = event.disaster_type or "Disaster Anomaly"

        # Apply adjusted severity if provided by field team
        if verification.adjusted_severity is not None:
            logger.info(
                f"[State Machine] Ground team adjusted severity for {event_id} "
                f"from {event.damage_score_out_of_100} to {verification.adjusted_severity}."
            )
            event.damage_score_out_of_100 = verification.adjusted_severity

        # Branch 1: Denial / False Alarm (Safety Gate Abort)
        if not verification.confirmed:
            logger.warning(
                f"[State Machine] 🛑 NDRF DENIED verification for event {event_id}. "
                "Halting pipeline. Waves 2-5 will NOT be triggered. False alarm averted."
            )
            event.dispatch_status = DispatchStatus.NDRF_DENIED

            denial_log = DispatchLog(
                event_id=event_id,
                wave_number=1,
                team_name="NDRF",
                status=DispatchLogStatus.CONFIRMED,
                message_content="NDRF ground unit reported FALSE POSITIVE / DENIED verification. Pipeline halted by protocol.",
            )
            db.add(denial_log)
            db.commit()
            db.refresh(event)
            return event, True

        # Branch 2: Confirmed Ground Truth -> Wave 2, 3, 4, 5 Parallel Dispatch
        logger.info(
            f"[State Machine] ✅ NDRF CONFIRMED ground truth for event {event_id}. "
            "Unlocking Waves 2 (Medical), 3 (Police), 4 (Fire), and 5 (Command Authority)."
        )

        # Generate role-specific message payloads
        msg_wave2 = message_templates.render_wave2_medical(
            event_id=event_id,
            disaster_type=disaster_type,
            damage_score=event.damage_score_out_of_100,
            affected_population=event.affected_population_estimate,
            critical_zones=critical_zones,
        )

        msg_wave3 = message_templates.render_wave3_police(
            event_id=event_id,
            disaster_type=disaster_type,
            damage_score=event.damage_score_out_of_100,
            affected_population=event.affected_population_estimate,
            critical_zones=critical_zones,
        )

        msg_wave4 = message_templates.render_wave4_fire(
            event_id=event_id,
            disaster_type=disaster_type,
            damage_score=event.damage_score_out_of_100,
            affected_population=event.affected_population_estimate,
            critical_zones=critical_zones,
        )

        msg_wave5 = message_templates.render_wave5_command(
            event_id=event_id,
            disaster_type=disaster_type,
            damage_score=event.damage_score_out_of_100,
            affected_population=event.affected_population_estimate,
            critical_zones=critical_zones,
        )

        # Concurrently dispatch via Telegram
        tasks = [
            self.sender.send_message("Medical", msg_wave2),
            self.sender.send_message("Police", msg_wave3),
            self.sender.send_message("Fire", msg_wave4),
            self.sender.send_message("Command Authority", msg_wave5),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Interpret results and prepare atomic DB transaction
        wave_configs = [
            (2, "Medical", msg_wave2, results[0]),
            (3, "Police", msg_wave3, results[1]),
            (4, "Fire", msg_wave4, results[2]),
            (5, "Command Authority", msg_wave5, results[3]),
        ]

        try:
            # Atomic transaction covering status transition and all dispatch log records
            with db.begin_nested():
                event.dispatch_status = DispatchStatus.FULLY_DISPATCHED

                for wave_num, team_name, content, res in wave_configs:
                    if isinstance(res, Exception):
                        status = DispatchLogStatus.FAILED
                        logger.error(f"[State Machine] Error dispatching to {team_name}: {res}")
                    elif isinstance(res, dict) and res.get("success"):
                        status = DispatchLogStatus.SENT
                    else:
                        status = DispatchLogStatus.FAILED

                    log_entry = DispatchLog(
                        event_id=event_id,
                        wave_number=wave_num,
                        team_name=team_name,
                        status=status,
                        message_content=content,
                    )
                    db.add(log_entry)

            db.commit()
            db.refresh(event)

            logger.info(
                f"[State Machine] 🎉 Event {event_id} transitioned to '{DispatchStatus.FULLY_DISPATCHED}'. "
                "Waves 2, 3, 4, 5 successfully logged and dispatched."
            )
            return event, True

        except SQLAlchemyError as db_err:
            db.rollback()
            logger.error(f"[State Machine] Database transaction failed during wave dispatch for {event_id}: {db_err}")
            raise StateMachineError(f"Database error during wave dispatch transaction: {db_err}")


# Application-wide state machine singleton
state_machine = StateMachine()
