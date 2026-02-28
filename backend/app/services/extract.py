"""Extract 16 kHz mono WAV from video for Whisper."""
import subprocess
from pathlib import Path

from app.config import settings


def extract_audio_to_wav(video_path: Path, output_wav_path: Path | None = None) -> Path:
    """
    Run FFmpeg to extract audio as 16 kHz mono WAV.
    video_path: local path to video file.
    output_wav_path: if None, write to work_dir with same stem as video + .wav.
    Returns path to the WAV file.
    """
    if output_wav_path is None:
        work = settings.get_work_path()
        work.mkdir(parents=True, exist_ok=True)
        output_wav_path = work / f"{video_path.stem}.wav"
    output_wav_path = Path(output_wav_path)
    output_wav_path.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(output_wav_path),
        ],
        check=True,
        capture_output=True,
    )
    return output_wav_path


def extract_audio_segment(
    wav_path: Path, start_ts: float, end_ts: float, output_path: Path | None = None
) -> Path:
    """
    Extract a segment [start_ts, end_ts] from a WAV file. Returns path to segment WAV.
    """
    duration = end_ts - start_ts
    if duration <= 0:
        raise ValueError("Segment duration must be positive")
    if output_path is None:
        work = settings.get_work_path()
        work.mkdir(parents=True, exist_ok=True)
        output_path = work / f"seg_{wav_path.stem}_{start_ts:.1f}_{end_ts:.1f}.wav"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(wav_path),
            "-ss",
            str(start_ts),
            "-t",
            str(duration),
            "-acodec",
            "copy",
            str(output_path),
        ],
        check=True,
        capture_output=True,
    )
    return output_path
