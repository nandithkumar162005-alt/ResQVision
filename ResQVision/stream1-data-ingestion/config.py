from pydantic import BaseModel
import os

class Settings(BaseModel):
    # Polling intervals in seconds
    USGS_POLL_INTERVAL: int = int(os.getenv("USGS_POLL_INTERVAL", "60"))          # USGS feed updates every minute
    METEO_POLL_INTERVAL: int = int(os.getenv("METEO_POLL_INTERVAL", "900"))      # Every 15 minutes
    NEWS_POLL_INTERVAL: int = int(os.getenv("NEWS_POLL_INTERVAL", "1800"))       # Every 30 minutes
    
    # Thresholds
    EARTHQUAKE_MIN_MAGNITUDE: float = float(os.getenv("EARTHQUAKE_MIN_MAGNITUDE", "4.5"))
    RAINFALL_THRESHOLD_MM: float = float(os.getenv("RAINFALL_THRESHOLD_MM", "50.0"))   # Extreme rainfall threshold
    
    # Target Coordinates for Open-Meteo monitoring (e.g., Regional Flood Zone)
    MONITOR_LATITUDE: float = float(os.getenv("MONITOR_LATITUDE", "17.3850"))
    MONITOR_LONGITUDE: float = float(os.getenv("MONITOR_LONGITUDE", "78.4867"))
    
    # Stream 2 Webhook Destination
    STREAM_2_WEBHOOK_URL: str = os.getenv("STREAM_2_WEBHOOK_URL", "http://localhost:8002/trigger-assessment")
    
    # NewsAPI Key (Optional / Corroboration only)
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")

settings = Settings()
