import type { JahresLauf, Projekt } from "@/lib/typen";
import { fmtEur, fmtMWh } from "@/lib/format";

/**
 * Welche Größe ein Anlagentyp als Ergebnis trägt.
 *
 * Bei Erzeugung und Last ist es die Arbeit. Beim Speicher ist die Arbeit durch
 * das Zyklenbudget nahezu konstant, dort sagt erst der Erlös etwas aus.
 */
export function ergebnisgroesse(projekt: Projekt): {
  label: string;
  kurz: string;
  wert: (lauf: JahresLauf) => number;
  formatiere: (n: number) => string;
} {
  if (projekt.typ === "bess") {
    return {
      label: "Jahreserlös",
      kurz: "Erlös",
      wert: (l) => l.erloesFcaEur + l.entschaedigungEur,
      formatiere: fmtEur,
    };
  }
  if (projekt.typ === "industrielle_last") {
    return {
      label: "Jahresbezug",
      kurz: "Bezug",
      wert: (l) => l.entnahmeFcaMWh,
      formatiere: fmtMWh,
    };
  }
  return {
    label: "Jahresertrag",
    kurz: "Ertrag",
    wert: (l) => l.einspeisungFcaMWh,
    formatiere: fmtMWh,
  };
}

/**
 * Wirtschaftliches Jahresergebnis unter dem FCA. Danach werden die Wetterjahre
 * geordnet, deshalb liegt P90 immer unter P50.
 */
export const jahresergebnis = (lauf: JahresLauf) => lauf.erloesFcaEur + lauf.entschaedigungEur;
