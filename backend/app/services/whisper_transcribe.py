"""Whisper transcription: WAV -> list of segments {start, end, text}."""
from pathlib import Path
from typing import Any

from app.config import settings


def transcribe_audio(wav_path: Path) -> list[dict[str, Any]]:
    """
    Run Whisper on a 16 kHz mono WAV file.
    Returns list of {"start": float, "end": float, "text": str}.
    """
    import whisper

    model = whisper.load_model(settings.whisper_model, device="cpu")
    result = model.transcribe(str(wav_path), fp16=False)
    segments = []
    for seg in result.get("segments", []):
        start = float(seg["start"])
        end = float(seg["end"])
        text = (seg.get("text") or "").strip()
        if text:
            segments.append({"start": start, "end": end, "text": text})
    return segments
