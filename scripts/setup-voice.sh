#!/usr/bin/env bash
# Instala la voz en off (Kokoro TTS, Apache-2.0) en .venv y descarga el modelo en models/ (~350 MB).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q kokoro-onnx==0.4.9 soundfile
mkdir -p models
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/kokoro-v1.0.onnx ] || curl -sSfL -o models/kokoro-v1.0.onnx $base/kokoro-v1.0.onnx
[ -f models/voices-v1.0.bin ] || curl -sSfL -o models/voices-v1.0.bin $base/voices-v1.0.bin
echo "Voz lista."
