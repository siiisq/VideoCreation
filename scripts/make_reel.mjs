#!/usr/bin/env node
/**
 * Reel completo con el estilo aprobado (ilustraciones + capa de HyperFrames), en un solo comando:
 *   npm run reel -- videos/<slug>.json            → out/<slug>.mp4
 *   npm run reel -- videos/<slug>.json --classic  → sin capa de HyperFrames
 * Pasos: voz (Gemini/Google, nunca Kokoro sin pedirlo) → capa HyperFrames sincronizada (gancho animado,
 * subtítulos karaoke, partículas, transiciones, tarjeta de seguir) → render final → controles automáticos.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const file = process.argv[2];
const classic = process.argv.includes("--classic");
if (!file || !existsSync(file)) { console.error("Uso: npm run reel -- videos/<slug>.json [--classic]"); process.exit(1); }
const slug = path.basename(file, ".json");
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) { console.error(`\n❌ Falló: ${cmd} ${args.join(" ")}`); process.exit(r.status ?? 1); }
};
const step = (n, t) => console.log(`\n━━ ${n}. ${t}`);
mkdirSync("out", { recursive: true });

if (classic) { run("node", ["scripts/render.mjs", file]); process.exit(0); }

// 1) Voz (con caché; 1 petición por reel en Gemini)
step(1, "Voz en off");
if (!existsSync(".venv/bin/python")) run("bash", ["scripts/setup-python.sh"]);
run(".venv/bin/python", ["-I", "scripts/tts.py", file, `out/${slug}.props.json`]);

// 2) Capa de HyperFrames sincronizada con la voz
step(2, "Capa de motion graphics (HyperFrames)");
const hfDir = "experiments/hyperframes";
const hfBin = path.resolve(hfDir, "node_modules/.bin/hyperframes");
if (!existsSync(hfBin)) run("npm", ["ci"], { cwd: hfDir });
run("python3", ["scripts/hf_layer.py", `out/${slug}.props.json`]);
const layerDir = path.join(hfDir, "layers", slug);
const env = { ...process.env, DO_NOT_TRACK: "1", HYPERFRAMES_SKIP_SKILLS: "1" };
run(hfBin, ["lint"], { cwd: layerDir, env });
const insp = spawnSync(hfBin, ["inspect", "--json", "--samples", "24"], { cwd: layerDir, env, encoding: "utf8" });
try {
  const issues = (JSON.parse(insp.stdout).issues ?? []).filter((i) => i.severity === "error");
  console.log(issues.length ? `⚠️  ${issues.length} problemas de maquetación en la capa:` : "✓ Capa sin problemas de maquetación");
  issues.slice(0, 8).forEach((i) => console.log(`   - ${i.code} @${i.time}s: ${i.message}`));
} catch { console.log("(no se pudo inspeccionar la capa)"); }
const layerOut = path.resolve(`public/overlays/${slug}-layer.webm`);
run(hfBin, ["render", "--format", "webm", "--fps", "60", "-q", "delivery", "-o", layerOut], { cwd: layerDir, env, stdio: ["ignore", "inherit", "inherit"] });

// 3) Guion combinado: capa encima, subtítulos en vez de textos de apoyo, título del gancho lo pone la capa
step(3, "Render final");
const reel = JSON.parse(readFileSync(file, "utf8"));
Object.assign(reel, { overlay: `overlays/${slug}-layer.webm`, captions: true, hideHandleAtEnd: true, hideCtaAtEnd: true });
if (reel.scenes[0]) { reel.scenes[0].hideTitle = true; delete reel.scenes[0].overlay; }
const combined = `out/${slug}.combined.json`;
writeFileSync(combined, JSON.stringify(reel, null, 2));
run("node", ["scripts/render.mjs", combined, slug]);

// 4) Controles automáticos
step(4, "Controles");
const mp4 = `out/${slug}.mp4`;
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" });
const dur = parseFloat(probe.stdout);
const loud = spawnSync("ffmpeg", ["-i", mp4, "-af", "ebur128", "-vn", "-f", "null", "-"], { encoding: "utf8" }).stderr.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", "1", "-i", mp4, "-vf", "fps=1/3.5,scale=180:320,tile=16x1", "-frames:v", "1", `out/${slug}.contact.png`]);
console.log(`Duración: ${dur.toFixed(1)} s ${dur > 60 && !reel.longForm ? "⚠️  pasa de 60 s" : "✓"}`);
console.log(`Volumen: ${loud ?? "?"} (objetivo -14 LUFS)`);
console.log(`Tira de fotogramas para revisar: out/${slug}.contact.png`);
console.log(`\n✅ Reel listo: ${mp4}`);
