"""Proveedores de voz para scripts/tts.py. Todos devuelven (audio float32 mono, sample_rate).

Elección automática (narrator.provider = "auto"):
  GOOGLE_TTS_API_KEY  → Google Cloud Text-to-Speech, voces Chirp 3 HD (es-ES nativo de España). Recomendado.
  GEMINI_API_KEY      → Gemini TTS (muy natural; el acento se pide en la instrucción de estilo).
  ELEVENLABS_API_KEY  → ElevenLabs (requiere permitir api.elevenlabs.io en la red del entorno).
  (ninguna)           → Kokoro local (calidad baja, solo como reserva).
"""
import base64, io, json, os, urllib.request
import numpy as np

DEFAULTS = {
    "google": {"es": "es-ES-Chirp3-HD-Charon", "en": "en-US-Chirp3-HD-Charon"},
    "gemini": {"es": "Charon", "en": "Charon"},
    "elevenlabs": {"es": "", "en": ""},  # pon el voice_id en narrator.name
    "kokoro": {"es": "em_alex", "en": "am_michael"},
}

GEMINI_STYLE = {
    "es": "Lee el siguiente texto en español de España (acento peninsular, de Madrid), con voz masculina natural, "
          "cercana y con energía, como un divulgador de redes sociales. Lee solo el texto, sin añadir nada:\n\n",
    "en": "Read the following text in a natural, warm and energetic male voice, like a social media science "
          "communicator. Read only the text, adding nothing:\n\n",
}


def pick_provider(requested):
    if requested and requested != "auto":
        return requested
    for env, name in [("GOOGLE_TTS_API_KEY", "google"), ("GEMINI_API_KEY", "gemini"), ("ELEVENLABS_API_KEY", "elevenlabs")]:
        if os.environ.get(env):
            return name
    return "kokoro"


def _post(url, body, headers, tries=8):
    """POST con reintentos: los planes gratuitos limitan peticiones por minuto (HTTP 429)."""
    import time, urllib.error
    for attempt in range(tries):
        req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 503) or attempt == tries - 1:
                raise
            wait = 20
            try:
                for d in json.loads(e.read()).get("error", {}).get("details", []):
                    if "retryDelay" in d:
                        wait = float(d["retryDelay"].rstrip("s")) + 2
            except Exception:
                pass
            print(f"    límite de la API ({e.code}); reintento en {wait:.0f}s…")
            time.sleep(wait)


def _pcm16(raw, sr):
    return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0, sr


def google(text, voice, lang, speed):
    body = {
        "input": {"text": text},
        "voice": {"languageCode": voice[:5], "name": voice},
        "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000, "speakingRate": speed},
    }
    out = json.loads(_post("https://texttospeech.googleapis.com/v1/text:synthesize", body, {"X-Goog-Api-Key": os.environ["GOOGLE_TTS_API_KEY"]}))
    wav = base64.b64decode(out["audioContent"])
    import soundfile as sf
    a, sr = sf.read(io.BytesIO(wav), dtype="float32")
    return a, sr


def gemini(text, voice, lang, speed, model=None):
    model = model or os.environ.get("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
    pace = "" if abs(speed - 1) < 0.03 else (" Habla un poco más rápido de lo normal." if lang == "es" else " Speak slightly faster than usual.") if speed > 1 else ""
    body = {
        "contents": [{"parts": [{"text": GEMINI_STYLE[lang].replace(":\n\n", pace + ":\n\n") + text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    out = json.loads(_post(url, body, {"x-goog-api-key": os.environ["GEMINI_API_KEY"]}))
    part = out["candidates"][0]["content"]["parts"][0]["inlineData"]
    return _pcm16(base64.b64decode(part["data"]), 24000)


def elevenlabs(text, voice, lang, speed):
    if not voice:
        raise SystemExit("ElevenLabs: indica el voice_id en narrator.name")
    body = {"text": text, "model_id": os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2"), "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "speed": speed}}
    raw = _post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=pcm_24000", body, {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]})
    return _pcm16(raw, 24000)


_kokoro = None


def kokoro(text, voice, lang, speed, root="."):
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(root, "models/kokoro-v1.0.onnx"), os.path.join(root, "models/voices-v1.0.bin"))
    return _kokoro.create(text, voice=voice, speed=speed, lang={"es": "es", "en": "en-us"}[lang])


def synth(provider, text, voice, lang, speed, root):
    if provider == "kokoro":
        return kokoro(text, voice, lang, speed, root)
    return {"google": google, "gemini": gemini, "elevenlabs": elevenlabs}[provider](text, voice, lang, speed)
