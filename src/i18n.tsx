import React, { createContext, useContext } from "react";

export type Lang = "es" | "en";

const STRINGS = {
  es: { locale: "es-ES", caffeine: "= cafeína", water: "agua", time: "+ tiempo", espresso: "Espresso", filterCoffee: "Café de filtro", filter: "Filtro", same: "¡misma cafeína!", unknown: "Dibujo desconocido", gas: "gas irritante", sulfur: "compuestos de azufre", enzyme: "enzima", tears: "lágrimas", cold: "Frío", sharp: "Afilado", airflow: "Aire", newBadge: "NUEVO", satisfaction: "Satisfacción", payslip: "NÓMINA", ipc: "IPC", irpf: "IRPF", salaryUp: "Sueldo +5%", pricesUp: "Precios +5%", samePower: "= mismo poder de compra", yourSalary: "Tu sueldo", onlyThisPart: "solo esto paga el 30%", only800: "solo 800 € al 37%", frozen: "Tramos congelados", deflated: "Tramos deflactados", jumpsBracket: "¡saltas al 37%!", sameBracket: "mismo tramo", grossSalary: "Sueldo" },
  en: { locale: "en-US", caffeine: "= caffeine", water: "water", time: "+ time", espresso: "Espresso", filterCoffee: "Filter coffee", filter: "Filter", same: "same caffeine!", unknown: "Unknown drawing", gas: "irritant gas", sulfur: "sulfur compounds", enzyme: "enzyme", tears: "tears", cold: "Cold", sharp: "Sharp", airflow: "Airflow", newBadge: "NEW", satisfaction: "Satisfaction", payslip: "PAYSLIP", ipc: "CPI", irpf: "TAX", salaryUp: "Salary +5%", pricesUp: "Prices +5%", samePower: "= same buying power", yourSalary: "Your salary", onlyThisPart: "only this pays 30%", only800: "only €800 at 37%", frozen: "Frozen brackets", deflated: "Indexed brackets", jumpsBracket: "you jump to 37%!", sameBracket: "same bracket", grossSalary: "Salary" },
} as const;

const LangContext = createContext<Lang>("es");
export const LangProvider: React.FC<{ lang: Lang; children: React.ReactNode }> = ({ lang, children }) => <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
export const useT = () => STRINGS[useContext(LangContext)];
