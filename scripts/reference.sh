#!/usr/bin/env bash
# Descarga un vídeo de referencia (YouTube/Instagram/TikTok) SOLO para analizar su ritmo y estilo.
# No reutilices su contenido: respeta los derechos de autor.
# Uso: bash scripts/reference.sh <url>   → references/<id>/ (vídeo, tira de fotogramas y transcripción)
# Requiere que los dominios del vídeo estén permitidos en la red del entorno.
set -euo pipefail
cd "$(dirname "$0")/.."
url="$1"
mkdir -p references
.venv/bin/yt-dlp -q -f "mp4/best" -o "references/%(id)s/video.%(ext)s" --write-info-json "$url"
dir=$(ls -td references/*/ | head -1)
ffmpeg -v error -y -i "$dir/video.mp4" -vf "fps=1,scale=216:-1,tile=10x6" -frames:v 1 "$dir/contact.png"
ffmpeg -v error -y -i "$dir/video.mp4" -vn -ac 1 -ar 16000 "$dir/audio.wav"
.venv/bin/python -I scripts/transcribe.py "$dir/audio.wav" > "$dir/words.json" || echo "(sin transcripción: Whisper no disponible)"
echo "Referencia lista en $dir"
