"""API Routes for Disaster Assessments and Verification."""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import DisasterEvent, DispatchLog
from app.schemas.schemas import (
    AssessmentCreate,
    VerificationRequest,
    DisasterEventItem,
    DispatchLogItem,
    DispatchLogListResponse,
)
from app.state_machine import state_machine, EventNotFoundError, StateMachineError

logger = logging.getLogger("resqvision.routes.assessments")

router = APIRouter(prefix="/api/assessments", tags=["Assessments & Verification"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Receive ML Damage Assessment from Stream 2",
    description=(
        "Ingests damage assessment from Stream 2, inserts DisasterEvent record, "
        "and immediately triggers Wave 1 (NDRF verification) via Telegram."
    ),
)
async def receive_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
):
    try:
        event = await state_machine.handle_new_assessment(db=db, assessment_data=payload)
        return {
            "status": "success",
            "message": "Damage assessment registered. Wave 1 (NDRF verification) dispatched.",
            "data": DisasterEventItem.model_validate(event),
        }
    except Exception as exc:
        logger.error(f"Error processing assessment payload for event {payload.event_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process assessment: {str(exc)}",
        )


@router.post(
    "/{event_id}/verify",
    summary="NDRF Field Verification Checkpoint (Human-in-the-Loop)",
    description=(
        "Called when NDRF reports field verification. If confirmed: true, triggers Waves 2, 3, 4, 5. "
        "If confirmed: false, safely halts pipeline and logs false alarm. Idempotent on repeated calls."
    ),
)
async def verify_event(
    event_id: str,
    payload: VerificationRequest,
    db: Session = Depends(get_db),
):
    try:
        event, was_changed = await state_machine.verify_and_dispatch(
            db=db,
            event_id=event_id,
            verification=payload,
        )

        outcome = "CONFIRMED — Waves 2, 3, 4, 5 Dispatched" if payload.confirmed else "DENIED — Pipeline Halted (False Alarm Averted)"
        if not was_changed:
            outcome += " (Idempotent replay - no state change)"

        return {
            "status": "success",
            "message": f"Verification processed: {outcome}",
            "data": DisasterEventItem.model_validate(event),
            "idempotent": not was_changed,
        }

    except EventNotFoundError as enf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(enf),
        )
    except StateMachineError as sme:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(sme),
        )
    except Exception as exc:
        logger.error(f"Unexpected error verifying event {event_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(exc)}",
        )


@router.get(
    "/{event_id}",
    summary="Get Detailed Assessment & Status",
    description="Retrieves a single disaster event and its current lifecycle dispatch status.",
)
def get_assessment(
    event_id: str,
    db: Session = Depends(get_db),
):
    event = db.query(DisasterEvent).filter(DisasterEvent.event_id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found.",
        )
    return {
        "status": "success",
        "data": DisasterEventItem.model_validate(event),
    }


@router.get(
    "/{event_id}/dispatch-log",
    response_model=DispatchLogListResponse,
    summary="Get Dispatch Timeline for Stream 4",
    description="Returns all logged wave dispatches for an event in chronological order.",
)
def get_event_dispatch_log(
    event_id: str,
    db: Session = Depends(get_db),
):
    event = db.query(DisasterEvent).filter(DisasterEvent.event_id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id '{event_id}' not found.",
        )

    logs = (
        db.query(DispatchLog)
        .filter(DispatchLog.event_id == event_id)
        .order_by(DispatchLog.sent_at.asc(), DispatchLog.id.asc())
        .all()
    )

    return DispatchLogListResponse(
        status="success",
        event_id=event_id,
        data=[DispatchLogItem.model_validate(log) for log in logs],
    )
