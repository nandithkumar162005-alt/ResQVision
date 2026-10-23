# ResQVision — Stream 2: ML Inference & Satellite Orchestration Engine

## Overview

ResQVision is an end-to-end humanitarian disaster intelligence and response system designed to drastically compress the time between catastrophe detection and field resource mobilization. Within the larger 4-stream platform architecture, **Stream 2** serves as the central analytical and geospatial engine. Triggered by early warning event feeds from Stream 1 (Data Ingestion), Stream 2 orchestrates the automated acquisition of multi-spectral optical and Synthetic Aperture Radar (SAR) satellite imagery from the European Space Agency's Copernicus constellation, executes dual-temporal deep learning damage assessments, overlays high-resolution demographic grids to compute population exposure, and clusters localized structural collapse points into actionable operational zones.

Once analysis is complete, Stream 2 synthesizes its findings into a standardized assessment payload and dispatches it asynchronously via HTTP POST to Stream 3 (Automated Resource Dispatch Engine). Stream 3 uses the overall damage severity score, affected population estimate, and prioritized critical zone coordinates to calculate emergency triage demands and route rescue units, while Stream 4 (Real-time Operations Dashboard) renders the clustered critical zones directly onto interactive tactical maps for incident commanders.

```
┌─────────────────────────┐      ┌─────────────────────────┐
│        Stream 1         │      │        Stream 2         │
│   (Data Ingestion)      │ ───► │     (ML Inference)      │ [YOU ARE HERE]
│  USGS / GDACS / Sensors │      │ Satellite Orchestration │
└─────────────────────────┘      └────────────┬────────────┘
                                              │
                                              ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│        Stream 4         │      │        Stream 3         │
│  (Real-Time Dashboard)  │ ◄─── │   (Resource Dispatch)   │
│   Live Commander Map    │      │ Triage & Route Planning │
└─────────────────────────┘      └─────────────────────────┘
```

---

## Architecture

### Pre/Post Satellite Image Pair Comparison
Optical satellite disaster assessment cannot reliably determine structural damage from a post-event image alone. A single post-event scene cannot disambiguate between pre-existing infrastructure decay, temporary building materials, standard construction, and genuine catastrophe-induced rubble. 

Following the operational methodologies standardized by **UNOSAT** (United Nations Satellite Centre) and the **Copernicus Emergency Management Service (EMS)**, Stream 2 conducts change detection by pairing an archival pre-disaster baseline scene with an acquired post-disaster scene of the exact same geographic bounding box.
- **Sentinel-2 Constellation:** Provides global multi-spectral optical coverage at 10-meter ground resolution with a 5-day constellation revisit cycle at the equator (2 to 3 days at mid-latitudes). Stream 2 acquires pre-event cloud-free imagery from the Copernicus archive and polls for post-event orbital passes.
- **Sentinel-1 SAR All-Weather Fallback:** Catastrophic weather events (hurricanes, typhoons, severe monsoonal flooding) often cause persistent cloud cover that blinds optical sensors for days. Stream 2 incorporates an automated fallback to Copernicus Sentinel-1 C-band Synthetic Aperture Radar (SAR), which penetrates cloud decks and functions in total darkness to detect surface structural and coherence changes.

### Siamese U-Net Architecture
Stream 2 implements a **Siamese U-Net** neural network, the leading architecture established by the Defense Innovation Unit (DIU) **xView2 / xBD Challenge** (Gupta et al.):
1. **Twin Weight-Sharing Encoders:** Pre-disaster and post-disaster image tiles pass through identical, weight-shared feature extraction backbones (e.g., ResNet34 / EfficientNet) to extract multi-scale feature hierarchies.
2. **Feature Difference Concatenation:** Spatial feature maps at each resolution stage are compared via absolute difference tensors (`|F_post - F_pre|`) and concatenated with raw features, explicitly isolating structural change deltas.
3. **U-Net Decoder with Skip Connections:** The difference features pass through an expansive decoder pathway with skip connections to preserve fine spatial boundaries, generating dense pixel-wise semantic segmentations.
4. **Decoupled Localization & Classification:** This architecture cleanly decouples building localization (learned primarily from the undisturbed pre-disaster image) from damage classification (derived from the change delta between pre and post features).

### MOCK_INFERENCE Mode (Default)
In production, acquiring satellite granules via Copernicus APIs requires verified credentials, active network egress, and real-world orbital pass timing (often waiting hours for a satellite overpass). Furthermore, training and evaluating full PyTorch models on multi-band GeoTIFF rasters requires dedicated GPU infrastructure.

To ensure **100% demo reliability**, rapid integration development, and headless automated testing, Stream 2 defaults to `MOCK_INFERENCE=true`. In this mode:
- All external satellite acquisition APIs, raster processing pipelines, and PyTorch inference calls are bypassed.
- Deterministic synthetic damage points, realistic population estimates, and damage severity scores are calculated mathematically from the incoming disaster coordinates and severity metric.
- Payloads adhere 100% strictly to the production Pydantic schemas, allowing downstream streams (Stream 3 and Stream 4) to be tested end-to-end without external dependencies.

### xBD Damage Classification Schema
In accordance with the Joint Damage Scale defined by the xBD benchmark, Stream 2 internally categorizes structural damage into four distinct tiers:
- **`no-damage`:** Undisturbed buildings; intact roofs and walls; no structural compromise.
- **`minor-damage`:** Partial roof tile loss, superficial water staining, or surrounding debris without structural failure.
- **`major-damage`:** Significant structural compromise, partially collapsed roofs or walls, structural integrity breached.
- **`destroyed`:** Total structural collapse, building flattened to foundation, impassable rubble pile.

> **Cross-Stream Filtering Rule:** While the ML model predicts across all four classes, only **`major_damage`** and **`destroyed`** zones are forwarded to Stream 3 and Stream 4. Low-severity points (`no_damage` and `minor_damage`) are filtered out prior to spatial clustering to avoid cluttering emergency tactical maps and misdirecting triage resources.

---

## Prerequisites

### 1. Python Environment
Python 3.10+ is required. Set up a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

For systems without a dedicated NVIDIA CUDA GPU, install the CPU-only PyTorch build:
```bash
pip install torch==2.4.1+cpu torchvision==0.19.1+cpu --index-url https://download.pytorch.org/whl/cpu
```

### 2. Environment Configuration
Copy the sample environment file to create your active `.env`:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. CDSE Registration (Required for MOCK_INFERENCE=false)
To fetch live Sentinel-2 optical and Sentinel-1 SAR imagery from the Copernicus Data Space Ecosystem:
1. Register for a free account at https://dataspace.copernicus.eu/
2. Log in → Navigate to **Account** → **OAuth clients** → Click **Create new client**.
3. Copy your generated Client ID and Client Secret into `.env`:
   ```env
   CDSE_CLIENT_ID=your_client_id_here
   CDSE_CLIENT_SECRET=your_client_secret_here
   ```
4. *Note:* The free tier provides global access to full-resolution Sentinel-1 and Sentinel-2 data with standard rate limits.

### 4. xBD Dataset (Required for Model Training)
To train the Siamese U-Net from scratch on real disaster imagery:
1. Register at https://xview2.org/ (free academic/research account).
2. Review and accept the challenge data use agreement.
3. Download the xBD dataset tarballs.
4. Unpack the dataset into an `./xbd/` directory in the project root with the following structure:
   ```
   xbd/
     train/images/
     train/labels/
     tier3/images/
     tier3/labels/
     hold/images/
     hold/labels/
   ```
5. *Note:* This step **cannot be automated** via scripts because xView2 requires user authentication and individual terms acceptance.

---

## Running the Service

### Mock Mode (Default — use this for development and demos)
Mock mode starts with zero external dependencies and returns synthetic, reproducible assessments immediately:

```bash
# Simplest start:
MOCK_INFERENCE=true uvicorn app.main:app --port 8002 --reload

# Or copy .env.example to .env (MOCK_INFERENCE=true is already the default)
cp .env.example .env
uvicorn app.main:app --port 8002 --reload
```

### Real Mode (Requires CDSE credentials + trained checkpoint)
To activate real satellite acquisition, raster processing, and neural network inference:

```bash
# In .env:
# MOCK_INFERENCE=false
# CDSE_CLIENT_ID=your_id
# CDSE_CLIENT_SECRET=your_secret
# MODEL_CHECKPOINT_PATH=checkpoints/siamese_unet_best.pth
uvicorn app.main:app --port 8002
```

---

## Training the Model

The training harness implements an AdamW optimizer, cosine annealing learning rate scheduler, and composite cross-entropy + Dice loss weighted to handle damage class imbalance.

```bash
# After downloading xBD dataset:
python -m app.ml.train --epochs 50 --batch-size 4 --lr 1e-4 --data-dir ./xbd

# Resume from checkpoint:
python -m app.ml.train --resume checkpoints/siamese_unet_best.pth --epochs 100
```

- **Evaluation Metric:** Harmonic mean of building localization F1 score and damage classification macro-F1 score (matching the official xView2 competition benchmark).
- **Compute Time:** Approximately 24–48 hours on an NVIDIA RTX 3090 / A100 GPU for full convergence across all disaster tiers.

---

## API Endpoints

### POST `/trigger-assessment`
Receives a disaster event notification from Stream 1. Validates the payload, records idempotency state, returns HTTP 202 Accepted immediately, and launches the assessment pipeline in the background.

**Request body (from Stream 1):**
```json
{
  "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
  "disaster_type": "earthquake",
  "coordinates": {"lat": 19.0760, "lng": 72.8777},
  "severity_metric": 6.2,
  "timestamp_utc": "2026-10-10T14:23:01Z"
}
```

**Response (`202 Accepted`):**
```json
{
  "status": "processing",
  "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
  "message": "Assessment pipeline started. Results will be dispatched to Stream 3."
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:8002/trigger-assessment \
  -H 'Content-Type: application/json' \
  -d '{"event_id":"a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab","disaster_type":"earthquake","coordinates":{"lat":19.0760,"lng":72.8777},"severity_metric":6.2,"timestamp_utc":"2026-10-10T14:23:01Z"}'
```

### GET `/health`
Returns service operational health and running mode.
```json
{
  "status": "ok",
  "mock_inference": true,
  "stream": 2
}
```

### GET `/status/{event_id}`
Checks the current processing state of an ongoing assessment.
```json
{
  "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
  "status": "processing"
}
```

### Interactive API Documentation
FastAPI automatically serves interactive Swagger and OpenAPI documentation at:
- **Swagger UI:** [http://localhost:8002/docs](http://localhost:8002/docs)
- **ReDoc:** [http://localhost:8002/redoc](http://localhost:8002/redoc)

---

## Output Contract (to Stream 3)

Upon pipeline completion, Stream 2 automatically dispatches an HTTP POST request to `STREAM3_ASSESSMENT_URL` (default: `http://localhost:8003/api/assessments`):

```json
{
  "event_id": "a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab",
  "damage_score_out_of_100": 72,
  "affected_population_estimate": 8300,
  "critical_zones": [
    {
      "lat": 19.0761,
      "lng": 72.8780,
      "damage_classification": "destroyed"
    },
    {
      "lat": 19.0790,
      "lng": 72.8750,
      "damage_classification": "major_damage"
    }
  ]
}
```

### Field Definitions
- **`event_id`** *(UUID string)*: Verbatim disaster identifier received from Stream 1. Never regenerated.
- **`damage_score_out_of_100`** *(integer, 0–100)*: Global damage severity score across the assessed region.
- **`affected_population_estimate`** *(integer, ≥ 0)*: Total estimated human population within major damage and destroyed zones.
- **`critical_zones`** *(array of objects, max 25 entries)*: Density-clustered high-severity centroid coordinates with classification (`destroyed` or `major_damage`).

---

## Running Tests

Stream 2 includes a comprehensive test suite written with `pytest` and `httpx`:

```bash
# Run all tests:
pytest tests/ -v

# Run specific test files:
pytest tests/test_mock_infer.py -v
pytest tests/test_zone_clustering.py -v
pytest tests/test_schemas.py -v
```

---

## Project Structure

```text
stream2-ml-inference/
├── .env.example                     # Environment configuration template with defaults
├── .gitignore                       # Git ignore rules for virtual environments, checkpoints, and rasters
├── conftest.py                      # Pytest sys.path setup for package imports
├── requirements.txt                 # Pinned dependencies (FastAPI, PyTorch, GeoPandas, Rasterio, etc.)
├── README.md                        # Complete service documentation and operational runbook
│
├── app/
│   ├── __init__.py                  # Stream 2 root package marker
│   ├── config.py                    # Typed environment configuration via Pydantic BaseSettings
│   ├── schemas.py                   # Inbound/outbound Pydantic integration contracts & validators
│   ├── main.py                      # FastAPI application, route handlers, idempotency, and lifespans
│   ├── pipeline.py                  # Assessment pipeline orchestrator coordinating all subsystems
│   ├── dispatcher.py                # HTTP client with tenacity retry logic for Stream 3 integration
│   │
│   ├── geo/
│   │   ├── __init__.py              # Geospatial package marker
│   │   ├── population_overlay.py    # WorldPop API client and density formula fallback estimator
│   │   └── zone_clustering.py       # DBSCAN spatial clustering reducing damage points to <= 25 zones
│   │
│   ├── ml/
│   │   ├── __init__.py              # ML package marker
│   │   ├── model.py                 # PyTorch Siamese U-Net neural network architecture
│   │   ├── infer.py                 # Production inference pipeline running on GeoTIFF image pairs
│   │   ├── mock_infer.py            # Deterministic synthetic damage generator for mock mode
│   │   └── train.py                 # Training script for Siamese U-Net on xBD disaster dataset
│   │
│   └── satellite/
│       ├── __init__.py              # Satellite acquisition package marker
│       ├── cdse_client.py           # Copernicus Data Space Ecosystem (CDSE) Sentinel-2 optical client
│       └── sar_fallback.py          # Sentinel-1 Synthetic Aperture Radar (SAR) all-weather fallback fetcher
│
└── tests/
    ├── __init__.py                  # Test package marker
    ├── test_schemas.py              # Unit tests for Pydantic schema validation and JSON serialization
    ├── test_mock_infer.py           # Tests for deterministic mock damage and severity scoring
    └── test_zone_clustering.py      # Tests for DBSCAN clustering, boundary clamping, and zone caps
```

---

## Known Limitations & Future Work

- **Sentinel-1 SAR Preprocessing:** The Sentinel-1 SAR fallback currently bypasses full radar-specific preprocessing (radiometric calibration, Lee speckle filtering, Doppler terrain correction). In production, these steps should be orchestrated using SNAP or ESA snappy.
- **Model Training Convergence:** While the Siamese U-Net architecture and training pipeline are fully scaffolded, production-level convergence on the xBD dataset requires ~48 hours of compute on enterprise GPUs.
- **In-Memory Idempotency:** Ongoing and completed event IDs are tracked in in-memory sets (`_processing_events`, `_completed_events`). In a multi-worker or containerized deployment, this state must be backed by Redis.
- **WorldPop API Coverage:** The WorldPop REST API integration currently uses a formula-based density fallback when `WORLDPOP_API_KEY` is not provided or when internet connectivity is restricted.
- **Adaptive Clustering Epsilon:** Spatial zone clustering uses a Haversine-corrected DBSCAN with a fixed angular radius. Implementing an adaptive epsilon that scales dynamically with bounding box area would improve cluster granularity across differing geographic zoom levels.

---

## Inter-Stream Contract Summary

| Interaction | Endpoint | Method | Key Request Fields | Key Response Fields |
| :--- | :--- | :---: | :--- | :--- |
| **Stream 1 ➔ Stream 2** | `/trigger-assessment` | `POST` | `event_id` *(UUID)*<br>`disaster_type` *(string)*<br>`coordinates` *({lat, lng})*<br>`severity_metric` *(float)*<br>`timestamp_utc` *(datetime)* | `status` *("processing")*<br>`event_id` *(UUID)*<br>`message` *(string)* |
| **Stream 2 ➔ Stream 3** | `STREAM3_ASSESSMENT_URL`<br>*(default: `/api/assessments`)* | `POST` | `event_id` *(string / UUID)*<br>`damage_score_out_of_100` *(int, 0–100)*<br>`affected_population_estimate` *(int)*<br>`critical_zones` *(list of {lat, lng, damage_classification}, max 25)* | `status` *("received" / 200 OK)* |
