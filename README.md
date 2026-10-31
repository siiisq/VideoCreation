# VideoCreation 🎬

Reels animados de ~1 minuto (formato vertical 9:16) generados por Claude con [Remotion](https://remotion.dev).

**Uso con Claude:** dile *"hazme un reel sobre <tema>"*. Claude escribe el guion en `videos/<tema>.json`, lo renderiza y te entrega el MP4.

**Uso manual:**
```bash
npm install
npm run render -- videos/agujeros-negros.json   # → out/agujeros-negros.mp4
npm run studio                                  # previsualizar y editar
```

Escenas disponibles: gancho, texto, lista, cifra animada, comparación, pasos, cita, gráfico de barras y cierre con CTA. Ver `src/schema.ts`.

Nota: Remotion tiene licencia propia: gratis para particulares y empresas pequeñas; revisa https://remotion.dev/license si lo usas en una empresa.
