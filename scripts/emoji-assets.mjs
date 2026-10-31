#!/usr/bin/env node
// Extrae los emojis usados en videos/*.json como SVG 3D (Fluent Emoji, MIT) a public/emoji/
// y escribe src/emoji-index.generated.json con los disponibles.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const byEmoji = require("unicode-emoji-json/data-by-emoji.json");
const set = require("@iconify-json/fluent-emoji/icons.json");

const strip = (s) => s.replace(/️/g, "");
const key = (e) => [...strip(e)].map((c) => c.codePointAt(0).toString(16)).join("-");
const bySlug = new Map(Object.entries(byEmoji).map(([e, v]) => [strip(e), v.slug.replace(/_/g, "-")]));

const files = readdirSync("videos").filter((f) => f.endsWith(".json"));
const text = files.map((f) => readFileSync(`videos/${f}`, "utf8")).join("\n");
const found = new Set(text.match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?|\p{Emoji_Modifier})*/gu) ?? []);

mkdirSync("public/emoji", { recursive: true });
const index = {};
for (const e of found) {
  const name = bySlug.get(strip(e));
  const icon = name && (set.icons[name] ?? set.icons[set.aliases?.[name]?.parent]);
  if (!icon) continue;
  const w = icon.width ?? set.width ?? 32, h = icon.height ?? set.height ?? 32;
  writeFileSync(`public/emoji/${key(e)}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="512" height="512">${icon.body}</svg>`);
  index[key(e)] = name;
}
writeFileSync("src/emoji-index.generated.json", JSON.stringify(index, null, 1));
console.log(`Emojis 3D: ${Object.keys(index).length}/${found.size}`);
