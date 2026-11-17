# ResQVision Production Deployment Guide (Render & Vercel)

This guide provides the exact configuration required to deploy the complete ResQVision multi-stream disaster response system across **Render** (backend microservices) and **Vercel** (frontend dashboard).

---

## Architecture Topology

```
                       ┌─────────────────────────────┐
                       │   Vercel (Frontend SPA)     │
                       │   resqvision.vercel.app     │
                       └──────────────┬──────────────┘
                                      │ HTTPS / CORS
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ▼                     ▼                     ▼
 ┌──────────────────────────┐ ┌───────────────────┐ ┌──────────────────┐
 │  Render Web Service #1   │ │ Render Web Svc #2 │ │ Render Web Svc #3│
 │  Stream 4 Node Backend   │ │ Stream 3 Dispatch │ │ Stream 2 ML/AI   │
 │  Port: Dynamic ($PORT)   │ │ Port: 8003        │ │ Port: 8002       │
 └─────────────┬────────────┘ └─────────┬─────────┘ └──────────────────┘
               │                        │
               ▼                        ▼
 ┌──────────────────────────┐ ┌────────────────────────────────────────┐
 │      Supabase Auth       │ │ Supabase PostgreSQL (IPv4 Session Pool) │
 └──────────────────────────┘ └────────────────────────────────────────┘
```

---

## 1. Vercel Deployment (Stream 4 Frontend)

### Project Configuration in Vercel
1. Import repository from GitHub in Vercel.
2. Set **Root Directory** to:
   ```
   ResQVision/stream4-dashboard
   ```
   *(or `stream4-dashboard` if your repository root is inside ResQVision)*
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Install Command**: `npm install`

### Environment Variables on Vercel
In Vercel Project Settings > Environment Variables:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_LAYER3_API_URL` | `https://resqvision-node-backend.onrender.com` | URL of the Stream 4 Node Express Backend on Render |
| `VITE_STREAM3_BASE_URL` | `https://resqvision-dispatch.onrender.com` | URL of the Stream 3 FastAPI Dispatch service on Render |
| `VITE_USE_MOCK_DATA` | `false` | Set to `false` for live emergency response operations |

> **Note on Client-Side Routing**: The included `stream4-dashboard/vercel.json` automatically handles SPA rewrites (`/(.*) -> /index.html`) so refreshing citizen/government routes never causes a 404.

---

## 2. Render Deployment (Backend Services)

### Service 1: Stream 4 Layer 3 Node Backend (`Web Service`)
This handles authentication, citizen SOS reports, government operations, and receipt generation.

- **Root Directory**: `ResQVision/stream4-dashboard`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server/index.js`
- **Environment Variables**:
  | Variable | Value |
  | :--- | :--- |
  | `NODE_ENV` | `production` |
  | `HOST` | `0.0.0.0` |
  | `CORS_ORIGIN` | `https://<your-vercel-app>.vercel.app` (or `*`) |
  | `SUPABASE_URL` | `https://avjqlpllihhqtydwcuya.supabase.co` |
  | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
  | `STREAM3_BASE_URL` | `https://resqvision-dispatch.onrender.com` |
  | `IMAGE_ASSESSMENT_PROVIDER_URL` | `https://resqvision-ml.onrender.com/verify-image` |

---

### Service 2: Stream 3 Dispatch Backend (`Web Service`)
This runs the FastAPI dispatch state machine, NDRF notifications, and Supabase PostgreSQL persistence.

- **Root Directory**: `ResQVision/stream3-dispatch-backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  | Variable | Value |
  | :--- | :--- |
  | `DATABASE_URL` | `postgresql://postgres.avjqlpllihhqtydwcuya:nandithkumarirukulla@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres` |
  | `CORS_ORIGINS` | `*` |
  | `PORT` | `8003` (or leave default assigned by Render) |

---

### Service 3: Stream 2 ML Inference & AI Verification (`Web Service`)
This provides deep learning flood segmentation, AI image forensics, and distress text veracity cross-checks.

- **Root Directory**: `ResQVision/stream2-ml-inference`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  | Variable | Value |
  | :--- | :--- |
  | `PYTHONUNBUFFERED` | `1` |
  | `PORT` | `8002` (or leave default assigned by Render) |

---

## 3. Local Verification Before Deploying
Run tests locally to ensure full functionality:
```bash
# Stream 1
pytest ResQVision/stream1-data-ingestion/tests

# Stream 2 (ML + AI Authenticity Engine)
pytest ResQVision/stream2-ml-inference/tests

# Stream 3 (Dispatch Backend)
pytest ResQVision/stream3-dispatch-backend/tests

# Stream 4 (E2E API + Hazard Engine + Verification)
npm --prefix ResQVision/stream4-dashboard run test:e2e

# Frontend Vite Production Build
npm --prefix ResQVision/stream4-dashboard run build
```
