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

**Docker (API + optional MinIO):**

```bash
docker compose up --build
```

With default `STORAGE_TYPE=local`, only the API container runs. Set `STORAGE_TYPE=minio` and use the included MinIO service for S3-compatible storage.

## Phase 1 (current)

- `GET /health` — health check
- `POST /ingest` — upload a video file (multipart) or submit a URL (JSON `{"url": "..."}`) to ingest; returns `video_id` and status.

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
