#!/usr/bin/env python3
"""Importa una presentación (PPTX/PPT/KEY/ODP/PDF) para convertirla en vídeo.

Uso: .venv/bin/python scripts/import_presentation.py presentations/mi-charla.pptx [--lang es|en] [--format landscape|vertical|square]

Crea:
  public/slides/<slug>/slide-01.png ...   imágenes de cada diapositiva (1920 px de ancho)
  videos/<slug>.slides.json              guion con texto y notas de cada diapositiva, listo para que
                                         Claude escriba la narración ("voice") de cada una.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "presentacion"


def to_pdf(src, tmp):
    if src.lower().endswith(".pdf"):
        return src
    r = subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, src], capture_output=True, text=True, timeout=600)
    pdf = os.path.join(tmp, os.path.splitext(os.path.basename(src))[0] + ".pdf")
    if not os.path.exists(pdf):
        sys.exit(f"No se pudo convertir a PDF con LibreOffice:\n{r.stdout}\n{r.stderr}")
    return pdf


def pptx_notes(src):
    """Notas del orador por diapositiva (solo PPTX)."""
    if not src.lower().endswith(".pptx"):
        return {}
    try:
        from pptx import Presentation
    except ImportError:
        return {}
    notes = {}
    for i, slide in enumerate(Presentation(src).slides, 1):
        if slide.has_notes_slide:
            t = slide.notes_slide.notes_text_frame.text.strip() if slide.notes_slide.notes_text_frame else ""
            if t:
                notes[i] = t
    return notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--slug")
    ap.add_argument("--lang", default="es", choices=["es", "en"])
    ap.add_argument("--format", default="landscape", choices=["landscape", "vertical", "square"])
    a = ap.parse_args()

    src = os.path.abspath(a.file)
    slug = a.slug or slugify(os.path.splitext(os.path.basename(src))[0])
    out_img = os.path.join(ROOT, "public", "slides", slug)
    shutil.rmtree(out_img, ignore_errors=True)
    os.makedirs(out_img)

    with tempfile.TemporaryDirectory() as tmp:
        pdf = to_pdf(src, tmp)
        pages = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout).group(1))
        # 1920 px de ancho, PNG nítido
        subprocess.run(["pdftoppm", "-png", "-scale-to-x", "1920", "-scale-to-y", "-1", pdf, os.path.join(out_img, "slide")], check=True)
        # pdftoppm numera slide-1 o slide-01 según el total; normalizamos a slide-01
        for f in os.listdir(out_img):
            m = re.match(r"slide-(\d+)\.png", f)
            if m:
                os.rename(os.path.join(out_img, f), os.path.join(out_img, f"slide-{int(m.group(1)):02d}.png"))
        texts = []
        for p in range(1, pages + 1):
            t = subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), pdf, "-"], capture_output=True, text=True).stdout
            texts.append(re.sub(r"[ \t]+", " ", t).strip())
        title = texts[0].splitlines()[0].strip() if texts and texts[0] else slug

    notes = pptx_notes(src)
    from PIL import Image  # viene con python-pptx
    w, h = Image.open(os.path.join(out_img, "slide-01.png")).size

    script = {
        "title": title,
        "lang": a.lang,
        "format": a.format,
        "handle": "@less_thanaminute",
        "aspect": round(w / h, 4),
        "intro": {"title": title, "subtitle": ""},
        "slides": [
            {
                "image": f"slides/{slug}/slide-{i:02d}.png",
                "duration": 5,
                "voice": "",
                "_text": texts[i - 1][:1500],
                "_notes": notes.get(i, ""),
                "focus": None,
                "highlights": [],
            }
            for i in range(1, pages + 1)
        ],
        "outro": {"text": "", "cta": ""},
    }
    dst = os.path.join(ROOT, "videos", f"{slug}.slides.json")
    json.dump(script, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{pages} diapositivas → public/slides/{slug}/  ·  guion: videos/{slug}.slides.json")
    print("Siguiente paso: escribir 'voice' de cada diapositiva (a partir de _notes/_text) y renderizar.")


if __name__ == "__main__":
    main()
