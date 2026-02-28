# VeriTone: Multimodal Credibility Analysis Engine for Public Communications

## The Core Idea

A platform that ingests video of public-facing communications — earnings calls, congressional testimony, press conferences, startup pitch recordings — and produces a **sentiment divergence score** by cross-analyzing three modalities simultaneously:

- **What they say** (transcript semantics)
- **How they say it** (vocal biomarkers — pitch, cadence, pause patterns, vocal fry)
- **What their body shows** (micro-expressions, gaze aversion, gesture frequency)

The key insight: when these three signals disagree, something interesting is happening. A CEO saying "We're extremely confident in Q3 guidance" while their vocal pitch rises and their blink rate doubles is a meaningful data point. No tool on the market surfaces this divergence in a structured, queryable way.

**Positioning one-liner:** VeriTone turns video into a **queryable credibility timeline** — the same interface for earnings calls, testimony, and pitches.

---

## Why This Is Niche and Commercially Viable

- **The gap:** Bloomberg Terminal gives you transcript sentiment. Zoom gives you call recordings. Nobody stitches together audio emotion, facial micro-expression, and semantic analysis into a single divergence timeline that an analyst can query with natural language.
- **Who would pay:**
  - Quantitative hedge funds — alternative data for earnings season (real, massive market)
  - Investigative journalists — analyzing political testimony for inconsistencies
  - HR/recruiting platforms — structured interview analysis (huge TAM; ethically navigable if consent-based)
  - Due diligence firms — analyzing founder pitches before investment decisions
  - Academic researchers — communication studies, political science, psychology

**Monetization paths:**

- **API-as-a-service** — charge per video-minute analyzed (e.g. $0.50–2.00/min for hedge funds). Consider a **free tier** (e.g. 10 min/month) for journalists and academics to drive adoption and case studies.
- **SaaS dashboard** — monthly subscription for journalism orgs, recruiting teams
- **Data feed** — sell structured divergence data on public earnings calls as alternative data to quant funds (venture-backable; position as **future monetization** while the resume project focuses on platform + API + dashboard)
- **White-label** — license the engine to existing platforms (Bloomberg, Zoom, BrightHire)

---

## Data and Ethics

- **Consent:** For non-public content (e.g. HR/recruiting), analysis only with **explicit consent** and disclosed use. State this clearly in README and public materials.
- **Bias and limitations:** FER and vocal-stress models can exhibit demographic and cultural bias. Include a **Limitations** section in product and docs: *"Emotion and stress signals may vary by culture and individual; use as one input to human judgment, not as the sole basis for decisions."*
- **Demo data:** Use only public-domain or clearly licensed sources. Pre-load **3–5 videos with known 'divergence moments'** (e.g. a tough Q&A segment) so the demo narrative is obvious; optionally expand to 10–15 for breadth.

---

## Technical Architecture

### Core Data Schema

Define early to keep ingestion, divergence, and RAG aligned:

- **Video** — `id`, `source` (url/path), `duration`, `created_at`, `metadata` (source, date, speaker_ids).
- **Utterance** — `id`, `video_id`, `speaker_id`, `start_ts`, `end_ts`, `text`, `embedding_id` (for RAG).
- **ModalityScores** — per utterance: `semantic_label`, `semantic_confidence`, `vocal_label`, `vocal_confidence`, `facial_label`, `facial_confidence` (or N/A if modality failed).
- **DivergenceScore** — `utterance_id`, `score` (0–1), `flags[]` (e.g. "verbal-somatic mismatch on forward-looking claim").
- **Storage:** PostgreSQL (or SQLite for local demo) for relational data; vector DB (FAISS or Pinecone) for utterance embeddings. Support **partial results** (e.g. semantic + vocal only when face is off-camera).

### Layer 1: Ingestion Pipeline

```
Video Input (MP4/WebM/YouTube URL)
       │
       ├──► FFmpeg → Audio extraction (WAV, 16kHz mono)
       ├──► FFmpeg → Frame extraction (2 FPS for facial analysis; optional 5–10 FPS "high-sensitivity" mode for short segments later)
       └──► Metadata tagging (source, date, speaker ID)
```

- **FastAPI:** `POST /ingest` accepts video file or URL.
- **yt-dlp** for YouTube/public video ingestion.
- **Storage:** S3 or **MinIO locally** for raw assets; **PostgreSQL or SQLite** for metadata (SQLite reduces setup friction for local/demo).

### Layer 2: Modality Processing (Three Streams)

**Stream A — Semantic (text)**

- Whisper (large-v3) for speaker-diarized transcription.
- Chunk into utterance-level segments with timestamps.
- Embeddings: OpenAI text-embedding-3-small or open-source e5-large-v2; store in FAISS or Pinecone for RAG.
- LLM-based sentiment per utterance: `{positive, negative, neutral, hedging, deflecting}`.
- Optional: claim density — flag factual assertions vs vague language.

**Stream B — Vocal biomarkers (audio)**

- Use **Wav2Vec 2.0** fine-tuned on emotion, or an **off-the-shelf** emotion model (e.g. SpeechBrain) for the demo; note "custom fine-tuning" as a roadmap item.
- Per-utterance features: F0, jitter, shimmer, speech rate, pause duration, energy contour.
- **Vocal stress index:** deviation from speaker baseline. **Baseline strategy:** avoid "first 60 seconds only" (often nervous). Use **rolling baseline** (e.g. per-call median F0 and speech rate) or optional manual "calm" segment; document in README.
- Classify vocal affect: `{confident, stressed, monotone, animated, hesitant}`.

**Stream C — Facial / gestural (video)**

- MediaPipe Face Mesh (468 landmarks).
- Per-frame: blink rate, lip compression, brow position, gaze direction, head movement velocity.
- Lightweight classifier (e.g. fine-tuned on FER2013 + AffectNet) for micro-expressions.
- Aggregate to utterance-level: `{congruent, incongruent, neutral}`; self-soothing gestures (face touching, lip biting) as stress indicators.
- **2 FPS** is sufficient for MVP; add optional **high-sensitivity** mode (5–10 FPS) for short segments if needed for demo.

### Layer 3: Divergence Engine (The Secret Sauce)

For each utterance, three signal vectors are combined into a **divergence score** and flags.

**Important:** Semantic, vocal, and facial outputs live in different spaces (embeddings vs acoustic features vs categorical labels). Two approaches:

1. **Rule-based + aggregate score (recommended for MVP):** Define divergence as rules and thresholds, e.g. "semantic = positive AND vocal = stressed AND facial = incongruent → high divergence." Compute a normalized aggregate (e.g. weighted sum of pairwise mismatches) to get a 0–1 score. Easier to ship and explain.
2. **Shared embedding (roadmap):** Map all three modalities into one embedding space (e.g. projection heads), then use pairwise cosine distance between the three vectors. More scalable and research-oriented; add after MVP.

**Example output:**

```
Utterance #47: "We see no material risk to our supply chain."
  Semantic:  positive (0.89)
  Vocal:     stressed (F0 +22% from baseline, pause before "no")
  Facial:    incongruent (lip compression, gaze aversion)

  → Divergence Score: 0.78 / 1.00 (HIGH)
  → Flag: "Verbal-somatic mismatch on forward-looking claim"
```

- **Timeline:** Users scrub through video and see divergence spikes overlaid on the transcript — like a seismograph for credibility.

### Layer 4: RAG-Powered Query Interface

- All utterances, modality scores, and divergence flags are embedded and stored.
- **Schema for cross-video:** Store `(video_id, speaker_id, quarter_or_segment)` (or topic tags) so queries like "Compare CEO body language when discussing Q2 vs Q3" can retrieve and align across videos. Design this into the index from the start.
- **MVP scope:** Prioritize **single-video** natural language queries; add cross-video compare in a later phase.
- Example queries:
  - "Show me every time the CFO discussed margins with high vocal stress"
  - "Compare the CEO's body language when discussing Q2 vs Q3 guidance" (when cross-video is supported)
  - "Find all high-divergence moments in the last 5 earnings calls from this company"
- LLM retrieves via vector search, then synthesizes an analytical summary with **citations** (timestamp links back to the video).

### Layer 5: API and Deployment

**Endpoints (document request/response shapes early; e.g. OpenAPI sketch):**

- `POST /ingest` — submit video (file or URL); return `video_id`, status.
- `GET /analysis/{video_id}` — full multimodal report (including partial results when a modality fails).
- `POST /query` — RAG natural language search (query string, optional filters, limit).
- `GET /timeline/{video_id}` — divergence timeline data.
- `GET /compare` — cross-video speaker comparison (post-MVP).

**Failure modes and partial results:**

- If Whisper fails (bad audio): return error or partial transcript; do not block other modalities.
- If face is off-camera or detector fails: run semantic + vocal only; surface **"Facial: N/A"** in API and UI so the product degrades gracefully.

**Deployment:**

- Docker (multi-stage: inference container + API container).
- AWS (EC2 GPU for inference, ECS for API, S3) or Modal/Replicate for serverless GPU.
- Auth: API keys + JWT for web dashboard.

### Layer 6: Frontend Dashboard

- **Stack:** React + Tailwind.
- Video player with synced transcript, divergence overlay, and per-modality breakdown.
- Clickable divergence spikes that jump to the video timestamp.
- Side panel: RAG chat for natural language queries.
- Comparative view (same speaker across multiple appearances) — post-MVP.
- Export to PDF report (for due diligence).

---

## Build Plan (with Claude Code + Cursor)

**MVP phasing (recommended):**

- **MVP 1 (resume demo):** Ingestion (file + one YouTube) → transcript + **one non-text modality** (e.g. vocal only) → **two-way divergence** (semantic vs vocal) → timeline + one RAG query type. Already a strong differentiator.
- **MVP 2:** Add facial stream and **three-way divergence**.
- **MVP 3:** Multi-video compare, export, polish.

**Phase breakdown:**

| Phase | Duration | Tools | Output | Notes |
|-------|----------|--------|--------|--------|
| 1. Pipeline scaffolding | 3 days | Claude Code | FastAPI skeleton, Docker setup, MinIO/S3 + Postgres or SQLite, ingestion endpoint | Use MinIO + SQLite for local demo to reduce setup friction. |
| 2. Modality processors | 5–6 days | Claude Code + Cursor | Whisper → transcript (1–2 d); Wav2Vec/off-the-shelf emotion → vocal (2 d); MediaPipe + FER → facial (2 d). Each outputs per-utterance JSON. | Order: transcript first, then vocal, then facial. Use off-the-shelf emotion model if no custom Wav2Vec yet. |
| 3. Divergence engine | 2 days | Claude Code | Rule-based score + flags; timeline generation. | Use rule-based divergence first; add shared-embedding option later if needed. |
| 4. RAG layer | 2–3 days | Claude Code | Embedding pipeline, FAISS (or Pinecone) index, query endpoint with LLM synthesis. | Scope to single-video queries for MVP; design schema for cross-video. |
| 5. Frontend | 4 days | Cursor | React dashboard: video player, timeline viz, chat panel. | Prioritize: video + transcript + divergence timeline, then RAG chat. |
| 6. Demo data + polish | 3 days | Both | Ingest 3–5 (or 10–15) public videos; **scripted demo narrative** (e.g. "Watch this spike when they discuss margins"); README; demo video. | Pick videos with clear divergence moments. |

**Total:** ~3 weeks for full system; ~2 weeks for MVP 1 (two modalities + basic divergence).

---

## Data Sources for Demo

Public and impressive:

- **Earnings calls:** YouTube (e.g. Apple, Tesla — Tesla often very expressive).
- **Congressional testimony:** C-SPAN (public domain).
- **Press conferences:** White House, NASA, etc.
- **Veteran interviews** (with consent) — if applicable to your story.

Pre-load **3–5 videos with known divergence moments** for the core demo; optionally expand to 10–15 for breadth.

---

## Resume and Portfolio

- **Repo:** Single README with: problem, approach (three modalities → divergence), architecture diagram, demo link, **Limitations & ethics**.
- **Demo video:** 2–3 minutes: upload a clip → show timeline with one clear divergence spike → one RAG query → result with timestamp.
- **Tech stack line:** e.g. *"Python (FastAPI, Whisper, PyTorch), React, vector search (FAISS/Pinecone), Docker."*

---

## Summary of Suggestions Implemented

- **Divergence:** Rule-based + aggregate score for MVP; shared-embedding as roadmap.
- **Vocal baseline:** Rolling baseline (or manual calm segment); documented limitation.
- **Facial:** 2 FPS for MVP; optional high-sensitivity mode noted.
- **RAG:** Schema and index designed for cross-video (video_id, speaker_id, segment); single-video first in MVP.
- **MVP phasing:** MVP1 (2 modalities), MVP2 (facial + 3-way), MVP3 (compare, export).
- **Ethics:** Consent and limitations section; bias disclaimer.
- **Demo data:** 3–5 videos with clear divergence moments; scripted demo narrative.
- **Commercial:** Free tier, sharper one-liner, data feed as future; focus on platform/API/dashboard.
- **Build plan:** MinIO/SQLite option; ordered modality work; off-the-shelf emotion model; failure modes and partial results.
- **New sections:** Core data schema, API design (request/response), failure modes and partial results.
- **Resume:** README contents, demo video length, tech stack line.
