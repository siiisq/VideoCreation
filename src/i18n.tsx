import React, { createContext, useContext } from "react";

export type Lang = "es" | "en";

const STRINGS = {
  es: { locale: "es-ES", caffeine: "= cafeína", water: "agua", time: "+ tiempo", espresso: "Espresso", filterCoffee: "Café de filtro", filter: "Filtro", same: "¡misma cafeína!", unknown: "Dibujo desconocido" },
  en: { locale: "en-US", caffeine: "= caffeine", water: "water", time: "+ time", espresso: "Espresso", filterCoffee: "Filter coffee", filter: "Filter", same: "same caffeine!", unknown: "Unknown drawing" },
} as const;

const LangContext = createContext<Lang>("es");
export const LangProvider: React.FC<{ lang: Lang; children: React.ReactNode }> = ({ lang, children }) => <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
export const useT = () => STRINGS[useContext(LangContext)];
