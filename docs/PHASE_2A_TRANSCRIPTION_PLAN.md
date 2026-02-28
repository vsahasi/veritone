# Phase 2a: Transcription Pipeline (Next Step)

**Goal:** After a video is ingested, run FFmpeg to extract audio and Whisper to produce a timestamped transcript. Persist utterance-level segments so the divergence engine and RAG layer can consume them later. This is the first modality stream and unblocks MVP 1 (semantic + vocal → two-way divergence).

---

## Scope

- **In scope:** Audio extraction (FFmpeg), Whisper transcription, utterance table and persistence, API to trigger processing and return transcript/results.
- **Out of scope for 2a:** Speaker diarization (use single “default” speaker), embeddings, sentiment labels, vocal or facial processing. Those come in 2b/2c or Phase 4.

---

## 1. Database

- **Utterance model** (align with outline):
  - `id` (UUID), `video_id` (FK to videos), `speaker_id` (str, default `"default"`), `start_ts` (float seconds), `end_ts` (float), `text` (str).
  - Add to `app/models/utterance.py` and register in `init_db`.
- **Video status:** Use existing `status`: `ingested` → `processing` (while running) → `ready` (when transcript is done). Optional: `transcript_failed` if Whisper errors.

---

## 2. Media Extraction

- **Service:** `app/services/extract.py` (or under `app/services/processing/`).
  - **Input:** `video_id`. Resolve video path:
    - **Local:** `get_video_path_local(video_id)` gives a path; support both `.mp4` and `.webm` (try both if needed or store extension in Video metadata).
    - **MinIO:** Download object to a temp file using boto3 `get_object`, then use that path for FFmpeg; delete temp file after processing.
  - **FFmpeg:** Extract audio to a temp WAV file: 16 kHz, mono (e.g. `ffmpeg -i <video> -acodec pcm_s16le -ar 16000 -ac 1 <out.wav>`). Use `subprocess` or `ffmpeg-python`. Temp dir: system temp or configurable `WORK_DIR`.
  - **Output:** Path to the WAV file (for Whisper input).

---

## 3. Whisper Transcription

- **Library:** `openai-whisper` or `faster-whisper` (faster, less memory; good for local/demo). Add to `requirements.txt`.
- **Model:** `base` or `small` for fast iteration; `large-v3` for best quality (heavier). Make model configurable via env (e.g. `WHISPER_MODEL=base`).
- **Input:** Path to 16 kHz mono WAV.
- **Output:** List of segments: `{start, end, text}`. Whisper returns these natively. Map to Utterance rows (video_id, speaker_id="default", start_ts, end_ts, text).
- **Failure:** On exception, set Video status to `transcript_failed` (or keep `ingested`), log error, return partial or error in API.

---

## 4. Processing Orchestration

- **Service:** `app/services/transcribe.py` (or `process_video.py`):
  1. Load Video by id; if status not `ingested` (and not `ready`), optionally reject or re-run.
  2. Set status to `processing`.
  3. Resolve video path (local or download from MinIO to temp).
  4. Extract audio (FFmpeg) to temp WAV.
  5. Run Whisper on WAV.
  6. Persist Utterances (delete existing utterances for this video_id if re-run).
  7. Update Video: `duration_seconds` from Whisper/FFmpeg if available, status `ready`.
  8. Cleanup temp files.
  - Run in async or sync; for MVP, sync is fine (client can poll or wait). Background task (Celery/ARQ) can be added later.

---

## 5. API

- **POST /api/v1/videos/{video_id}/transcribe** (or **POST /api/v1/process/{video_id}**):
  - Triggers the pipeline above.
  - Returns 202 Accepted with `{"video_id": "...", "status": "processing"}` and processes synchronously, then on success return 200 with `{"video_id": "...", "status": "ready", "utterance_count": N}`; or run in background and return 202 immediately (client polls GET /analysis/{video_id}).
- **GET /api/v1/analysis/{video_id}** (or **GET /api/v1/videos/{video_id}/transcript**):
  - Returns transcript for the video: list of `{start_ts, end_ts, text, speaker_id}`. If not yet transcribed, return 404 or 202 with status `ingested`/`processing`.
- **GET /api/v1/videos/{video_id}** (optional):
  - Return video metadata + status; helps client poll until `ready`.

---

## 6. Config and Env

- `WHISPER_MODEL`: e.g. `base`, `small`, `large-v3`.
- `WORK_DIR` (optional): temp directory for WAV and intermediate files; default `./tmp` or system temp.

---

## 7. Dependencies

- `openai-whisper` or `faster-whisper` (and `ctranslate2` if using faster-whisper).
- FFmpeg must be available (already in Dockerfile). No new system deps if using existing image.

---

## 8. Success Criteria

- Ingest a short video (file or URL) → call POST to transcribe → GET returns list of utterances with start_ts, end_ts, text.
- Video status moves from `ingested` to `processing` to `ready`.
- MinIO: when storage is MinIO, pipeline downloads video to temp, runs FFmpeg + Whisper, then deletes temp files.
- Re-running transcribe for the same video replaces existing utterances (idempotent).

---

## 9. Follow-On (Phase 2b)

- Add **vocal** modality: extract audio (reuse FFmpeg), run off-the-shelf emotion model per segment (align segments to Whisper utterances), persist vocal labels. Then implement **two-way divergence** (semantic placeholder + vocal) for MVP 1 timeline.
- Add **Utterance.embedding_id** and embeddings in Phase 4 (RAG).

---

## Order of Implementation

1. Add `Utterance` model and migration/init_db.
2. Implement `extract.py`: resolve path (local + MinIO download), FFmpeg → WAV.
3. Implement Whisper in a small function: WAV → segments.
4. Implement `transcribe.py`: full pipeline, status updates, persist utterances.
5. Add API routes: POST transcribe, GET transcript/analysis.
6. Add config and env; document in README.
7. Manual test: ingest → transcribe → GET transcript.
