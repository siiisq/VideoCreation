#!/usr/bin/env python3
"""Genera efectos de sonido y una base musical sintetizados (sin derechos de autor) en public/sfx y public/music.
Uso: python3 scripts/make_sfx.py"""
import os, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)
root = os.path.join(os.path.dirname(__file__), "..", "public")


def save(path, x, stereo_width=0.0):
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    left = x
    right = np.roll(x, int(SR * 0.0007 * stereo_width)) if stereo_width else x
    data = (np.stack([left, right], axis=1) * 32767).astype(np.int16)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = int(SR * a), int(SR * r)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.exp(-np.linspace(0, 6, nr))
    return e


def bandsweep(noise, f0, f1, q=0.25):
    """Filtro paso banda con barrido de frecuencia (por bloques en FFT)."""
    out = np.zeros_like(noise)
    block = 1024
    win = np.hanning(block * 2)
    for i in range(0, len(noise) - block * 2, block):
        seg = noise[i:i + block * 2] * win
        spec = np.fft.rfft(seg)
        freqs = np.fft.rfftfreq(len(seg), 1 / SR)
        p = i / len(noise)
        fc = f0 * (f1 / f0) ** p
        bw = fc * q * 4
        spec *= np.exp(-0.5 * ((freqs - fc) / bw) ** 2)
        out[i:i + block * 2] += np.fft.irfft(spec)
    return out


# --- SFX -----------------------------------------------------------------
def whoosh(d=0.55):
    n = int(SR * d)
    x = bandsweep(rng.standard_normal(n), 300, 4500)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * shape


def pop():
    tt = t(0.14)
    f = 900 * np.exp(-tt * 28) + 280
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x * np.exp(-tt * 30)


def ding():
    tt = t(1.4)
    x = sum(a * np.sin(2 * np.pi * 1318.5 * m * tt) * np.exp(-tt * dcy) for m, a, dcy in [(1, 1, 3), (2.01, 0.4, 5), (3.02, 0.2, 8), (4.2, 0.1, 12)])
    return x * env(len(tt), 0.002, 0.3)


def click():
    tt = t(0.05)
    return (rng.standard_normal(len(tt)) * 0.4 + np.sin(2 * np.pi * 2200 * tt)) * np.exp(-tt * 120)


def rise(d=1.0):
    n = int(SR * d)
    x = bandsweep(rng.standard_normal(n), 400, 7000, 0.15)
    tt = t(d)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 600 * (tt / d) ** 2) / SR) * 0.3
    return (x + tone) * np.linspace(0, 1, n) ** 2


def boing():
    tt = t(0.45)
    f = 180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)


def sparkle():
    out = np.zeros(int(SR * 0.9))
    for i, f in enumerate([1568, 2093, 2637, 3136, 4186]):
        s = int(SR * i * 0.07)
        tt = t(0.5)
        tone = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 10)
        out[s:s + len(tone)] += tone[: len(out) - s]
    return out


# --- Música: base lo-fi suave a 90 bpm, 64 s -------------------------------
def note_freq(m):
    return 440 * 2 ** ((m - 69) / 12)


def keys(freq, d, vel=0.3):
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * freq * h * tt + 0.3 * np.sin(2 * np.pi * 5 * tt)) for h, a in [(1, 1), (2, 0.35), (3, 0.12), (4, 0.05)])
    return x * vel * env(len(tt), 0.01, min(d * 0.9, 1.2)) * np.exp(-tt * 1.2)


def music(total=64.0, bpm=90):
    beat = 60 / bpm
    out = np.zeros(int(SR * total) + SR)
    chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]  # Cmaj7 Am7 Fmaj7 G7
    bar = beat * 4
    nbars = int(total / bar)
    for b in range(nbars):
        ch = chords[b % 4]
        s = int(SR * b * bar)
        for k, m in enumerate(ch):
            x = keys(note_freq(m), bar * 0.95, 0.18)
            o = s + int(SR * k * 0.012)
            out[o:o + len(x)] += x
        bass = keys(note_freq(ch[0] - 24), bar * 0.9, 0.5)
        out[s:s + len(bass)] += bass
        for q in range(4):  # bombo y hi-hat
            qs = s + int(SR * q * beat)
            tt = t(0.25)
            if q in (0, 2):
                kick = np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 12)
                out[qs:qs + len(kick)] += kick * 0.7
            if q in (1, 3):
                sn = rng.standard_normal(len(tt)) * np.exp(-tt * 25) * 0.18
                out[qs:qs + len(sn)] += sn
            hs = qs + int(SR * beat / 2)
            hh = rng.standard_normal(int(SR * 0.04)) * np.exp(-t(0.04) * 90) * 0.08
            out[hs:hs + len(hh)] += np.diff(hh, prepend=0)
        if b % 2 == 1:  # pequeña melodía
            for i, m in enumerate([ch[3] + 12, ch[2] + 12, ch[1] + 12]):
                x = keys(note_freq(m), beat * 0.9, 0.12)
                o = s + int(SR * (2 + i * 0.5) * beat)
                out[o:o + len(x)] += x
    out = out[: int(SR * total)]
    fade = int(SR * 2)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


if __name__ == "__main__":
    for name, fn in {"whoosh": whoosh, "pop": pop, "ding": ding, "click": click, "rise": rise, "boing": boing, "sparkle": sparkle}.items():
        save(os.path.join(root, "sfx", f"{name}.wav"), fn(), 3)
    save(os.path.join(root, "music", "lofi.wav"), music(), 6)
    print("SFX y música generados en public/sfx y public/music")
