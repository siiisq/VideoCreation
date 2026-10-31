#!/usr/bin/env node
// Uso: npm run render -- videos/mi-video.json   →  out/mi-video.mp4
import { spawnSync } from "node:child_process";
import { existsSync, globSync, mkdirSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("Uso: npm run render -- videos/<nombre>.json");
  process.exit(1);
}
const name = path.basename(file, ".json");
mkdirSync("out", { recursive: true });
const out = `out/${name}.mp4`;

// 1) Emojis 3D usados en los guiones → public/emoji
spawnSync("node", ["scripts/emoji-assets.mjs"], { stdio: "inherit" });

// 2) Render: H.264 alta calidad, JPEG 95 por fotograma, GPU por software (egl) → ~3,5x más rápido
const args = [
  "remotion", "render", "src/index.ts", "Reel", out, `--props=${file}`,
  "--codec=h264", "--crf=17", "--x264-preset=slow", "--jpeg-quality=95",
  "--audio-codec=aac", "--audio-bitrate=192k", "--color-space=bt709",
  `--gl=${process.env.REMOTION_GL ?? "egl"}`, "--log=warn",
];
const browser = process.env.REMOTION_BROWSER ?? globSync("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell")[0];
if (browser) args.push(`--browser-executable=${browser}`);

const t0 = Date.now();
const r = spawnSync("npx", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`\n✅ Vídeo listo: ${out} (${Math.round((Date.now() - t0) / 1000)} s)`);
