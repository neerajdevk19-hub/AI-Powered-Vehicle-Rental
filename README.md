# 🚗 DriveAI - AI-Powered Vehicle Rental & Sharing Platform

DriveAI is a state-of-the-art AI-Powered Vehicle Rental Platform. Users can discover nearby vehicles using natural language queries, check availability, calculate server-validated pricing, reserve vehicles safely with concurrent double-booking protection, query rental policies using Vector RAG (Embedding + Qdrant), and track vehicle locations in real-time on an interactive OpenStreetMap.

---

## 🛠️ Technology Stack & Ports Overview

| Component | Technology / Library | Port Number | Description |
|---|---|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Leaflet, Socket.IO Client | `5173` | Interactive UI with AI Chat, Live Map, and Booking management |
| **Backend API** | NestJS (Node.js), TypeScript, Prisma ORM, Socket.IO | `3000` | Core REST APIs, AI Agent Orchestration, WebSockets, Row Locking |
| **Swagger Docs** | OpenAPI 3.0 / NestJS Swagger | `3000/api/docs` | Interactive API documentation |
| **Python AI Service** | Python 3.12, FastAPI, Uvicorn, Scikit-Learn | `8000` | ML Candidate Ranking Engine & Vector Embedding Pipeline |
| **Python Docs** | FastAPI Swagger Docs | `8000/docs` | Python API documentation |
| **Relational DB** | PostgreSQL 16 | `5432` | Relational data (Vehicles, Users, Reservations, GPS Snapshots) |
| **Vector DB** | Qdrant Vector Database | `6333` | Dense Vector Store for Policy Document RAG Search |

---

## 📂 Project Directory Structure

```text
vechical/
├── backend/                  # NestJS Application
│   ├── prisma/               # Database Schema (schema.prisma) & Seeder (seed.ts)
│   ├── src/
│   │   ├── ai-agent/         # Gemini Tool Calling & Agent Orchestrator
│   │   ├── vehicles/         # Vehicle Search (Haversine GPS Radius), Details, Pricing
│   │   ├── reservations/     # Reservation Engine with PostgreSQL Row Locking (SELECT FOR UPDATE)
│   │   ├── rag/              # RAG Client connecting NestJS to Python Qdrant Service
│   │   ├── tracking/         # Socket.IO Real-time GPS Gateway & Simulation Engine
│   │   └── python-client/    # HttpClient wrapper for Python Microservice
│   └── .env                  # Backend Environment Credentials
├── frontend/                 # React 18 SPA (Vite)
│   ├── src/
│   │   ├── components/       # Navbar, ChatWindow, MapView (Leaflet), Vehicle Cards
│   │   ├── pages/            # Home, AiAssistant, Vehicles, LiveTracking, Reservations
│   │   ├── context/          # SearchLocation Context
│   │   └── services/         # Axios API Client & Socket.IO Listener
├── python-service/           # Python FastAPI AI Microservice
│   ├── app/
│   │   ├── main.py           # FastAPI Endpoints (Recommend, RAG Query, Ingest)
│   │   ├── rag.py            # SentenceTransformers (all-MiniLM-L6-v2) + Qdrant Indexer
│   │   └── recommend.py      # Cosine Similarity Ranking Engine
│   ├── tests/                # Pytest Test Cases
│   └── requirements.txt      # Python Dependencies
├── scripts/                  # Automated E2E & Concurrency Testing
│   ├── assessment-demo.cjs   # End-to-End Requirement Verification Script
│   └── database-check.cjs    # PostgreSQL Row Locking & Radius Test Script
├── docker-compose.yml        # Docker Multi-Container Orchestration
├── run-all.sh                # Shell script to run all 3 services concurrently
└── README.md                 # Project Documentation
```

---

## ⚙️ Step-by-Step Installation & Local Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **Python**: `3.12+` with `pip` and `venv`
- **Docker & Docker Compose** (for PostgreSQL & Qdrant)

---

### Step 1: Clone & Configure Environment Variables
Copy `.env.example` to `backend/.env` and insert your Google Gemini API key:

```bash
# Navigate to project root
cd /path/to/vechical

# Copy backend environment template
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/driveai?schema=public"
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
GEMINI_MODEL="gemini-3.6-flash"
PYTHON_SERVICE_URL="http://localhost:8000"
QDRANT_URL="http://localhost:6333"
```

---

### Step 2: Start Databases (PostgreSQL & Qdrant) using Docker Compose
```bash
docker compose up -d postgres qdrant
```

---

### Step 3: Setup & Start NestJS Backend

1. Navigate to `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Generate Prisma Client & Push Database Schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Seed Database with Initial Demo Vehicles, User (`usr-demo-001`), and Rental Policies:
   ```bash
   npm run prisma:seed
   ```
5. Start Backend in Development Mode:
   ```bash
   npm run start:dev
   ```
   > Backend running at: `http://localhost:3000` | Swagger: `http://localhost:3000/api/docs`

---

### Step 4: Setup & Start Python AI Microservice

Open a **new terminal tab**:

1. Navigate to `python-service` folder:
   ```bash
   cd python-service
   ```
2. Create & Activate Virtual Environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python Dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start FastAPI Server:
   ```bash
   PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   > Python Service running at: `http://localhost:8000` | OpenAPI Docs: `http://localhost:8000/docs`

---

### Step 5: Setup & Start React Frontend

Open a **new terminal tab**:

1. Navigate to `frontend` folder:
   ```bash
   cd frontend
   ```
2. Configure environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm ci
   ```
4. Start Vite Dev Server:
   ```bash
   npm run dev
   ```
   > Frontend running at: `http://localhost:5173`

---

## ⚡ Quick Start: One-Command Launcher

If all dependencies are already installed, you can start all three services simultaneously using the root launcher script:

```bash
./run-all.sh
```

---

## 🧪 Running Test Suites & Scripts

> ⚠️ **Important Note on Directories**: Make sure you run commands from the correct directory as indicated below to avoid `MODULE_NOT_FOUND` errors.

### 1. End-to-End Scenario-Based Live Assessment Script
Must be run from the **Project Root Directory** (`vechical/`):
```bash
# From Project Root: /home/developer/vechical
node scripts/assessment-demo.cjs
```
*If you are currently inside `backend/` folder, run:*
```bash
cd ..
node scripts/assessment-demo.cjs
```

### 2. PostgreSQL Concurrency & Overlap Locking Test
Must be run from the **Project Root Directory** (`vechical/`):
```bash
# From Project Root: /home/developer/vechical
node scripts/database-check.cjs
```

### 3. NestJS Backend Unit Tests (Jest)
Can be run from anywhere using `--prefix backend` or directly inside `backend/`:
```bash
# Option A: From Project Root
npm --prefix backend test

# Option B: From inside backend/ directory
cd backend
npm test
npm run test:assessment
```

### 4. Python AI Service Unit Tests (Pytest)
Must be run from inside the `python-service/` directory:
```bash
cd python-service
PYTHONPATH=. venv/bin/pytest tests/
```

---

## 🔑 Key Features & Architecture Highlights

1. **Natural Language AI Agent & Function Calling**:
   - Google Gemini 3.6 Flash dynamically executes tools (`searchVehicles`, `getVehicleDetails`, `checkAvailability`, `calculatePrice`, `searchRentalPolicy`).
   - Safe **2-Phase Draft Review & Confirmation Flow** prevents unauthorized bookings.

2. **Pessimistic Row Locking Overlap Prevention**:
   - Uses PostgreSQL `SELECT FOR UPDATE` within a Prisma `$transaction` to serialize booking attempts and guarantee ZERO overlapping reservations.

3. **Vector RAG Pipeline**:
   - Policy documents are chunked and converted into 384-dimensional dense vectors using `sentence-transformers/all-MiniLM-L6-v2` and stored in **Qdrant**.
   - Gemini answers policy questions using grounded similarity matches with exact source citations.

4. **Real-time GPS Telemetry & Interactive Leaflet Maps**:
   - Socket.IO gateway broadcasts GPS coordinate updates every 3 seconds.
   - React Leaflet renders smooth position transitions without page reloads.

5. **Local Storage Session Persistence**:
   - AI chat history is persisted in browser `localStorage` (`driveai_chat_history_v2`) and cleared upon clicking **Clear Chat**.

---

## 📄 License & Attribution
Designed & Implemented for Technical Evaluation Assessment - DriveAI Platform.
