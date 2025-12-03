# DATABank — Starter Full-Stack Template

Tech:
- Backend: FastAPI + Uvicorn
- Frontend: React (Vite) + Tailwind CSS
- Local: Docker + docker-compose
- Tests: pytest (backend), @testing-library/react (frontend)

Quickstart (local, without Docker)
1. Backend
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env        # edit if needed
   uvicorn app.main:app --reload --port 8000

2. Frontend
   cd frontend
   npm install
   cp .env.example .env
   npm run dev

Docker (recommended)
- docker compose up --build

Tests:
- Backend: pytest backend/app/tests -q
- Frontend: cd frontend && npm test -- --watchAll=false

