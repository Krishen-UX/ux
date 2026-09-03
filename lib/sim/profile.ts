import pvDaten from "@/data/profile/pv.json";
import windDaten from "@/data/profile/wind.json";
import preisDaten from "@/data/profile/preis.json";
import lastDaten from "@/data/profile/last.json";
import type { LastprofilSchluessel, Referenzreihe, Regelzone, Wetterjahr, Reihe } from "@/lib/typen";

export const STUNDEN = 8760;
export const WETTERJAHRE: Wetterjahr[] = [2023, 2024, 2025];

interface Erzeugungsdatei {
  meta: Quellenangabe;
  kalibrierung: Record<string, Record<string, { gamma: number; faktor: number }>>;
  regionen: Record<string, Record<string, number[]>>;
}

export interface Quellenangabe {
  quelle: string;
  quelleUrl: string;
  lizenz: string;
  reihe: string;
  einheit: string;
  aufloesung: string;
  jahre: number[];
  abgerufenAm: string;
  verarbeitung: string[];
  [weitere: string]: unknown;
}

const DATEIEN: Record<Referenzreihe, Erzeugungsdatei> = {
  pv: pvDaten as unknown as Erzeugungsdatei,
  wind: windDaten as unknown as Erzeugungsdatei,
};

const speicher = new Map<string, Float32Array>();

function merke(schluessel: string, baue: () => Float32Array): Reihe {
  const vorhanden = speicher.get(schluessel);
  if (vorhanden) return vorhanden;
  const neu = baue();
  speicher.set(schluessel, neu);
  return neu;
}

/**
 * Flottenprofil der Regelzone, normiert auf das Jahresmaximum. Das ist die
 * Größe, an der sich eine Referenzanlagenregelung orientiert.
 */
export function referenzprofil(
  reihe: Referenzreihe,
  zone: Regelzone,
  jahr: Wetterjahr,
): Reihe {
  return merke(`ref:${reihe}:${zone}:${jahr}`, () =>
    Float32Array.from(DATEIEN[reihe].regionen[zone][String(jahr)]),
  );
}

/**
 * Erzeugungsprofil einer Einzelanlage am Standort, als Anteil der
 * installierten Leistung. Aus dem Flottenprofil über die im ETL bestimmte
 * Potenztransformation, siehe Datenkopf.
 */
export function erzeugungsprofil(
  reihe: Referenzreihe,
  zone: Regelzone,
  jahr: Wetterjahr,
): Reihe {
  return merke(`erz:${reihe}:${zone}:${jahr}`, () => {
    const flotte = referenzprofil(reihe, zone, jahr);
    const { gamma, faktor } = DATEIEN[reihe].kalibrierung[zone][String(jahr)];
    const aus = new Float32Array(STUNDEN);
    for (let h = 0; h < STUNDEN; h++) aus[h] = Math.min(1, faktor * Math.pow(flotte[h], gamma));
    return aus;
  });
}

export function preisreihe(jahr: Wetterjahr): Reihe {
  return merke(`preis:${jahr}`, () =>
    Float32Array.from((preisDaten as { jahre: Record<string, number[]> }).jahre[String(jahr)]),
  );
}

export function lastprofil(schluessel: LastprofilSchluessel, jahr: Wetterjahr): Reihe {
  return merke(`last:${schluessel}:${jahr}`, () =>
    Float32Array.from(
      (lastDaten as unknown as LastDatei).profile[schluessel].jahre[String(jahr)],
    ),
  );
}

interface LastDatei {
  meta: Quellenangabe;
  profile: Record<
    LastprofilSchluessel,
    { label: string; beschreibung: string; jahre: Record<string, number[]> }
  >;
}

export const LASTPROFILE = (lastDaten as unknown as LastDatei).profile;

/** Oberes Perzentil der Referenzreihe, Bezugsgröße für die Engpasstiefe. */
export function referenzSpitze(reihe: Referenzreihe, zone: Regelzone, jahr: Wetterjahr): number {
  const schluessel = `spitze:${reihe}:${zone}:${jahr}`;
  const vorhanden = speicher.get(schluessel);
  if (vorhanden) return vorhanden[0];
  const werte = Array.from(referenzprofil(reihe, zone, jahr)).sort((a, b) => a - b);
  const wert = werte[Math.round(0.99 * (werte.length - 1))];
  speicher.set(schluessel, Float32Array.of(wert));
  return wert;
}

export const QUELLEN: Quellenangabe[] = [
  pvDaten.meta as unknown as Quellenangabe,
  windDaten.meta as unknown as Quellenangabe,
  preisDaten.meta as unknown as Quellenangabe,
  lastDaten.meta as unknown as Quellenangabe,
];
