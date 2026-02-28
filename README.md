# VeriTone

**Multimodal Credibility Analysis Engine for Public Communications.** VeriTone ingests video (earnings calls, testimony, press conferences, pitches) and produces a queryable **sentiment divergence score** by cross-analyzing what is said (transcript), how it is said (vocal biomarkers), and what the body shows (micro-expressions and gesture).

See [VERITONE_OUTLINE.md](VERITONE_OUTLINE.md) for the full product and technical outline.

## Quick start

**Local run (no Docker):**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

**Frontend dashboard (React + Tailwind):**

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://localhost:3000 (proxies API to backend; run backend on port 8000).

**Docker (API + optional MinIO):**

```bash
docker compose up --build
```

With default `STORAGE_TYPE=local`, only the API container runs. Set `STORAGE_TYPE=minio` and use the included MinIO service for S3-compatible storage.

## API (Phase 1 + 2a + 2b + 4)

- `GET /health` — health check
- `POST /api/v1/ingest` — upload a video file (multipart); returns `video_id` and status
- `POST /api/v1/ingest/url` — ingest from URL (JSON `{"url": "..."}`)
- `POST /api/v1/videos/{video_id}/transcribe` — run FFmpeg + faster-whisper; returns utterance count and status
- `POST /api/v1/videos/{video_id}/process-vocal` — run vocal emotion model (SpeechBrain) per utterance; requires transcript
- `POST /api/v1/videos/{video_id}/compute-divergence` — compute two-way divergence (semantic vs vocal)
- `GET /api/v1/analysis/{video_id}` — full analysis (transcript + vocal labels + divergence when available)
- `GET /api/v1/timeline/{video_id}` — divergence timeline (for UI overlay)
- `POST /api/v1/query` — natural-language search over transcripts (RAG). Body: `{"query": "...", "video_id": "optional", "limit": 10, "rebuild": false}`. Builds FAISS index on first use or when `rebuild=true`.

**Pipeline order:** ingest → transcribe → process-vocal → compute-divergence. Then use `GET /analysis`, `GET /timeline`, or `POST /query`.

Set `WHISPER_MODEL`, `WORK_DIR`, and `EMBEDDING_MODEL` (e.g. `all-MiniLM-L6-v2`) in `.env` if needed. RAG uses **sentence-transformers** + **FAISS** (local, no API key).

## Push to GitHub

From the project root (`veritone/`), run:

```bash
# 1. Initialize repo (if not already)
git init

# 2. Stage and commit
git add .
git commit -m "Phase 1: pipeline scaffolding (ingest, storage, SQLite, Docker)"

# 3. Create the repo on GitHub, then add your remote and push:
#    - Go to https://github.com/new
#    - Repository name: veritone (or any name)
#    - Do not add README, .gitignore, or license (you already have them)
#    - Create repository, then run:

git remote add origin https://github.com/vsahasi/veritone.git
git branch -M main
git push -u origin main
```

If you use SSH: `git remote add origin git@github.com:vsahasi/veritone.git`  
If the repo name on GitHub is different, replace `veritone` in the URL with your repo name.
