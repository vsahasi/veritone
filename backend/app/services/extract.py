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
