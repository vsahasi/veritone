"""Vocal emotion classification per audio segment (SpeechBrain or fallback)."""
from pathlib import Path

_emotion_classifier = None


def _get_classifier():
    global _emotion_classifier
    if _emotion_classifier is None:
        from speechbrain.inference.interfaces import foreign_class

        _emotion_classifier = foreign_class(
            source="speechbrain/emotion-recognition-wav2vec2-IEMOCAP",
            pymodule_file="custom_interface.py",
            classname="CustomEncoderWav2vec2Classifier",
        )
    return _emotion_classifier


def classify_emotion(wav_path: Path) -> tuple[str, float]:
    """
    Run emotion recognition on a WAV file (16 kHz mono preferred).
    Returns (label, confidence) e.g. ("angry", 0.85).
    Labels follow IEMOCAP: neutral, calm, happy, sad, angry, fearful, disgust, surprised.
    """
    try:
        classifier = _get_classifier()
        out_prob, score, index, text_lab = classifier.classify_file(str(wav_path))
        label = text_lab[0] if isinstance(text_lab, (list, tuple)) else str(text_lab)
        conf = float(score[0]) if score is not None else 0.0
        return (label, conf)
    except Exception:
        # Fallback if SpeechBrain not available or fails (e.g. very short segment)
        return ("neutral", 0.0)
