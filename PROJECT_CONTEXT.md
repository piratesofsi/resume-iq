# ResumeIQ - Project Context

## 1. Project overview

ResumeIQ is a full-stack resume intelligence app that lets a user upload a resume PDF, enter a job description, and receive a structured job-fit analysis. The project is built as a monorepo with a React frontend, Express API, MongoDB-ready backend persistence, and a Python FastAPI ML service.

The project has moved from a simple MVP into a more polished SaaS-style app while keeping the original working backend contract intact. The implementation prioritizes a reliable local experience, graceful fallbacks when services are unavailable, and preserved compatibility with older analysis payloads.

### Current product goal
The current codebase aims to demonstrate:

- authentic JWT auth and protected user flows
- PDF-based resume upload + parsing
- resume-to-job scoring and recommendations
- resume-only ATS readiness checks for PDF readability and common resume signals
- multi-page app UX and dashboard shell
- saved light/dark theme preference across public and protected pages
- working local fallback behavior when MongoDB or ML services are down
- a portfolio-ready product experience without replacing the working architecture wholesale

### Working status
The app is currently functioning as a working demo/MVP in local development mode with:

- a working auth flow
- protected routes
- analysis upload flow
- dashboard/history/detail views
- resume library and analysis comparison views
- ATS readiness checker at `/ats-checker`
- consistent dark theme styling across shared cards, controls, status states, and charts
- score normalization and rendering
- graceful fallback handling
- polished app shell and dashboard UX

### Known limitations
The app is still intentionally limited in a few areas:

- not production-grade for cloud file storage or large-scale resume archival
- job-fit scoring uses scikit-learn TF-IDF vectors and cosine similarity plus explicit skill/keyword coverage; it does not use a pretrained transformer or a labeled supervised model
- ATS readiness score is a ResumeIQ heuristic, not an employer or vendor ATS result
- the standalone ATS check returns a report but does not create an analysis-history record
- local-only fallback persistence in some cases
- broader roadmap features remain future work beyond the current MVP

## 2. Architecture

### Frontend
- React + Vite
- React Router
- Tailwind CSS styling
- Axios API client
- localStorage-backed auth tokens
- localStorage-backed light/dark theme preference, with OS theme used when no preference is saved
- shared dark palette and theme-aware dashboard/detail charts

### Backend
- Node.js + Express
- JWT middleware
- multer-based PDF upload handling
- Mongoose models for MongoDB persistence
- in-memory fallback store when MongoDB is unavailable

### ML service
- Python FastAPI service
- resume/job analysis endpoint
- scikit-learn TF-IDF unigram/bigram model fitted to the resume, job description, and role profiles per request
- cosine similarity for text and role-profile matching, plus weighted explicit keyword coverage for JD-oriented ATS compatibility
- explainable section and text-length heuristics remain for resume-quality signals

### Persistence model
- MongoDB is the intended persistent store
- when MongoDB is unavailable, the backend uses an in-memory fallback so the app continues to function locally
- this preserves demo usability while keeping the expected API contract stable

## 3. Key directories

- `client/` — React frontend
- `server/` — Express backend
- `ml-service/` — Python FastAPI workforce/analysis service
- `uploads/` — local resume file storage
- `PROJECT_CONTEXT.md` — project state snapshot

## 4. Important files

### Frontend
- `client/src/App.jsx` — app routing and protected route composition
- `client/src/components/AppShell.jsx` — premium sidebar/topbar shell layout
- `client/src/pages/DashboardPage.jsx` — dashboard metrics and recent analysis summary
- `client/src/pages/AnalyzePage.jsx` — PDF upload and job description form
- `client/src/pages/AtsCheckerPage.jsx` — resume-only ATS readiness upload and results
- `client/src/pages/AnalysisDetailPage.jsx` — detailed report and visible scoring-method explanation
- `client/src/pages/HistoryPage.jsx` — analysis history table and filtering
- `client/src/pages/AnalysisDetailPage.jsx` — detailed report rendering
- `client/src/services/api.js` — centralized HTTP client with bearer-token injection and 401 handling
- `client/src/context/AuthContext.jsx` — auth state and token persistence
- `client/src/context/ThemeContext.jsx` — theme preference and toggle state
- `client/src/index.css` — shared styles, card/button components, and dark palette
- `client/index.html` — applies saved/system theme before app render to avoid a theme flash
- `client/src/utils/analysis.js` — normalization helper for old/new analysis payload shapes

### Backend
- `server/src/app.js` — Express app setup, CORS, route mounting, health endpoint
- `server/src/server.js` — database initialization and server startup
- `server/src/routes/auth.js` — auth routes
- `server/src/routes/analysis.js` — protected analysis routes and delete flow
- `server/src/controllers/authController.js` — login/register/user retrieval logic
- `server/src/controllers/analysisController.js` — upload, extraction, analysis creation, retrieval, deletion
- `server/src/middleware/auth.js` — JWT verification and protected-route enforcement
- `server/src/models/User.js` — User schema
- `server/src/models/Analysis.js` — Analysis schema
- `server/src/services/mlClient.js` — ML service client and payload merge logic
- `server/src/store/inMemoryStore.js` — local fallback persistence layer

### ML service
- `ml-service/app/main.py` — FastAPI app entry point
- `ml-service/app/services/resume_analysis.py` — TF-IDF model, cosine similarity, skill coverage, and report payload generation
- `ml-service/requirements.txt` — Python dependency set

## 5. Implemented functionality

### Auth
- registration + login flow
- JWT token issuance and validation
- protected route checks
- current-user endpoint
- local token persistence in browser storage

### Analysis flow
- PDF resume upload through the frontend
- backend PDF extraction using a Node PDF parser path
- job description submission
- backend call to Python ML service
- result normalization and rendering in the UI
- analysis history and detail retrieval per user
- delete-analysis support for a given record

### ATS readiness check
- separate protected PDF upload endpoint that does not require a job description
- calculates a fixed-point heuristic score from common resume sections, contact links, readable extracted text, and measurable outcomes
- returns detected sections, per-check points, and suggestions
- checks LinkedIn URLs from links extracted from the PDF as well as text content
- temporary uploaded PDF is removed after parsing; the standalone check is not saved to analysis history

### ML analysis
- fits a scikit-learn `TfidfVectorizer` to each resume/job pair (unigrams and bigrams) and uses cosine similarity for text similarity and role-profile ranking
- combines similarity with explicit skill and job-term coverage for job-fit and JD ATS-compatibility estimates
- returns the scoring method with each analysis so reports distinguish TF-IDF results from the labeled fallback used when the ML service is unavailable
- the model is a classical, unsupervised text-matching baseline; it is not a trained resume-screening classifier or an employer-specific ATS model

### Dashboard and UX
- premium app shell with sidebar navigation
- dashboard summary cards
- recent analysis list
- refined card layout and SaaS-style styling
- responsive navigation for smaller screens
- light/dark theme toggle on the landing, login, register, and workspace pages
- persisted theme selection and dark-aware forms, badges, charts, and shared card components

### Data compatibility
The frontend contains normalization logic that supports historically inconsistent analysis payloads. This prevents empty cards and rendering gaps when older or partially populated records are returned.

## 6. Known issue history and fixes

The project went through a set of real runtime issues that were fixed during the upgrade work:

- invalid Authorization header construction in the frontend client
- React hook ordering bug in the detail page caused by early return before hooks
- empty analysis cards caused by mismatched top-level fields and nested ML payloads
- Python dependency mismatch with the selected runtime
- PDF extraction problems on uploaded resumes
- stale port conflicts during backend restarts

These were fixed by:

- correcting Bearer token assembly
- moving all hooks before conditional rendering
- normalizing analysis payloads and preserving nested ML metadata
- adjusting Python dependency versions for compatibility
- switching to a more reliable PDF extraction strategy
- validating the server and ML service health/end-to-end local flows

## 7. Current route and API status

### Frontend routes
- `/` — landing page
- `/login` — login
- `/register` — register
- `/dashboard` — dashboard
- `/analyze` — analyze page
- `/ats-checker` — resume-only ATS readiness check
- `/history` — analysis history
- `/analysis/:id` — detailed analysis view
- `/resumes` — resume library
- `/compare` — compare page

### Backend routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/logout`
- `POST /api/analyze`
- `POST /api/ats-check` — protected PDF upload; returns ATS readiness points and checks without saving a history record
- `GET /api/analyses`
- `GET /api/analyses/:id`
- `DELETE /api/analyses/:id`
- `GET /api/health`

### ML service routes
- `GET /health`
- `POST /analyze`

## 8. Analysis payload model

The app has expanded to support richer analysis data while staying compatible with older fields. Relevant analysis data commonly includes:

- `overall_score`
- `match_score`
- `ats_score`
- `semantic_similarity`
- `score_breakdown`
- `skill_analysis`
- `predicted_roles`
- `resume_quality`
- `job_requirements`
- `keyword_coverage`
- `resume_sections`
- `improvement_insights`
- `explainability`
- `resume_vs_job_comparison`

A client-side normalization utility ensures the UI renders correctly even when older or partial payloads are received.

## 9. Current app behavior

### What works reliably
- user sign up and sign in
- protected route enforcement
- analysis creation for PDF resumes and job descriptions
- backend + frontend data flow for history and detail pages
- resume-only ATS readiness check and report
- TF-IDF / cosine-similarity job matching with visible model-method metadata
- theme preference persistence and dark mode across the application
- result rendering for score summaries and key recommendations
- fallback behavior when MongoDB is not connected
- frontend build success in the local environment

### What remains intentionally limited or future work
- pretrained embedding models and validation against a labeled resume/job relevance dataset
- more advanced recruiter/reporting workflows
- cloud file storage + archival lifecycle
- deeper analysis breakdowns and resume-version comparison features
- saving ATS checker results to history (currently the endpoint returns a report only)
- production-hardening for JWT secrets, file cleanup, and storage durability

## 10. Implementation notes and product truths

This project is intentionally honest about its current capabilities:

- job matching now uses a classical TF-IDF vector-space model and cosine similarity, alongside exact skill signals
- section quality and the standalone ATS readiness check still use transparent heuristics
- there is no labeled evaluation dataset yet, so scores are estimates rather than calibrated hiring probabilities
- the app is a working local demo/product-style portfolio app rather than a full production resume platform
- the focus has been to keep the system stable and feature-complete enough for believable demo usage
- the broader product roadmap remains available for later upgrades without breaking the current architecture

## 11. Recommended next steps

1. Add resume version tracking and stronger library/file lifecycle handling.
2. Extend reports with deeper recruiter-friendly insights and export options.
3. Evaluate the TF-IDF baseline on labeled resume/job pairs, then compare it with a pretrained embedding model.
4. Harden production security, file cleanup, and storage configuration.
5. Validate with a real persistent MongoDB environment instead of local fallback-only usage.

## 12. Bottom line

The project is currently a working local demo: authentication, protected routes, resume/job analysis, analysis history, resume-only ATS readiness checks, and light/dark theming are implemented. Job matching uses a scikit-learn TF-IDF/cosine-similarity model with explicit keyword signals. The model still needs labeled evaluation and could later be compared with pretrained embeddings; production hardening remains future work.
