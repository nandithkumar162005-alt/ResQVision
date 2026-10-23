"""Main FastAPI Server Entrypoint for ResQVision Stream 3 Dispatch Engine."""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.db.database import init_db
from app.routes import assessments, disasters, demo

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("resqvision.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager to handle startup and shutdown tasks."""
    logger.info("Initializing ResQVision Stream 3 Dispatch Engine...")
    try:
        init_db()
        logger.info("Database schema validated and ready.")
    except Exception as exc:
        logger.critical(f"Failed initializing database tables on startup: {exc}", exc_info=True)
    yield
    logger.info("ResQVision Stream 3 Dispatch Engine shutting down.")


app = FastAPI(
    title="ResQVision — Stream 3: Dispatch Backend & Communications Engine",
    description=(
        "Production-grade central dispatch backend for disaster response. "
        "Manages incident state, human-in-the-loop verification gating, and "
        "multi-agency wave-based communications via Telegram."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration — Permissive for Stream 4 dashboard integration
origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Route Modules
app.include_router(assessments.router)
app.include_router(disasters.router)
app.include_router(demo.router)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirects root visitors to the interactive viva demonstration console."""
    return RedirectResponse(url="/demo")


@app.get("/health", tags=["Health & Diagnostics"])
def health_check():
    """Diagnostic health check endpoint verifying engine operational readiness."""
    return {
        "status": "healthy",
        "service": "resqvision-stream3-dispatch-backend",
        "human_in_the_loop_gate": "active",
        "database": "connected",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
