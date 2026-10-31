#!/usr/bin/env python3
"""Crea presentations/ejemplo-presentacion.pptx (demo con notas del orador)."""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
prs = Presentation(); prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
DARK, ORANGE, GREEN, BLUE, GREY = RGBColor(0x1f, 0x2a, 0x44), RGBColor(0xff, 0x8a, 0x00), RGBColor(0x2e, 0xa0, 0x5a), RGBColor(0x2f, 0x6f, 0xd6), RGBColor(0x66, 0x66, 0x66)


def text(slide, x, y, w, h, t, size, color=DARK, bold=False):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)).text_frame
    tb.word_wrap = True
    p = tb.paragraphs[0]; p.text = t; p.font.size = Pt(size); p.font.bold = bold; p.font.color.rgb = color
    return tb


def box(slide, x, y, w, h, color, label, size=24):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background()
    tf = s.text_frame; tf.text = label; tf.paragraphs[0].font.size = Pt(size); tf.paragraphs[0].font.bold = True; tf.paragraphs[0].font.color.rgb = RGBColor(255, 255, 255)


def notes(slide, t):
    slide.notes_slide.notes_text_frame.text = t


s = prs.slides.add_slide(BLANK)
text(s, 0.8, 2.3, 11.5, 1.5, "La fotosíntesis", 66, DARK, True)
text(s, 0.8, 3.8, 11.5, 1, "Cómo las plantas convierten la luz en comida", 30, GREY)
notes(s, "Presentar el tema: la fotosíntesis es el proceso que alimenta casi toda la vida en la Tierra.")

s = prs.slides.add_slide(BLANK)
text(s, 0.8, 0.5, 11.5, 1, "Los ingredientes", 44, DARK, True)
box(s, 0.8, 2.2, 3.6, 2.2, ORANGE, "☀ Luz solar", 30)
box(s, 4.85, 2.2, 3.6, 2.2, BLUE, "💧 Agua", 30)
box(s, 8.9, 2.2, 3.6, 2.2, GREY, "CO₂ del aire", 30)
text(s, 0.8, 5.2, 11.5, 1, "La planta absorbe agua por las raíces y CO₂ por las hojas.", 24, GREY)
notes(s, "Necesita tres cosas: luz, agua y dióxido de carbono. El agua entra por las raíces y el CO2 por los estomas de las hojas.")

s = prs.slides.add_slide(BLANK)
text(s, 0.8, 0.5, 11.5, 1, "La reacción", 44, DARK, True)
text(s, 0.8, 2.6, 11.7, 1.2, "6 CO₂ + 6 H₂O  →  C₆H₁₂O₆ + 6 O₂", 46, DARK, True)
box(s, 6.2, 4.4, 3.0, 1.3, GREEN, "Glucosa", 26)
box(s, 9.6, 4.4, 3.0, 1.3, BLUE, "Oxígeno", 26)
notes(s, "Con la energía de la luz, la planta transforma CO2 y agua en glucosa, su alimento, y libera oxígeno como subproducto.")

s = prs.slides.add_slide(BLANK)
text(s, 0.8, 0.5, 11.5, 1, "¿Por qué importa?", 44, DARK, True)
for i, t in enumerate(["Produce el oxígeno que respiramos", "Es la base de casi todas las cadenas alimentarias", "Retira CO₂ de la atmósfera"]):
    text(s, 1.2, 2.0 + i * 1.3, 11, 1, f"•  {t}", 30)
notes(s, "Tres motivos: el oxígeno que respiramos, la base de la cadena alimentaria y la captura de CO2.")

os.makedirs(os.path.join(ROOT, "presentations"), exist_ok=True)
prs.save(os.path.join(ROOT, "presentations", "ejemplo-presentacion.pptx"))
print("presentations/ejemplo-presentacion.pptx")
