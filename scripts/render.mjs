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

const args = ["remotion", "render", "src/index.ts", "Reel", out, `--props=${file}`, "--codec=h264", "--crf=18", "--log=warn"];

// En entornos sin el Chrome de Remotion, reutiliza el Chromium preinstalado si existe.
const browser = process.env.REMOTION_BROWSER ?? globSync("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell")[0];
if (browser) args.push(`--browser-executable=${browser}`);

const r = spawnSync("npx", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`\n✅ Vídeo listo: ${out}`);
