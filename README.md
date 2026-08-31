# SIH 2026 Integrated Project Monitoring Platform (Problem ID: 26103)

**Theme:** Smart Automation  
**Category:** Software  
**Team Name:** Titans  

A centralized, web-based Infrastructure Project Monitoring Platform that tracks physical and financial progress, detects project delays and cost overruns, calculates explainable risk scores, predicts future project completion delays using Scikit-Learn ML models, and provides automated decision support to government authorities.

---

## Data Flow Architecture

`DATA` → `MONITOR` → `ANALYZE` → `DETECT` → `PREDICT` → `ALERT` → `DECISION SUPPORT`

---

## Key Features

1. **Executive Dashboard**: 6 top KPI cards, Planned vs Actual progress chart (Recharts), Status portfolio pie chart, Financial overview, Recent Smart Alerts, and Top Risk projects.
2. **Projects Directory**: Search, filter by status (On Track, Warning, Delayed, High Risk), department, and risk level with full CRUD capabilities.
3. **Detailed Monitoring View**: Tabbed project interface (Overview, Monthly Progress History, Cost Analysis, Milestones Timeline, Explainable Risk Engine & ML Prediction).
4. **Monthly Progress Entry**: Submit progress updates; automatically calculates percentage point variance, cost overrun in ₹ Crores, updates risk score, and triggers alerts.
5. **Cost & Delay Detection**: Automated detection of progress lag and budget overruns with configurable thresholds.
6. **Milestones Tracking**: Timeline management for project deliverables with automated risk penalty for delayed milestones.
7. **Hybrid Risk Engine**:
   - **Explainable Risk Engine**: 100% transparent factor breakdown (Progress Lag 35%, Cost Overrun 30%, Missed Milestones 20%, Schedule Pressure 15%).
   - **Scikit-Learn ML Delay Predictor**: Random Forest Regressor predicting delay days with feature importance breakdown.
8. **Smart Alert System**: Auto-generates Critical, High, Medium, and Low severity alerts with one-click navigation to affected projects.
9. **GIS Project Map**: Interactive OpenStreetMap (Leaflet) with status markers across India.
10. **Report Generator Engine**: Generate, preview, and download CSV reports for project details and portfolio summaries.
11. **Settings & Thresholds**: Configurable system variance limits and role-based permissions.

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Recharts, Leaflet, OpenStreetMap, Lucide Icons, Vanilla CSS Design System.
- **Backend**: Python, FastAPI, SQLAlchemy ORM, Pydantic v2, Scikit-Learn, Pandas, NumPy, Uvicorn.
- **Database**: SQLite (`sih_monitoring.db`) initialized and seeded automatically with realistic infrastructure projects across India.

---

## Folder Structure

```
SIH_Prototype/
├── backend/
│   ├── main.py                     # FastAPI Application Entry
│   ├── database/
│   │   ├── connection.py           # SQLite SQLAlchemy Engine
│   │   └── seed.py                 # Sample Data Seed Script
│   ├── models/                     # SQLAlchemy Database Models
│   ├── schemas/                    # Pydantic Validation Schemas
│   ├── services/                   # Risk, Alert, Analytics & Report Services
│   ├── ml/                         # Scikit-Learn Delay Predictor
│   ├── routers/                    # FastAPI REST API Routers
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── index.css               # Design System Styling
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/             # Reusable UI Components & Modals
│       ├── pages/                  # SPA Views
│       └── services/               # API Communication Client
└── README.md
```

---

## Quick Setup & Execution Guide

### 1. Backend Setup

```bash
cd backend

# Create Virtual Environment (Optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Seed Database (Automatically seeds 10+ projects including Nagpur demo project)
python database/seed.py

# Start FastAPI Backend Server
uvicorn main:app --reload --port 8000
```
Backend API will be accessible at: `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`)

---

### 2. Frontend Setup

```bash
cd frontend

# Install Node Dependencies
npm install

# Start Vite Development Server
npm run dev
```
Frontend Web App will run at: `http://localhost:5173`

---

## Demo Accounts Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `admin123` | Full access (Create, Edit, Delete, Monthly Updates, Settings) |
| **Officer** | `officer@demo.com` | `officer123` | Progress updates, Edit projects, Analytics, Reports |
| **Viewer** | `viewer@demo.com` | `viewer123` | Read-only dashboard access |

---

## Primary Demo Scenario (Nagpur Infrastructure Project)

- **Project ID**: `PRJ-NGP-001`
- **Name**: Nagpur Ring Road Expansion & Elevated Corridor
- **Approved Budget**: ₹500 Crore
- **Expenditure**: ₹530 Crore (Over budget by ₹30 Crore)
- **Planned Physical Progress**: 70%
- **Actual Physical Progress**: 55% (15 percentage points lag)
- **Status**: `DELAYED` / `HIGH_RISK`
- **Risk Score**: 82 / 100 (Critical Risk)
- **Auto Alert**: *"Project Nagpur Ring Road Expansion is 15 percentage points behind planned progress and has exceeded the approved budget by ₹30 Cr."*

---

## Risk Engine Calculation Formula

$$\text{Risk Score} = 0.35 \times S_{\text{progress}} + 0.30 \times S_{\text{cost}} + 0.20 \times S_{\text{milestone}} + 0.15 \times S_{\text{schedule}}$$

- **Progress Score ($S_{\text{progress}}$)**: $4 \times (\text{Planned \%} - \text{Actual \%})$
- **Cost Overrun Score ($S_{\text{cost}}$)**: $10 \times \left(\frac{\text{Expenditure} - \text{Budget}}{\text{Budget}} \times 100\right)$
- **Milestone Score ($S_{\text{milestone}}$)**: $30 \times (\text{Count of Delayed Milestones})$
- **Schedule Score ($S_{\text{schedule}}$)**: $2 \times (\text{Time Elapsed \%} - \text{Actual Progress \%})$

---

## Troubleshooting

1. **Backend fails to start**: Ensure Python 3.10+ is installed and dependencies in `requirements.txt` are satisfied.
2. **Frontend cannot reach API**: Verify `uvicorn main:app` is running on port `8000`. Vite proxy routes `/api` directly to `http://127.0.0.1:8000`.
3. **Map tiles not displaying**: Ensure active internet connection to load Leaflet OpenStreetMap tiles.
