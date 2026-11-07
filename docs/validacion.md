# Validación de vídeos (OBLIGATORIA antes de entregar)

Cada reel que se renderiza lo revisa una segunda sesión de Claude, **«Validador de videos»**
(id `session_01FJjgdMWKE4i5MaWSYwrRg8`), antes de darlo por bueno. La sesión que genera el vídeo
(p. ej. «Videos Gen PC») NO entrega al usuario un vídeo sin validar.

## Rutina de la sesión que genera
1. `npm run reel -- videos/<slug>.json` (como siempre) y tu propia revisión de la tira.
2. `npm run review-bundle -- videos/<slug>.json`
   - pasa Whisper al audio final → `out/<slug>.words.json` (tiempos reales por palabra);
   - sube `movil.mp4`, `props.json`, `words.json` y el guion a la rama `review/<slug>` (rama huérfana, un commit,
     no toca tu rama de trabajo).
3. Haz commit y push del guion JSON y del código en tu rama de trabajo, como siempre.
4. Avisa al validador con la herramienta `send_message` (servidor `claude-code-remote`) a
   `session_01FJjgdMWKE4i5MaWSYwrRg8`, por ejemplo:
   `VALIDAR <slug> · rama review/<slug> · rama de código <tu-rama> · commit <sha> · notas: <lo que dudes>`.
   Si no tienes esa herramienta, dile al usuario: «Pásale al validador: VALIDAR <slug> (rama review/<slug>)».
5. Espera el veredicto. Si es **❌ CORREGIR**, arregla los puntos, vuelve a renderizar y repite desde el paso 2.
   Solo con **✅ OK** envías el vídeo al usuario con la descripción y los hashtags.

## Qué revisa el validador
`python3 scripts/review.py <carpeta del paquete>` → `out/review/<slug>/` (informe + hojas de fotogramas), y además:
- **Audio**: −14 LUFS ± 1,5, sin picos > −0,5 dBFS, sin silencios raros, voz presente en cada escena, la voz no se
  corta ni invade el fundido, la música baja bajo la voz, la voz dice lo que pone el guion (Whisper).
- **Sincronía**: cada `atWords` aparece como mucho ±0,35 s respecto a la palabra real dicha (Whisper); subtítulos
  al compás; la palabra clave se resalta cuando se dice.
- **Dibujos y maquetación**: textos dentro de sus recuadros/tiles (sin desbordes ni cortes), nada se pisa, franja
  de subtítulos libre (y < 430 px), contenido entre 450 y 1600 px, recuadros del plano anterior retirados,
  calidad de dibujo de la plantilla obligatoria (volumen, contornos, brillo, sombra, vida).
- **Cortes**: fundidos limpios (fotogramas −0,2 / 0 / +0,2 s), sin saltos de cámara.
- **Reglas del reel**: gancho visible desde el fotograma 1, ~30 s, hoja de compartir solo al final, cifras coherentes.

## Veredicto
El validador responde a la sesión que generó (send_message) con:
- `✅ OK <slug>` o `❌ CORREGIR <slug>` + lista numerada: segundo, escena/plano, problema, arreglo propuesto
  (archivo y valor cuando lo sepa).
Después borra la rama `review/<slug>` cuando el vídeo queda aprobado.
