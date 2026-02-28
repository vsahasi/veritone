# VeriTone: Multimodal Credibility Analysis Engine for Public Communications

## The Core Idea

A platform that ingests video of public-facing communications — earnings calls, congressional testimony, press conferences, startup pitch recordings — and produces a **sentiment divergence score** by cross-analyzing three modalities simultaneously:

- **What they say** (transcript semantics)
- **How they say it** (vocal biomarkers — pitch, cadence, pause patterns, vocal fry)
- **What their body shows** (micro-expressions, gaze aversion, gesture frequency)

The key insight: when these three signals disagree, something interesting is happening. A CEO saying "We're extremely confident in Q3 guidance" while their vocal pitch rises and their blink rate doubles is a meaningful data point. No tool on the market surfaces this divergence in a structured, queryable way.

**Positioning:** VeriTone turns video into a **queryable credibility timeline** — the same interface for earnings calls, testimony, and pitches.

---

## Why This Is Niche and Commercially Viable

- **The gap:** Bloomberg Terminal gives transcript sentiment; Zoom gives call recordings. VeriTone stitches together audio emotion, facial micro-expression, and semantic analysis into a single divergence timeline that an analyst can query with natural language.
- **Target users:** Quantitative hedge funds (alternative data for earnings), investigative journalists (political testimony), HR/recruiting platforms (consent-based interview analysis), due diligence firms (founder pitches), academic researchers (communication and political science).

**Monetization paths:** API-as-a-service (per video-minute pricing; optional free tier for journalists/academics), SaaS dashboard, data feed on public earnings (alternative data for quant funds), white-label licensing to existing platforms (Bloomberg, Zoom, BrightHire).

---

## Data and Ethics

- **Consent:** For non-public content (e.g. HR/recruiting), analysis is limited to explicit consent and disclosed use; this is stated in the README and public materials.
- **Limitations:** FER and vocal-stress models can exhibit demographic and cultural bias. The product and docs include a Limitations section: emotion and stress signals may vary by culture and individual and are intended as one input to human judgment, not the sole basis for decisions.
- **Demo data:** Public-domain or clearly licensed sources only. The core demo uses 3–5 videos with known divergence moments (e.g. a tough Q&A); the set can be expanded to 10–15 for breadth.

---

## Technical Architecture

### Core Data Schema

The schema keeps ingestion, divergence, and RAG aligned:

- **Video** — `id`, `source` (url/path), `duration`, `created_at`, `metadata` (source, date, speaker_ids).
- **Utterance** — `id`, `video_id`, `speaker_id`, `start_ts`, `end_ts`, `text`, `embedding_id` (for RAG).
- **ModalityScores** — per utterance: `semantic_label`, `semantic_confidence`, `vocal_label`, `vocal_confidence`, `facial_label`, `facial_confidence` (or N/A if a modality failed).
- **DivergenceScore** — `utterance_id`, `score` (0–1), `flags[]` (e.g. "verbal-somatic mismatch on forward-looking claim").
- **Storage:** PostgreSQL or SQLite (local demo) for relational data; vector DB (FAISS or Pinecone) for utterance embeddings. Partial results are supported (e.g. semantic + vocal only when face is off-camera).

### Layer 1: Ingestion Pipeline

Video input (MP4/WebM or YouTube URL) is accepted via FastAPI. FFmpeg will handle audio extraction (WAV, 16kHz mono) and frame extraction (2 FPS for facial analysis; optional 5–10 FPS high-sensitivity mode for short segments). Raw assets are stored in S3 or MinIO locally; metadata in PostgreSQL or SQLite. yt-dlp is used for YouTube/public video ingestion. **Status:** Implemented — `POST /ingest` (file and URL), storage abstraction (local + MinIO), SQLite, Docker.

### Layer 2: Modality Processing (Three Streams)

**Stream A — Semantic (text):** Whisper (large-v3) for speaker-diarized transcription; utterance-level segments with timestamps; embeddings (OpenAI text-embedding-3-small or e5-large-v2) stored for RAG; LLM-based sentiment per utterance (`positive`, `negative`, `neutral`, `hedging`, `deflecting`); optional claim-density detection.

**Stream B — Vocal biomarkers (audio):** Wav2Vec 2.0 fine-tuned on emotion or an off-the-shelf emotion model (e.g. SpeechBrain) for the demo; per-utterance features (F0, jitter, shimmer, speech rate, pause duration, energy contour); vocal stress index from deviation to a rolling speaker baseline (per-call median F0/speech rate or optional manual calm segment); vocal affect labels: `confident`, `stressed`, `monotone`, `animated`, `hesitant`.

**Stream C — Facial / gestural (video):** MediaPipe Face Mesh (468 landmarks); per-frame metrics (blink rate, lip compression, brow position, gaze direction, head movement velocity); lightweight micro-expression classifier (e.g. FER2013 + AffectNet); utterance-level aggregate: `congruent`, `incongruent`, `neutral`; self-soothing gestures as stress indicators. Frame rate: 2 FPS for MVP; optional 5–10 FPS high-sensitivity mode for short segments.

### Layer 3: Divergence Engine

For each utterance, the three modality signals are combined into a divergence score (0–1) and flags. Because semantic, vocal, and facial outputs live in different spaces, the MVP uses a **rule-based + aggregate score** (e.g. semantic positive + vocal stressed + facial incongruent → high divergence; normalized weighted sum of pairwise mismatches). A **shared-embedding** approach (projection into one space, pairwise cosine distance) is on the roadmap for later. The UI presents a timeline where users scrub through the video and see divergence spikes overlaid on the transcript.

### Layer 4: RAG-Powered Query Interface

Utterances, modality scores, and divergence flags are embedded and stored. The index schema supports cross-video queries (e.g. `video_id`, `speaker_id`, segment/topic) for questions like "Compare CEO body language when discussing Q2 vs Q3." MVP focuses on single-video natural language queries; cross-video compare is a later phase. The LLM retrieves via vector search and returns an analytical summary with timestamp citations back to the video.

### Layer 5: API and Deployment

**Endpoints:** `POST /ingest` (video file or URL), `GET /analysis/{video_id}` (full report, including partial results when a modality fails), `POST /query` (RAG search), `GET /timeline/{video_id}`, `GET /compare` (cross-video; post-MVP). Failure handling: Whisper failures do not block other modalities; missing face yields semantic + vocal only with "Facial: N/A" in API and UI. Deployment: Docker (multi-stage inference + API), with options for AWS (EC2 GPU, ECS, S3) or Modal/Replicate; auth via API keys + JWT for the web dashboard.

### Layer 6: Frontend Dashboard

React + Tailwind: video player with synced transcript and divergence overlay, per-modality breakdown, clickable divergence spikes (jump to timestamp), RAG chat side panel, comparative view (same speaker across appearances) post-MVP, and PDF export for due diligence.

---

## Build Plan

**MVP phasing:**

- **MVP 1 (resume demo):** Ingestion (file + YouTube) → transcript + one non-text modality (e.g. vocal) → two-way divergence (semantic vs vocal) → timeline + one RAG query type.
- **MVP 2:** Facial stream + three-way divergence.
- **MVP 3:** Multi-video compare, export, polish.

**Phases:**

| Phase | Duration | Output | Notes |
|-------|----------|--------|--------|
| 1. Pipeline scaffolding | 3 days | FastAPI skeleton, Docker, storage (MinIO/SQLite), ingestion endpoint | **Done.** Local + MinIO storage; SQLite for metadata. |
| 2. Modality processors | 5–6 days | Whisper → transcript; emotion model → vocal; MediaPipe + FER → facial; per-utterance JSON | Transcript first, then vocal, then facial; off-the-shelf emotion model for demo. |
| 3. Divergence engine | 2 days | Rule-based score + flags; timeline generation | Shared-embedding option later. |
| 4. RAG layer | 2–3 days | Embedding pipeline, FAISS/Pinecone index, query endpoint with LLM | Single-video first; schema ready for cross-video. |
| 5. Frontend | 4 days | React dashboard: video player, timeline, RAG chat | Timeline and transcript first, then chat. |
| 6. Demo data + polish | 3 days | 3–5 (or 10–15) public videos, scripted demo narrative, README, demo video | Videos chosen for clear divergence moments. |

**Total:** ~3 weeks for full system; ~2 weeks for MVP 1.

---

## Data Sources for Demo

Public sources: earnings calls (YouTube — e.g. Apple, Tesla), congressional testimony (C-SPAN), press conferences (White House, NASA). Optional: veteran or other interviews with consent. Core demo: 3–5 videos with known divergence moments; optional expansion to 10–15.

---

## Resume and Portfolio

- **Repo:** README with problem, approach (three modalities → divergence), architecture, demo link, Limitations & ethics.
- **Demo video:** 2–3 minutes — upload clip, show timeline with one clear divergence spike, run one RAG query, show result with timestamp.
- **Tech stack:** Python (FastAPI, Whisper, PyTorch), React, vector search (FAISS/Pinecone), Docker.

---

## Design Decisions (Summary)

- **Divergence:** Rule-based aggregate score for MVP; shared-embedding on roadmap.
- **Vocal baseline:** Rolling baseline (or manual calm segment) instead of first 60 seconds; limitation documented.
- **Facial:** 2 FPS for MVP; optional high-sensitivity mode for short segments.
- **RAG:** Index designed for cross-video (video_id, speaker_id, segment); single-video queries first in MVP.
- **Ethics:** Consent and limitations section; bias disclaimer in product and docs.
- **Demo:** 3–5 videos with clear divergence moments; scripted narrative for the demo.
- **Commercial:** Free tier for adoption; data feed positioned as future monetization; focus on platform, API, and dashboard for the resume project.
