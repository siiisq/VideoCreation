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

    # título animado del gancho (escena 0): arriba (letras que explotan), principal (cae de golpe), abajo (rotulador)
    hook = None
    s0 = scenes[0]
    title = (s0.get("title") or s0.get("text") or "").strip()
    if title:
        ht = s0.get("hookTitle") or {}
        ws = title.split()
        hl = {norm(h) for h in s0.get("highlight", [])}
        idx = [k for k, w in enumerate(ws) if norm(w) in hl]
        if ht.get("main"):
            top, main, bottom = ht.get("top", ""), ht["main"], ht.get("bottom", "")
        elif idx:
            a, b = idx[0], idx[-1]
            top, main, bottom = " ".join(ws[:a]), " ".join(ws[a:b + 1]), " ".join(ws[b + 1:])
        else:
            n = len(ws)
            top, main, bottom = " ".join(ws[: n // 3]), " ".join(ws[n // 3: 2 * n // 3]), " ".join(ws[2 * n // 3:])
        emph = ht.get("emphasis") or (re.sub(r"[^\wÁÉÍÓÚÜÑáéíóúüñ]", "", bottom.split()[-1]) if bottom else "")
        hook = {"top": top.upper(), "main": main.upper(), "bottom": bottom.upper(), "emphasis": emph.upper(),
                "size": round(min(17.0, 130.0 / max(1, len(main))), 2), "accentIndex": max(0, len(main.split()) - 1),
                "dur": round(starts[1] + 0.15 if len(starts) > 1 else s0["duration"], 2)}  # acaba bajo la rejilla del primer corte

    data = {"total": total, "cuts": starts[1:], "gridCuts": starts[1:] if reel.get("transitionStyle", "grid") == "grid" else [], "chunks": chunks, "bursts": bursts,
            "outro": starts[-1], "theme": theme, "flash": 0.62, "hook": hook, "trans": TRANS}

    out = os.path.join(ROOT, "experiments", "hyperframes", "layers", slug)
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(os.path.join(out, "compositions"))
    shutil.copytree(os.path.join(TEMPLATE, "assets"), os.path.join(out, "assets"), ignore=shutil.ignore_patterns("lofi.mp3", "*.jpg"))
    shutil.copy(os.path.join(TEMPLATE, "compositions", "instagram-follow.html"), os.path.join(out, "compositions"))
    if hook:
        os.makedirs(os.path.join(out, "compositions", "components"))
        for comp in ("char-slam-explode", "headline-slam", "marker-highlight"):
            src = open(os.path.join(TEMPLATE, "compositions", "components", comp + ".html"), encoding="utf-8").read()
            # los componentes traen una duración interna fija: la igualamos a la del gancho (si no, el título desaparece)
            d = str(hook["dur"])
            src = re.sub(r'data-composition-duration="[\d.]+"', f'data-composition-duration="{d}"', src)
            src = re.sub(r'data-duration="[\d.]+"', f'data-duration="{d}"', src)
            src = re.sub(r'root\.dataset\.duration \|\| "[\d.]+"', f'root.dataset.duration || "{d}"', src)
            open(os.path.join(out, "compositions", "components", comp + ".html"), "w", encoding="utf-8").write(src)
    for f in ("hyperframes.json", "meta.json", "package.json"):
        shutil.copy(os.path.join(TEMPLATE, f), out)
    nm = os.path.join(out, "node_modules")
    if not os.path.exists(nm):
        os.symlink(os.path.join(ROOT, "experiments", "hyperframes", "node_modules"), nm)
    T = theme
    hook_html = ""
    if hook:
        def vv(o):
            return json.dumps(o, ensure_ascii=False).replace("'", "&#39;")
        d = hook["dur"]
        if hook["top"]:
            hook_html += f"""  <div class="slot" id="hook-top" style="top:200px;height:400px" data-composition-id="hk1" data-composition-src="compositions/components/char-slam-explode.html" data-start="0" data-duration="{d}" data-track-index="1" data-variable-values='{vv({"text": hook["top"], "accent": "violet", "spread": "wild"})}'></div>\n"""
        hook_html += f"""  <div class="slot" id="hook-main" style="top:350px;height:380px;--hs-font-size:{hook['size']}cqw" data-composition-id="hk2" data-composition-src="compositions/components/headline-slam.html" data-start="0.55" data-duration="{round(d - 0.55, 2)}" data-track-index="2" data-variable-values='{vv({"text": hook["main"], "accent_word_index": hook["accentIndex"], "accent": "blue"})}'></div>\n"""
        if hook["bottom"]:
            hook_html += f"""  <div class="slot" id="hook-bottom" style="top:420px;height:560px" data-composition-id="hk3" data-composition-src="compositions/components/marker-highlight.html" data-start="1.1" data-duration="{round(d - 1.1, 2)}" data-track-index="3" data-variable-values='{vv({"text": hook["bottom"], "emphasis_word": hook["emphasis"], "style": "circle", "draw_at": 0.7, "accent": "violet"})}'></div>\n"""
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
  #root {{ --fg: {T['text']}; --bg: transparent; --accent: {T['accent']}; --accent-2: {T['accent2']}; --font-display: "Montserrat", sans-serif; }}
  .slot {{ position: absolute; left: 0; width: 1080px; }}
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
{hook_html}
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
  // La rejilla debe tapar TODO el fundido de Remotion (de t0 a t0 + TRANS): si se retira antes, se ven
  // superpuestos el título/dibujo de la escena anterior y los de la nueva. Entrada: 0,22 s + 0,26 s de escalonado.
  D.gridCuts.forEach((t0, i) => {{
    tl.to("#grid div", {{ scale: 1.03, duration: 0.22, ease: "power2.in", stagger: {{ each: 0.0018, from: froms[i % 5], grid: [16, 9] }} }}, t0 - 0.52);
    tl.to("#grid div", {{ scale: 0, duration: 0.25, ease: "power2.out", stagger: {{ each: 0.0018, from: froms[(i + 1) % 5], grid: [16, 9] }} }}, t0 + D.trans + 0.03);
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
