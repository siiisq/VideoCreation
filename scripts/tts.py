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
    nar = {"speed": 1.05 if "slides" in reel else 1.1, **reel.get("narrator", {})}
    nar.setdefault("name", DEFAULT_VOICE[lang])
    kokoro = None
    os.makedirs(os.path.join(ROOT, "public", "voice"), exist_ok=True)
    is_pres = "slides" in reel
    items = ([reel["intro"]] if reel.get("intro") else []) + reel["slides"] + ([reel["outro"]] if reel.get("outro") else []) if is_pres else reel["scenes"]
    trans = 0.5 if is_pres else TRANSITION
    for i, sc in enumerate(items):
        sc.setdefault("duration", 4 if is_pres else 5)
        text = (sc.get("voice") or "").strip()
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
        need = round(VOICE_DELAY + dur + TAIL + (trans if is_pres else 0.05), 1)
        if sc["duration"] < need:
            sc["duration"] = need
        # "word": "agua" en highlights/focus → "at" = momento aproximado en que la voz dice esa palabra
        def word_time(word):
            pos = text.lower().find(word.lower())
            if pos < 0:
                print(f"    ⚠️  palabra '{word}' no está en la narración")
                return None
            return round(VOICE_DELAY + dur * pos / max(1, len(text)), 2)
        for h in sc.get("highlights", []) or []:
            if h.get("word") and word_time(h["word"]) is not None:
                h["at"] = word_time(h["word"])
        f = sc.get("focus")
        if f:
            if f.get("word") and word_time(f["word"]) is not None:
                f["at"] = max(0.4, word_time(f["word"]) - 0.4)
            if f.get("untilWord") and word_time(f["untilWord"]) is not None:
                f["until"] = word_time(f["untilWord"])
        print(f"  {'parte' if is_pres else 'escena'} {i + 1}: voz {dur:4.1f}s → {sc['duration']}s")
    total = sum(s["duration"] for s in items) - trans * (len(items) - 1)
    m, sec = divmod(total, 60)
    print(f"Duración total: {int(m)}:{sec:04.1f}" + ("  ⚠️  ¡supera 60 s! Acorta el guion." if total > 60 and not is_pres else ""))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    json.dump(reel, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
