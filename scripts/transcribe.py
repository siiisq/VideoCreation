#!/usr/bin/env python3
"""Transcribe un audio con Whisper (faster-whisper) y devuelve tiempos por palabra.

Uso: .venv/bin/python -I scripts/transcribe.py audio.wav [--lang es] [--model small]  → JSON en stdout
Usos en el proyecto:
  - sincronizar con precisión `atWords`, `highlights.word` y subtítulos (en vez de estimar por caracteres)
  - control de calidad: comparar lo que dice la voz con el guion
Requiere descargar el modelo la primera vez (huggingface.co debe estar permitido en la red del entorno).
"""
import argparse, json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def words(path, lang="es", model="small"):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8", download_root=os.path.join(ROOT, "models", "whisper"))
    segs, _ = m.transcribe(path, language=lang, word_timestamps=True, vad_filter=False)
    return [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for s in segs for w in (s.words or [])]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("audio"); ap.add_argument("--lang", default="es"); ap.add_argument("--model", default="small")
    a = ap.parse_args()
    try:
        print(json.dumps(words(a.audio, a.lang, a.model), ensure_ascii=False))
    except Exception as e:  # sin red para descargar el modelo, etc.
        sys.exit(f"Whisper no disponible: {e}")
