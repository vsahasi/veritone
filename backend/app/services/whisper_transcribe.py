"""Whisper transcription via faster-whisper: WAV -> list of segments {start, end, text}."""
from pathlib import Path
from typing import Any

from app.config import settings


def transcribe_audio(wav_path: Path) -> list[dict[str, Any]]:
    """
    Run faster-whisper on a 16 kHz mono WAV file.
    Returns list of {"start": float, "end": float, "text": str}.
    """
    from faster_whisper import WhisperModel

    model = WhisperModel(
        settings.whisper_model,
        device="cpu",
        compute_type="int8",
    )
    segments_iter, _ = model.transcribe(str(wav_path), beam_size=1)
    segments = []
    for seg in segments_iter:
        start = float(seg.start)
        end = float(seg.end)
        text = (seg.text or "").strip()
        if text:
            segments.append({"start": start, "end": end, "text": text})
    return segments
