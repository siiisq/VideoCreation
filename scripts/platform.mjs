// Diferencias entre este contenedor Linux y un PC con Windows/Mac (ver docs/windows.md).
import { existsSync, globSync } from "node:fs";
import path from "node:path";

export const isWin = process.platform === "win32";
/** Python del entorno virtual del repo (.venv). */
export const venvPython = isWin ? path.join(".venv", "Scripts", "python.exe") : ".venv/bin/python";
/** Python del sistema (para crear el .venv o lanzar scripts sin dependencias). */
export const sysPython = isWin ? "python" : "python3";
/** Ejecutable local de un paquete de npm (en Windows es un .cmd). */
export const npmBin = (dir, name) => path.resolve(dir, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
/**
 * Modo gráfico de Chrome para Remotion. En el contenedor: "egl" (GPU por software). En Windows: "angle", que usa la
 * GPU de verdad (Direct3D). Se puede forzar con la variable REMOTION_GL (p. ej. "vulkan" o "angle-egl").
 */
export const defaultGl = process.env.REMOTION_GL ?? (isWin || process.platform === "darwin" ? "angle" : "egl");
/** Chrome del contenedor si existe; en un PC normal Remotion descarga el suyo solo. */
export const browserExecutable = () =>
  process.env.REMOTION_BROWSER ?? (isWin ? undefined : globSync("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell")[0]);
/** Prepara el .venv con las dependencias de la voz si no existe (multiplataforma, sin bash). */
export const ensureVenv = (run) => {
  if (existsSync(venvPython)) return;
  console.log("Creando el entorno de Python (solo la primera vez)…");
  run(sysPython, ["-m", "venv", ".venv"]);
  run(venvPython, ["-m", "pip", "install", "-q", "numpy", "soundfile", "python-pptx==1.0.2"]);
};

import { spawnSync } from "node:child_process";
/** En Windows, npm/npx y los .cmd solo se pueden lanzar con shell (y hay que entrecomillar rutas con espacios). */
const needsShell = (cmd) => isWin && (/\.cmd$/i.test(cmd) || cmd === "npm" || cmd === "npx");
const quote = (s) => (/[\s&()^|<>]/.test(s) ? `"${s}"` : s);
export const spawnX = (cmd, args, opts = {}) => {
  // la consola de Windows no es UTF-8: sin esto, Python falla al imprimir "→", "⚠️"…
  const o = isWin ? { ...opts, env: { ...process.env, ...(opts.env ?? {}), PYTHONUTF8: "1" } } : opts;
  return needsShell(cmd) ? spawnSync(quote(cmd), args.map(quote), { ...o, shell: true }) : spawnSync(cmd, args, o);
};
