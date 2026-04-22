# ⚡ Prompt Architect

A professional, full-stack monorepo application designed to evaluate and optimize AI prompts using the Google Gemini 3 API. This tool transforms raw drafts into highly-engineered instructions while providing real-time telemetry on cost, latency, and token consumption.

### 🚀 Key Features

* **Intelligent Optimization:** Uses state-of-the-art reasoning to restructure prompts for clarity and persona.
* **Analysis Dashboard:** Provides a numerical score (0-100) across four dimensions: Clarity, Context, Constraints, and Persona.
* **Real-time Telemetry:** Instant feedback on API latency, token counts, and estimated USD cost.
* **Creative Control:** Adjust model temperature and strategy (Logical, Creative, or Concise) via a unified UI.
* **Developer Export:** One-click Python code snippets to integrate optimized prompts into your own apps.
* **Dockerized Architecture:** Modern microservice setup with separate Backend (FastAPI) and Frontend (React) containers.

### 📂 Project Structure

```text
prompt-optimizer/
├── .gitignore               # Root-level Git exclusions
├── docker-compose.yml       # Orchestrates Backend & Frontend
├── README.md                # Project documentation
├── backend/                 # FastAPI Microservice
│   ├── main.py              # Core Logic & Gemini Integration
│   ├── Dockerfile           # Python Container Definition
│   ├── requirements.txt     # Backend Dependencies
│   └── .env                 # API Keys (DO NOT COMMIT)
└── frontend/                # React + Vite + Tailwind SPA
    ├── src/
    │   ├── App.jsx          # UI Logic & Streaming Handling
    │   └── main.jsx         # Entry Point
    ├── Dockerfile           # Nginx/Node Container Definition
    └── package.json         # Node Dependencies
```

### 🛠️ Tech Stack
**Backend:** Python 3.10+, FastAPI, Google GenAI SDK.
**Frontend:** React (Vite), Tailwind CSS, Headless UI.
**Observability:** LangSmith (Optional tracing support).
**DevOps:** Docker, Nginx.

### 🚦 Getting Started

**1. Prerequisites**
    * Docker Desktop
    * Google Gemini API Key

**2. Environment Configuration**
Create a `.env` file inside the `backend/` directory:
```bash
GEMINI_API_KEY=<your_actual_key_here>
```

**3. Running with Docker (Recommended)**
```bash
docker compose up --build
```
* UI: http://localhost:3000
* API: http://localhost:8000/docs

**4. Local Development (Manual)**

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

