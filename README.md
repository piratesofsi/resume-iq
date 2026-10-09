# ResumeIQ

ResumeIQ is a full-stack resume intelligence platform that helps users upload a resume, compare it with a job description, and receive an ML/NLP-informed match analysis.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB
- ML Service: Python + FastAPI

## Repository structure

- `client/` — React frontend
- `server/` — Express API and MongoDB models
- `ml-service/` — Python ML/NLP service
- `uploads/` — local resume storage

## Quick start

1. Install dependencies:
   - `cd client && npm install`
   - `cd server && npm install`
   - `cd ml-service && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
2. Start MongoDB.
3. Start the ML service:
   - `cd ml-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`
4. Start the server:
   - `cd server && npm run dev`
5. Start the client:
   - `cd client && npm run dev`

## Default ports

- Frontend: http://localhost:5173
- Server: http://localhost:5000
- ML Service: http://localhost:8001
- MongoDB: mongodb://localhost:27017

## Important notes

- The Node backend is the main app backend and orchestrates the ML service.
- The Python service does not handle auth or user database operations.
- Uploads are stored locally in `uploads/` by default and can later be moved to S3/Cloudflare R2.
