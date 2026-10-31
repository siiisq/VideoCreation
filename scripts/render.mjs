#!/usr/bin/env node
// Uso: npm run render -- videos/mi-video.json          →  out/mi-video.mp4  (reel)
//      npm run render -- videos/charla.slides.json     →  out/charla.mp4    (presentación)
import { spawnSync } from "node:child_process";
import { existsSync, globSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("Uso: npm run render -- videos/<nombre>.json");
  process.exit(1);
}
const name = path.basename(file, ".json").replace(/\.slides$/, "");
mkdirSync("out", { recursive: true });
const out = `out/${name}.mp4`;

// 1) Emojis 3D usados en los guiones → public/emoji
spawnSync("node", ["scripts/emoji-assets.mjs"], { stdio: "inherit" });

// 2) Voz en off (si el guion tiene "voice" en alguna escena) → props finales con duraciones ajustadas
let props = file;
const reel = JSON.parse(readFileSync(file, "utf8"));
const isPres = Array.isArray(reel.slides);
const parts = isPres ? [reel.intro, ...reel.slides, reel.outro].filter(Boolean) : reel.scenes;
if (parts.some((s) => s.voice)) {
  if (!existsSync(".venv/bin/python") || !existsSync("models/kokoro-v1.0.onnx")) {
    console.log("Instalando la voz (solo la primera vez)...");
    if (spawnSync("bash", ["scripts/setup-python.sh"], { stdio: "inherit" }).status !== 0) process.exit(1);
  }
  props = `out/${name}.props.json`;
  if (spawnSync(".venv/bin/python", ["-I", "scripts/tts.py", file, props], { stdio: "inherit" }).status !== 0) process.exit(1);
}

// 3) Render: H.264 alta calidad, JPEG 95 por fotograma, GPU por software (egl) → ~3,5x más rápido
const args = [
  "remotion", "render", "src/index.ts", isPres ? "Presentation" : "Reel", out, `--props=${props}`,
  "--codec=h264", "--crf=17", "--x264-preset=slow", "--jpeg-quality=95",
  "--audio-codec=aac", "--audio-bitrate=192k", "--color-space=bt709",
  `--gl=${process.env.REMOTION_GL ?? "egl"}`, "--log=warn",
];
const browser = process.env.REMOTION_BROWSER ?? globSync("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell")[0];
if (browser) args.push(`--browser-executable=${browser}`);

const t0 = Date.now();
const r = spawnSync("npx", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

// 4) Volumen estándar de redes sociales (-14 LUFS), sin recodificar el vídeo
const tmp = out.replace(/\.mp4$/, ".tmp.mp4");
const n = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", out, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", tmp], { stdio: "inherit" });
if (n.status === 0) renameSync(tmp, out);
console.log(`\n✅ Vídeo listo: ${out} (${Math.round((Date.now() - t0) / 1000)} s)`);
