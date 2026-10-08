# NagarMitra - AI-Powered Civic Issue Resolution Platform

NagarMitra is a smart civic issue reporting, deduplication, assignment, and resolution tracking platform designed for citizens, municipal authority officials, and field workers.

---

## 🚀 System Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Leaflet Maps
- **Backend**: Python FastAPI + SQLite (Async SQLAlchemy) + Pydantic v2 + Pytest
- **AI / Deduplication Engine**: Tf-Idf + Cosine Similarity + Spatial Haversine distance matching + AI non-fabrication guardrails

---

## 🛠️ Setup & Running Instructions (Windows PowerShell)

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### 1. Backend Setup

Open a Windows PowerShell terminal in the project root:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment if not created
python -m venv venv

# Activate virtual environment in PowerShell
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Run Database Seed & Start Server
uvicorn app.main:app --reload --port 8000
```

The backend server will run at: `http://localhost:8000`  
API Documentation (Swagger UI): `http://localhost:8000/docs`

### 2. Frontend Setup

Open a second Windows PowerShell terminal in the project root:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

 The frontend application will run at: `http://localhost:5173`

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Primary Actions / Access |
| :--- | :--- | :--- | :--- |
| **Citizen (User A)** | `citizen@demo.org` | `password123` | Report issue, upload photo, view timeline, verify resolution |
| **Citizen (User B)** | `citizen2@demo.org` | `password123` | Report similar issue, see duplicate flag, verify resolution |
| **Authority Official** | `authority@demo.org` | `password123` | Dashboard, review duplicates, merge/split issues, assign worker, set status |
| **Field Worker** | `worker@demo.org` | `password123` | Task list, start job, upload completion evidence, submit work |
| **System Admin** | `admin@demo.org` | `password123` | User management, SLA policy config, full audit logs & system health |

---

## 🌐 Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME="Civic Pulse API"
DATABASE_URL="sqlite+aiosqlite:///./civic_pulse.db"
SECRET_KEY="super-secret-key-change-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOW_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL="http://localhost:8000/api/v1"
```

---

## 🧪 Running Tests

### Pytest Backend Test Suite
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

### Playwright End-to-End Tests
```powershell
cd frontend
npx playwright test
```

---

## ⚠️ Known Limitations & Design Trade-offs

1. **Local SQLite Database**: SQLite with WAL mode is used for simple zero-dependency local setup. Production deployments should migrate to PostgreSQL + PostGIS for spatial index scaling and concurrent user transactions.
2. **Mock AI Embeddings / Distance Engine**: Duplicate detection uses lightweight Haversine distance and TF-IDF text similarity in Python. For high volume production deployment, PgVector or Milvus vector indexing is recommended.
3. **Local File Storage**: Image evidence uploads (before/after photos) are stored locally in `backend/uploads/`. Production setup should configure AWS S3 or Google Cloud Storage buckets.
4. **Browser Notifications & WebSockets**: System notifications rely on REST polling & state updates in the UI rather than active WebSocket pushes.
