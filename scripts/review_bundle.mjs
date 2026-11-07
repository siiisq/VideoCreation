#!/usr/bin/env node
/**
 * Paquete de revisión para la sesión validadora (ver docs/validacion.md).
 *   npm run review-bundle -- videos/<slug>.json
 * 1) Whisper sobre el audio final → out/<slug>.words.json (tiempos reales por palabra).
 * 2) Sube movil.mp4 + props.json + words.json + guion a la rama huérfana `review/<slug>` (un solo commit, forzado),
 *    sin tocar la rama ni el árbol de trabajo actuales.
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ensureVenv, spawnX, venvPython } from "./platform.mjs";

const file = process.argv[2];
if (!file || !existsSync(file)) { console.error("Uso: npm run review-bundle -- videos/<slug>.json"); process.exit(1); }
const slug = path.basename(file, ".json");
const need = [`out/${slug}.movil.mp4`, `out/${slug}.props.json`];
for (const f of need) if (!existsSync(f)) { console.error(`Falta ${f}: ejecuta antes npm run reel -- ${file}`); process.exit(1); }
const run = (cmd, args, opts = {}) => {
  const r = spawnX(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) { console.error(`\n❌ Falló: ${cmd} ${args.join(" ")}`); process.exit(r.status ?? 1); }
};

// 1) Whisper
const words = `out/${slug}.words.json`;
const wav = `out/${slug}.review.wav`;
ensureVenv(run);
if (spawnX(venvPython, ["-c", "import faster_whisper"]).status !== 0)
  spawnX(venvPython, ["-m", "pip", "install", "-q", "faster-whisper==1.2.1"], { stdio: "inherit" });
run("ffmpeg", ["-v", "error", "-y", "-i", `out/${slug}.movil.mp4`, "-vn", "-ac", "1", "-ar", "16000", wav]);
const lang = slug.endsWith(".en") ? "en" : "es";
const tr = spawnX(venvPython, ["-I", "scripts/transcribe.py", wav, "--lang", lang], { encoding: "utf8", maxBuffer: 64 << 20 });
if (tr.status === 0 && tr.stdout.trim().startsWith("[")) { writeFileSync(words, tr.stdout); console.log(`✓ Whisper: ${words}`); }
else console.log(`⚠️  Whisper no disponible (${(tr.stderr || "").trim().slice(-200)}): se sube sin words.json`);

// 2) Rama huérfana review/<slug> con git plumbing (no cambia de rama ni toca el índice)
const git = (args, input) => {
  const r = spawnSync("git", args, { encoding: "utf8", input });
  if (r.status !== 0) { console.error(`❌ git ${args.join(" ")}\n${r.stderr}`); process.exit(1); }
  return r.stdout.trim();
};
const files = [...need, file, ...(existsSync(words) ? [words] : [])];
const tree = git(["mktree"], files.map((f) => `100644 blob ${git(["hash-object", "-w", f])}\t${path.basename(f)}`).join("\n") + "\n");
const commit = git(["commit-tree", tree, "-m", `review: ${slug}`]);
const branch = `review/${slug}`;
let ok = false;
for (const wait of [0, 2, 4, 8, 16]) {
  if (wait) spawnSync(process.execPath, ["-e", `setTimeout(()=>{}, ${wait * 1000})`]);
  if (spawnSync("git", ["push", "--force", "origin", `${commit}:refs/heads/${branch}`], { stdio: "inherit" }).status === 0) { ok = true; break; }
}
if (!ok) { console.error("❌ No se pudo subir el paquete"); process.exit(1); }
console.log(`\n✅ Paquete de revisión subido a la rama ${branch} (${files.map((f) => path.basename(f)).join(", ")})`);
console.log("   Ahora avisa a la sesión «Validador de videos» (ver docs/validacion.md).");
