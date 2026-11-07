#!/usr/bin/env python3
"""Validador de reels: revisa audio, sincronía voz ↔ animaciones y prepara fotogramas para revisar dibujos.

Uso:  python3 scripts/review.py <carpeta-o-mp4> [--props out/x.props.json] [--words out/x.words.json]
      (si se pasa una carpeta, busca dentro <slug>.movil.mp4|<slug>.mp4, <slug>.props.json y <slug>.words.json)
Salida en out/review/<slug>/:
  - report.md         informe: duración, volumen, picos, silencios, voz por escena, atWords estimado vs real
  - scene-XX.png      hoja por escena: inicio, cada aparición sincronizada (data.at + 0,5 s) y final
  - cuts.png          fundidos/cortes (−0,2 / 0 / +0,2 s alrededor de cada corte)
El paquete de revisión lo genera la sesión que renderiza (ver docs/validacion.md).
"""
import argparse, glob, json, os, re, subprocess, sys, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRANSITION, VOICE_DELAY = 0.4, 0.3   # iguales que scripts/tts.py
SYNC_TOL = 0.35                      # s de desfase máximo palabra ↔ aparición


def sh(args):
    return subprocess.run(args, capture_output=True, text=True)


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9ñ ]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


def find(folder, pats):
    for p in pats:
        g = sorted(glob.glob(os.path.join(folder, p)))
        if g:
            return g[0]
    return None


def frame(mp4, t, dst):
    sh(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t):.3f}", "-i", mp4, "-frames:v", "1",
        "-vf", "scale=360:-2", dst])
    return dst


def sheet(items, dst):
    from PIL import Image, ImageDraw
    ims = [(Image.open(p).convert("RGB"), lab) for p, lab in items if os.path.exists(p)]
    if not ims:
        return
    w, h = ims[0][0].size
    out = Image.new("RGB", (w * len(ims), h + 34), (20, 20, 20))
    d = ImageDraw.Draw(out)
    for k, (im, lab) in enumerate(ims):
        out.paste(im, (k * w, 34))
        d.text((k * w + 6, 10), lab[:48], fill=(255, 220, 90))
    out.save(dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("--props"); ap.add_argument("--words")
    a = ap.parse_args()
    folder = a.src if os.path.isdir(a.src) else os.path.dirname(a.src) or "."
    mp4 = a.src if a.src.endswith(".mp4") else find(folder, ["*.movil.mp4", "*.mp4"])
    if not mp4:
        sys.exit("No encuentro el MP4")
    slug = os.path.basename(mp4).split(".")[0]
    props = a.props or find(folder, [f"{slug}.props.json", f"{slug}.combined.json", "*.props.json"])
    words_f = a.words or find(folder, [f"{slug}.words.json", "*.words.json"])
    out = os.path.join(ROOT, "out", "review", slug)
    os.makedirs(out, exist_ok=True)
    R, issues = [], []

    # ── Vídeo y audio ────────────────────────────────────────────────
    pr = json.loads(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate,sample_rate,channels",
                        "-of", "json", mp4]).stdout)
    dur = float(pr["format"]["duration"])
    vs = next((s for s in pr["streams"] if s["codec_type"] == "video"), {})
    au = next((s for s in pr["streams"] if s["codec_type"] == "audio"), None)
    R.append(f"# Revisión de `{slug}`\n\n## Formato\n- {vs.get('width')}x{vs.get('height')} @ {vs.get('r_frame_rate')} · {dur:.1f} s")
    if (vs.get("width"), vs.get("height")) != (1080, 1920):
        issues.append(f"Resolución {vs.get('width')}x{vs.get('height')} (esperado 1080x1920)")
    if not au:
        issues.append("SIN pista de audio")
    else:
        R.append(f"- audio {au.get('sample_rate')} Hz, {au.get('channels')} canales")
        if au.get("sample_rate") != "44100":
            issues.append(f"Audio a {au.get('sample_rate')} Hz (la copia móvil debe ir a 44100)")
        e = sh(["ffmpeg", "-i", mp4, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"]).stderr
        I = re.findall(r"I:\s+(-?[\d.]+) LUFS", e); TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)
        lufs = float(I[-1]) if I else None; peak = float(TP[-1]) if TP else None
        R.append(f"- volumen integrado {lufs} LUFS (objetivo −14) · pico real {peak} dBFS")
        if lufs is not None and abs(lufs + 14) > 1.5:
            issues.append(f"Volumen {lufs} LUFS (fuera de −14 ± 1,5)")
        if peak is not None and peak > -0.5:
            issues.append(f"Pico real {peak} dBFS: posible saturación/clipping")
        sil = sh(["ffmpeg", "-i", mp4, "-af", "silencedetect=n=-45dB:d=0.9", "-vn", "-f", "null", "-"]).stderr
        gaps = [(float(s), float(d)) for s, d in re.findall(r"silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)", sil)]
        if gaps:
            R.append("- silencios > 0,9 s: " + ", ".join(f"{s:.1f}s ({d:.1f}s)" for s, d in gaps))
            issues += [f"Silencio de {d:.1f} s en {s:.1f} s" for s, d in gaps if s > 0.5 and s + d < dur - 0.5]

    # ── Escenas ─────────────────────────────────────────────────────
    scenes = []
    if props:
        P = json.load(open(props, encoding="utf-8"))
        t = 0.0
        for i, sc in enumerate(P.get("scenes", [])):
            scenes.append({**sc, "_i": i, "_start": t})
            t += sc.get("duration", 5) - TRANSITION
        expected = t + TRANSITION
        R.append(f"- duración del guion {expected:.1f} s vs MP4 {dur:.1f} s")
        if abs(expected - dur) > 0.6:
            issues.append(f"Duración del MP4 ({dur:.1f}s) ≠ guion ({expected:.1f}s): ¿props desactualizado?")
    else:
        issues.append("Falta props.json: no puedo comprobar la sincronía por escena")

    words = json.load(open(words_f, encoding="utf-8")) if words_f else None
    R.append(f"\n## Sincronía voz ↔ animaciones {'(Whisper)' if words else '(SIN Whisper: solo estimación por caracteres)'}")
    if not words:
        issues.append("Sin words.json de Whisper: los atWords no se han comprobado contra la voz real")

    for sc in scenes:
        i, st, d = sc["_i"], sc["_start"], sc.get("duration", 5)
        vd = sc.get("voiceDuration")
        R.append(f"\n### Escena {i + 1} · {sc.get('type')}{' / plano ' + str(sc.get('shot')) if 'shot' in sc else ''} · {st:.1f}–{st + d:.1f} s")
        if sc.get("voice"):
            R.append(f"> {sc['voice']}")
        if vd and VOICE_DELAY + vd > d - TRANSITION + 0.05:
            issues.append(f"Escena {i + 1}: la voz ({vd:.1f}s) invade el fundido de salida")
        data = sc.get("data") if isinstance(sc.get("data"), dict) else {}
        aw, at = data.get("atWords") or [], data.get("at") or []
        shots = [(st + 0.15, "inicio")]
        for k, w in enumerate(aw):
            est = st + at[k] if k < len(at) else None
            real = None
            if words:
                lo, hi = st + VOICE_DELAY - 0.3, st + d
                cand = [x for x in words if lo <= x["start"] <= hi and norm(w).split()[0] in norm(x["word"])]
                real = cand[0]["start"] if cand else None
            line = f"- `{w}`: aparición {est - st if est else '?':.2f}s" if est else f"- `{w}`: sin `at`"
            if real is not None and est is not None:
                diff = est - real
                ok = abs(diff) <= SYNC_TOL
                line += f" · voz real {real - st:.2f}s · desfase {diff:+.2f}s {'✓' if ok else '⚠️'}"
                if not ok:
                    issues.append(f"Escena {i + 1}: '{w}' aparece {abs(diff):.2f}s {'tarde' if diff > 0 else 'antes'} respecto a la voz")
            elif words:
                line += " · ⚠️ no encuentro la palabra en la voz"
                issues.append(f"Escena {i + 1}: la voz no dice '{w}' (o Whisper no la entiende)")
            R.append(line)
            if est is not None:
                shots.append((est + 0.5, f"{w} +0.5s"))
        shots.append((st + d - TRANSITION - 0.15, "final"))
        imgs = [(frame(mp4, tt, os.path.join(out, f"s{i + 1:02d}_{k}.png")), f"{lab} @{tt:.1f}s") for k, (tt, lab) in enumerate(shots)]
        sheet(imgs, os.path.join(out, f"scene-{i + 1:02d}.png"))

    cuts = []
    for sc in scenes[1:]:
        c = sc["_start"] + TRANSITION / 2
        for off in (-0.2, 0, 0.2):
            cuts.append((frame(mp4, c + off, os.path.join(out, f"cut{sc['_i']:02d}_{off:+.1f}.png")), f"corte {sc['_i']} {off:+.1f}s"))
    if cuts:
        sheet(cuts[:24], os.path.join(out, "cuts.png"))

    R.append("\n## Problemas automáticos\n" + ("\n".join(f"- ⚠️ {x}" for x in issues) if issues else "- ninguno"))
    R.append("\n## Revisión visual pendiente (manual)\nTextos dentro de sus recuadros/tiles, nada pisa los subtítulos (y < 430 px), "
             "contenido entre 450 y 1600 px, recuadros del plano anterior retirados, dibujos con volumen y sin formas toscas, "
             "hoja de compartir solo al final.")
    open(os.path.join(out, "report.md"), "w", encoding="utf-8").write("\n".join(R) + "\n")
    print("\n".join(R))
    print(f"\n→ {out}")


if __name__ == "__main__":
    main()
