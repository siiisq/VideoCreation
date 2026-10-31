#!/usr/bin/env python3
"""Genera la voz en off de un guion con Kokoro (local, Apache-2.0) y escribe las props finales.

Uso: .venv/bin/python scripts/tts.py videos/x.json out/x.props.json
- Cada escena con "voice" obtiene public/voice/<hash>.wav (con caché).
- Si la voz no cabe, la escena se alarga: duración >= retardo + voz + 0,45 s.
"""
import hashlib, json, os, sys
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VOICE_DELAY = 0.3      # igual que VOICE_DELAY en src/Reel.tsx
TAIL = 0.45            # respiro tras la frase
TRANSITION = 0.4       # igual que TRANSITION_SECONDS
DEFAULT_VOICE = {"es": "em_alex", "en": "am_michael"}   # voces masculinas
ESPEAK_LANG = {"es": "es", "en": "en-us"}               # "es" = pronunciación de España (θ en "cerveza")


def trim(a, sr, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(sr * 0.03)); e = min(len(a), idx[-1] + int(sr * 0.08))
    return a[s:e]


def main(src, dst):
    reel = json.load(open(src, encoding="utf-8"))
    lang = reel.get("lang", "es")
    nar = {"speed": 1.1, **reel.get("narrator", {})}
    nar.setdefault("name", DEFAULT_VOICE[lang])
    kokoro = None
    os.makedirs(os.path.join(ROOT, "public", "voice"), exist_ok=True)
    for i, sc in enumerate(reel["scenes"]):
        text = sc.get("voice")
        if not text:
            continue
        key = hashlib.sha1(f"{nar['name']}|{nar['speed']}|{text}".encode()).hexdigest()[:16]
        rel = f"voice/{key}.wav"
        path = os.path.join(ROOT, "public", rel)
        if not os.path.exists(path):
            if kokoro is None:
                from kokoro_onnx import Kokoro
                kokoro = Kokoro(os.path.join(ROOT, "models/kokoro-v1.0.onnx"), os.path.join(ROOT, "models/voices-v1.0.bin"))
            audio, sr = kokoro.create(text, voice=nar["name"], speed=nar["speed"], lang=ESPEAK_LANG[lang])
            sf.write(path, trim(audio, sr), sr)
        info = sf.info(path)
        dur = info.frames / info.samplerate
        sc["voiceFile"] = rel
        sc["voiceDuration"] = round(dur, 3)
        need = round(VOICE_DELAY + dur + TAIL + 0.05, 1)
        if sc["duration"] < need:
            sc["duration"] = need
        print(f"  escena {i + 1}: voz {dur:4.1f}s → escena {sc['duration']}s")
    total = sum(s["duration"] for s in reel["scenes"]) - TRANSITION * (len(reel["scenes"]) - 1)
    print(f"Duración total: {total:.1f} s" + ("  ⚠️  ¡supera 60 s! Acorta el guion." if total > 60 else ""))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    json.dump(reel, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
