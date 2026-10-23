"""API Routes for Active Disasters queried by Stream 4 Command Dashboard."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import DisasterEvent
from app.schemas.schemas import ActiveDisastersResponse, DisasterEventItem

logger = logging.getLogger("resqvision.routes.disasters")

router = APIRouter(prefix="/api", tags=["Active Disasters (Stream 4 Contract)"])


@router.get(
    "/active-disasters",
    response_model=ActiveDisastersResponse,
    summary="Get Active Disasters (Contract with Stream 4)",
    description=(
        "Exposes active disaster events polled by the Stream 4 Command Dashboard. "
        "Returns events ordered by creation timestamp descending."
    ),
)
def get_active_disasters(
    limit: int = Query(default=50, ge=1, le=200, description="Maximum number of active events to return"),
    db: Session = Depends(get_db),
):
    events = (
        db.query(DisasterEvent)
        .order_by(DisasterEvent.created_at.desc())
        .limit(limit)
        .all()
    )

    items = []
    for ev in events:
        items.append(
            DisasterEventItem(
                event_id=ev.event_id,
                dispatch_status=ev.dispatch_status,
                damage_score_out_of_100=ev.damage_score_out_of_100,
                affected_population_estimate=ev.affected_population_estimate,
                critical_zones=ev.critical_zones or [],
                disaster_type=ev.disaster_type,
                created_at=ev.created_at,
                updated_at=ev.updated_at,
            )
        )

    return ActiveDisastersResponse(status="success", data=items)
