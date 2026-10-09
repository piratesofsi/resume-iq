# ResumeIQ Project Summary

## Overview

ResumeIQ is a resume analysis web app. Users can upload a PDF, compare its content with a job description, review matching and missing skills, and check general resume readability and structure. The project is a local-demo/portfolio app, not a production hiring system.

## Architecture

- **Frontend:** React, Vite, React Router, Tailwind CSS, and Axios (`client/`).
- **API:** Node.js and Express with JWT authentication, PDF uploads, and analysis endpoints (`server/`).
- **Analysis service:** Python FastAPI using scikit-learn TF-IDF vectors, cosine similarity, and skill/keyword coverage for resume-to-job matching (`ml-service/`).
- **Persistence:** MongoDB via Mongoose when available; an in-memory fallback supports local use when MongoDB is unavailable.
- **Resume files:** Stored locally under `uploads/` for the current demo setup.

## User-facing features

- Register, log in, and access protected workspace routes.
- Upload a resume PDF and analyze it against a job description.
- View dashboard metrics, analysis history, and detailed reports.
- Compare prior analyses and browse the resume library.
- Run an **ATS readiness check** from `/ats-checker`. It scores text readability and common resume sections without requiring a job description. This is a ResumeIQ heuristic, not a score from a specific employer's ATS.
- Toggle light and dark themes. The preference is saved in local storage, and the initial page theme is applied before rendering to avoid a light-theme flash.

## Frontend routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product landing page | Public |
| `/login` | Sign in | Public |
| `/register` | Create an account | Public |
| `/dashboard` | Metrics and recent activity | Protected |
| `/analyze` | Resume and job-description analysis | Protected |
| `/ats-checker` | Resume-only ATS readiness check | Protected |
| `/history` | Search, filter, and review analyses | Protected |
| `/analysis/:id` | Detailed analysis report | Protected |
| `/resumes` | Resume library | Protected |
| `/compare` | Compare analysis results | Protected |

## API routes

- `GET /api/health` — API health check.
- `POST /api/auth/register`, `POST /api/auth/login` — account registration and login.
- `GET /api/auth/me`, `GET /api/auth/logout` — current-user and logout endpoints.
- `POST /api/analyze` — protected resume/job analysis upload.
- `POST /api/ats-check` — protected resume-only readiness check.
- `GET /api/analyses`, `GET /api/analyses/:id`, `DELETE /api/analyses/:id` — analysis history, detail, and deletion.
- ML service: `GET /health` and `POST /analyze`.

## Analysis behavior

For each analysis, the ML service fits a TF-IDF unigram/bigram vectorizer over the resume, job description, and role profiles. Cosine similarity estimates text and role-profile similarity; exact skill and weighted job-term coverage contribute to the job-fit and JD ATS-compatibility scores. The method and scoring details are stored with each analysis. If the ML service is unavailable, the API retains a labeled heuristic fallback rather than presenting that result as a model score.

This is a classical, unsupervised text-matching baseline, not a pretrained transformer or a supervised classifier trained on hiring outcomes. The separate resume-only ATS readiness checker remains a transparent heuristic checklist. Neither score guarantees an employer screening decision. The frontend normalizes older and newer payloads so historical records can still render.

## Useful entry points

- `client/src/App.jsx` — frontend routes and providers.
- `client/src/components/AppShell.jsx` — protected workspace shell and navigation.
- `client/src/context/ThemeContext.jsx` and `client/src/index.css` — theme state and shared styling.
- `client/src/pages/AtsCheckerPage.jsx` — ATS readiness experience.
- `client/src/utils/analysis.js` — analysis normalization and score labels.
- `server/src/app.js` — Express setup and route mounting.
- `server/src/routes/analysis.js` — analysis API routes.
- `server/src/controllers/analysisController.js` — analysis and ATS check handlers.
- `ml-service/app/services/resume_analysis.py` — TF-IDF model, cosine similarity, and score generation.

## Current limitations

- ATS readiness is a heuristic score, not a vendor-specific ATS compatibility test.
- The model has not yet been evaluated against a labeled resume/job relevance dataset or calibrated to real hiring outcomes.
- Resume quality and the standalone ATS readiness score still use transparent heuristics.
- Local file storage and in-memory persistence fallback are intended for development/demo use; they do not provide durable production storage.
- Production deployment still needs security, storage lifecycle, and persistent-database hardening.

## Build check

The client production build completes successfully. The ML service uses scikit-learn 1.9.1; install it with `pip install -r ml-service/requirements.txt` before starting the Python service locally. Docker Compose installs the ML requirements on startup. Python syntax compilation and the frontend build passed after the TF-IDF update; an end-to-end ML request still needs a runtime with scikit-learn installed.
