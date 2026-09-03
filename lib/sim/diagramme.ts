import type { Annahmen, JahresLauf, Projekt } from "@/lib/typen";
import { STUNDEN } from "./profile";
import { wochentage } from "./kalender";
import { eingeschraenkteRichtung } from "./kern";

export interface DauerPunkt {
  rang: number;
  anteil: number;
  referenz: number;
  fca: number;
  limit: number;
}

const reihenVon = (lauf: JahresLauf, projekt: Projekt) =>
  eingeschraenkteRichtung(projekt) === "einspeisung"
    ? { referenz: lauf.einspeisungReferenz, fca: lauf.einspeisungFca, limit: lauf.limitEinspeisung }
    : { referenz: lauf.entnahmeReferenz, fca: lauf.entnahmeFca, limit: lauf.limitEntnahme };

/**
 * Jahresdauerlinie. Beide Reihen werden getrennt absteigend sortiert, die
 * Fläche zwischen ihnen entspricht genau der abgeregelten Arbeit.
 */
export function dauerlinie(lauf: JahresLauf, projekt: Projekt, punkte = 360): DauerPunkt[] {
  const { referenz, fca, limit } = reihenVon(lauf, projekt);
  const r = Array.from(referenz).sort((a, b) => b - a);
  const f = Array.from(fca).sort((a, b) => b - a);
  const l = Array.from(limit).sort((a, b) => b - a);
  const aus: DauerPunkt[] = [];
  for (let i = 0; i < punkte; i++) {
    const index = Math.round((i / (punkte - 1)) * (STUNDEN - 1));
    aus.push({
      rang: index,
      anteil: (index / (STUNDEN - 1)) * 100,
      referenz: r[index],
      fca: f[index],
      limit: l[index],
    });
  }
  return aus;
}

export interface WochenPunkt {
  h: number;
  stunde: number;
  tag: number;
  referenz: number;
  fca: number;
  limit: number;
  preis: number;
}

/**
 * Ausschnitt einer Woche. Gewählt wird die Woche mit der groessten
 * Abregelung, weil dort das Angebot am ehesten sichtbar wird.
 */
export function schaerfsteWoche(lauf: JahresLauf, projekt: Projekt): WochenPunkt[] {
  const { referenz, fca, limit } = reihenVon(lauf, projekt);
  const tage = wochentage(lauf.jahr);
  let start = 0;
  while (start < 7 * 24 && tage[start] !== 0) start += 24;

  let besterStart = start;
  let bester = -1;
  for (let s = start; s + 168 <= STUNDEN; s += 168) {
    let verlust = 0;
    for (let h = s; h < s + 168; h++) verlust += referenz[h] - fca[h];
    if (verlust > bester) {
      bester = verlust;
      besterStart = s;
    }
  }

  const aus: WochenPunkt[] = [];
  for (let h = besterStart; h < besterStart + 168; h++) {
    aus.push({
      h,
      stunde: h % 24,
      tag: tage[h],
      referenz: referenz[h],
      fca: fca[h],
      limit: limit[h],
      preis: lauf.preis[h],
    });
  }
  return aus;
}

export interface TagesPunkt {
  tag: number;
  monat: number;
  /** Arbeit des Tages in MWh, fester Anschluss. */
  arbeit: number;
  /** Erlös des Tages in EUR, fester Anschluss. */
  erloes: number;
}

/**
 * Tageswerte über das Jahr, für die Vorschau im Projektformular.
 *
 * Beim Speicher ist die Arbeit durch das Zyklenbudget nahezu konstant, dort
 * trägt erst der Erlös eine Aussage.
 */
export function tageswerte(
  lauf: JahresLauf,
  projekt: Projekt,
  annahmen: Annahmen,
): TagesPunkt[] {
  const { referenz } = reihenVon(lauf, projekt);
  const istLast = projekt.typ === "industrielle_last";
  const ppa = annahmen.verguetung === "ppa";
  const aus: TagesPunkt[] = [];
  for (let t = 0; t < 365; t++) {
    let arbeit = 0;
    let erloes = 0;
    for (let h = t * 24; h < (t + 1) * 24; h++) {
      arbeit += referenz[h];
      if (istLast) {
        erloes += lauf.entnahmeReferenz[h] * annahmen.wertProMWhEur;
      } else {
        const preis = ppa ? annahmen.ppaPreisEurProMWh : lauf.preis[h] * annahmen.marktwertfaktor;
        erloes +=
          (lauf.einspeisungReferenz[h] - lauf.entnahmeReferenz[h]) * preis -
          lauf.einspeisungReferenz[h] * (projekt.typ === "bess" ? annahmen.verschleissEurProMWh : 0);
      }
    }
    aus.push({ tag: t, monat: new Date(Date.UTC(2023, 0, 1 + t)).getUTCMonth(), arbeit, erloes });
  }
  return aus;
}

/** Kumulierter Barwert je Jahr, für den Szenarienvergleich. */
export function barwertverlauf(
  cashflows: number[],
  diskontsatzProzent: number,
): { jahr: number; wert: number }[] {
  const r = diskontsatzProzent / 100;
  let summe = 0;
  return cashflows.map((cf, t) => {
    summe += cf / Math.pow(1 + r, t);
    return { jahr: t, wert: summe };
  });
}
