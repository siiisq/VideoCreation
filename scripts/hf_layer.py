#!/usr/bin/env python3
"""Genera una capa de motion graphics de HyperFrames sincronizada con un reel ya con voz.

Uso: python3 scripts/hf_layer.py out/<slug>.props.json   (después de scripts/tts.py)
Crea experiments/hyperframes/layers/<slug>/ (index.html + assets) lista para:
  cd experiments/hyperframes/layers/<slug> && DO_NOT_TRACK=1 npx hyperframes render --format webm --fps 60 -q delivery -o ../../../../public/overlays/<slug>-layer.webm
La capa incluye: subtítulos karaoke de la narración, explosión de partículas en palabras clave,
transición de rejilla en cada corte, destello en el gancho y tarjeta de "Seguir" al final.
"""
import json, os, re, shutil, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRANS, VOICE_DELAY = 0.4, 0.3
TEMPLATE = os.path.join(ROOT, "experiments", "hyperframes", "mockup")


def norm(w):
    return re.sub(r"[^\wáéíóúüñ]", "", w.lower())


def main(props_path):
    reel = json.load(open(props_path, encoding="utf-8"))
    slug = os.path.basename(props_path).replace(".props.json", "")
    scenes = reel["scenes"]
    starts, acc = [], 0.0
    for s in scenes:
        starts.append(round(acc, 3)); acc += s["duration"] - TRANS
    total = round(acc + TRANS, 3)
    theme = {"bg1": "#16081f", "accent": "#ffc23d", "accent2": "#9be15d", "text": "#fff7ec", **reel.get("theme", {})}

    chunks, bursts = [], []
    for i, s in enumerate(scenes):
        text, dur = (s.get("voice") or "").strip(), s.get("voiceDuration")
        if not text or not dur:
            continue
        t0 = starts[i] + VOICE_DELAY
        words = text.split()
        total_chars = sum(len(w) + 1 for w in words)
        # tiempo de cada palabra proporcional a sus caracteres (sin Whisper)
        times, c = [], 0
        for w in words:
            times.append(round(t0 + dur * c / total_chars, 3)); c += len(w) + 1
        ends = times[1:] + [round(t0 + dur, 3)]
        # trozos de hasta 4 palabras, cortando en puntuación
        cur = []
        for k, w in enumerate(words):
            cur.append(k)
            if len(cur) >= 4 or re.search(r"[.,:;!?]$", w) or k == len(words) - 1:
                chunks.append({"words": [words[j] for j in cur], "t": [times[j] for j in cur], "end": ends[cur[-1]],
                               "high": i == len(scenes) - 1})  # en el cierre, por encima de la tarjeta de seguir
                cur = []
        # partículas en las palabras destacadas de la escena
        keys = {norm(h) for h in s.get("highlight", []) if len(norm(h)) > 2}
        for k, w in enumerate(words):
            if norm(w) in keys:
                bursts.append(times[k]); keys.discard(norm(w))

    data = {"total": total, "cuts": starts[1:], "chunks": chunks, "bursts": bursts,
            "outro": starts[-1], "theme": theme, "flash": 0.62}

    out = os.path.join(ROOT, "experiments", "hyperframes", "layers", slug)
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(os.path.join(out, "compositions"))
    shutil.copytree(os.path.join(TEMPLATE, "assets"), os.path.join(out, "assets"), ignore=shutil.ignore_patterns("lofi.mp3", "*.jpg"))
    shutil.copy(os.path.join(TEMPLATE, "compositions", "instagram-follow.html"), os.path.join(out, "compositions"))
    for f in ("hyperframes.json", "meta.json", "package.json"):
        shutil.copy(os.path.join(TEMPLATE, f), out)
    nm = os.path.join(out, "node_modules")
    if not os.path.exists(nm):
        os.symlink(os.path.join(ROOT, "experiments", "hyperframes", "hook-test", "node_modules"), nm)
    T = theme
    html = f"""<!doctype html>
<html lang="es" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/gsap.min.js"></script>
<style>
  @font-face {{ font-family: "Montserrat"; src: url("assets/fonts/montserrat-latin.woff2") format("woff2"); font-weight: 700 900; unicode-range: U+0000-00FF, U+2000-206F; }}
  @font-face {{ font-family: "Montserrat"; src: url("assets/fonts/montserrat-latin-ext.woff2") format("woff2"); font-weight: 700 900; unicode-range: U+0100-024F; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: transparent; }}
  #root[data-composition-id="layer"] {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Montserrat", sans-serif; }}
  .cap {{ position: absolute; left: 70px; right: 70px; top: 1450px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 14px; opacity: 0; }}
  .cap span {{ font-weight: 900; font-size: 62px; line-height: 1.15; text-transform: uppercase; padding: 4px 20px; border-radius: 40px; color: {T['text']};
              text-shadow: 0 4px 18px rgba(0,0,0,.55); background: rgba(0,0,0,0); opacity: 0; }}
  .cap.high {{ top: 1230px; }}
  .p {{ position: absolute; left: 540px; top: 1420px; border-radius: 50%; opacity: 0; }}
  .grid {{ position: absolute; inset: 0; display: grid; grid-template-columns: repeat(9, 1fr); grid-template-rows: repeat(16, 1fr); }}
  .grid div {{ transform: scale(0); }}
  .flash {{ position: absolute; inset: 0; background: #fff; opacity: 0; }}
</style>
</head>
<body>
<div id="root" data-composition-id="layer" data-start="0" data-duration="{total}" data-width="1080" data-height="1920" data-fps="60">
  <div id="caps"></div>
  <div id="parts"></div>
  <div class="grid" id="grid"></div>
  <div class="flash" id="flash"></div>
  <div id="follow" data-composition-id="instagram-follow" data-composition-src="compositions/instagram-follow.html" data-start="{round(data['outro'] + 0.6, 3)}" data-duration="{round(total - data['outro'] - 0.6, 3)}" data-track-index="5" data-width="1080" data-height="1920" style="position:absolute;inset:0"></div>
</div>
<script>
  const D = {json.dumps(data, ensure_ascii=False)};
  const tl = gsap.timeline({{ paused: true }});
  const A = D.theme.accent, A2 = D.theme.accent2, BG = D.theme.bg1;
  // destello del gancho
  tl.fromTo("#flash", {{ opacity: 0 }}, {{ opacity: 0.8, duration: 0.05 }}, D.flash).to("#flash", {{ opacity: 0, duration: 0.35 }}, D.flash + 0.05);
  // subtítulos karaoke
  const caps = document.getElementById("caps");
  D.chunks.forEach((c, ci) => {{
    const box = document.createElement("div"); box.className = c.high ? "cap high" : "cap";
    c.words.forEach((w) => {{ const s = document.createElement("span"); s.textContent = w; box.appendChild(s); }});
    caps.appendChild(box);
    const spans = box.querySelectorAll("span");
    tl.set(box, {{ opacity: 1 }}, c.t[0] - 0.02);
    spans.forEach((s, k) => {{
      tl.fromTo(s, {{ opacity: 0, y: 30, scale: 0.8 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "back.out(2.4)", immediateRender: false }}, c.t[k] - 0.02);
      tl.to(s, {{ backgroundColor: A, color: BG, textShadow: "none", duration: 0.08 }}, c.t[k]);
      const off = k < c.t.length - 1 ? c.t[k + 1] : c.end;
      tl.to(s, {{ backgroundColor: "rgba(0,0,0,0.35)", color: D.theme.text, duration: 0.1 }}, off);
    }});
    tl.to(box, {{ opacity: 0, y: -16, duration: 0.07 }}, c.end - 0.09);
    tl.set(box, {{ y: 0 }}, c.end + 0.2);
  }});
  // explosiones de partículas en palabras clave
  const parts = document.getElementById("parts"), cols = [A, A2, "#c06bff", "#ffffff"];
  D.bursts.forEach((t0, b) => {{
    for (let i = 0; i < 30; i++) {{
      const p = document.createElement("div"); p.className = "p"; p.style.top = "1500px"; const s = 9 + ((i * 7 + b * 3) % 20);
      p.style.width = p.style.height = s + "px"; p.style.background = cols[i % 4]; parts.appendChild(p);
      const a = (i / 30) * Math.PI * 2, d = 180 + ((i * 53 + b * 31) % 260);
      tl.fromTo(p, {{ x: 0, y: 0, opacity: 1, scale: 1 }}, {{ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8 - 60, opacity: 0, scale: 0.3, duration: 0.9, ease: "power3.out", immediateRender: false }}, t0);
    }}
  }});
  // transición de rejilla en cada corte (tapa el cambio de escena)
  const grid = document.getElementById("grid");
  for (let i = 0; i < 144; i++) {{ const d = document.createElement("div"); d.style.background = i % 2 ? A : A2; grid.appendChild(d); }}
  const froms = ["center", "edges", "start", "end", "random"];
  D.cuts.forEach((t0, i) => {{
    tl.to("#grid div", {{ scale: 1.03, duration: 0.22, ease: "power2.in", stagger: {{ each: 0.0018, from: froms[i % 5], grid: [16, 9] }} }}, t0 - 0.3);
    tl.to("#grid div", {{ scale: 0, duration: 0.25, ease: "power2.out", stagger: {{ each: 0.0018, from: froms[(i + 1) % 5], grid: [16, 9] }} }}, t0 + 0.12);
  }});
  window.__timelines["layer"] = tl;
  tl.seek(0);
</script>
</body>
</html>
"""
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)
    print(f"Capa lista en {os.path.relpath(out, ROOT)}  ·  {len(chunks)} subtítulos, {len(bursts)} explosiones, {len(starts) - 1} cortes, {total}s")


if __name__ == "__main__":
    main(sys.argv[1])
