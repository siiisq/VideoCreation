import { continueRender, delayRender, staticFile } from "remotion";

// Fuentes incluidas en public/fonts (licencia OFL) para que el render funcione sin internet.
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

const faces: Array<[string, string, string, string]> = [
  ["Montserrat", "fonts/montserrat-latin.woff2", "700 900", LATIN],
  ["Montserrat", "fonts/montserrat-latin-ext.woff2", "700 900", LATIN_EXT],
  ["Inter", "fonts/inter-latin.woff2", "500 800", LATIN],
  ["Inter", "fonts/inter-latin-ext.woff2", "500 800", LATIN_EXT],
];

if (typeof document !== "undefined") {
  const handle = delayRender("Cargando fuentes");
  Promise.all(
    faces.map(([family, file, weight, unicodeRange]) => {
      const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight, unicodeRange });
      (document.fonts as unknown as Set<FontFace>).add(f);
      return f.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error("Error cargando fuentes", e);
      continueRender(handle);
    });
}

export const display = `Montserrat, Inter, sans-serif`;
export const body = `Inter, sans-serif`;
export const emojiFont = `"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
