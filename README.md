# VideoCreation 🎬

Reels animados de ~1 minuto (vertical 9:16) y vídeos narrados a partir de presentaciones, generados por Claude con [Remotion](https://remotion.dev).

**Uso con Claude:** dile *"hazme un reel sobre <tema>"*. Claude escribe el guion en `videos/<tema>.json`, lo renderiza y te entrega el MP4.

**Uso manual:**
```bash
npm install
npm run render -- videos/agujeros-negros.json   # → out/agujeros-negros.mp4
npm run studio                                  # previsualizar y editar
```

**Presentaciones → vídeo** (sin límite de duración): deja tu PPTX/PDF en `presentations/` y dile a Claude *"haz un vídeo de esta presentación"*. Manualmente:
```bash
npm run import -- presentations/charla.pptx          # diapositivas + guion con notas
# (escribir la narración "voice" de cada diapositiva en videos/charla.slides.json)
npm run render -- videos/charla.slides.json          # → out/charla.mp4
```

Escenas disponibles: gancho, texto, lista, cifra animada, comparación, pasos, cita, gráfico de barras y cierre con CTA. Ver `src/schema.ts`.

Nota: Remotion tiene licencia propia: gratis para particulares y empresas pequeñas; revisa https://remotion.dev/license si lo usas en una empresa.
