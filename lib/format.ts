/** Einheitliche Zahlenformate. Alle Werte deutsch, mit Tabellenziffern im UI. */

const zahl = (n: number, stellen = 0) =>
  new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  }).format(n);

export const fmtZahl = zahl;

/** Große Geldbetraege kompakt, kleine vollständig. */
export function fmtEur(wert: number, kompakt = true): string {
  if (!Number.isFinite(wert)) return "-";
  const betrag = Math.abs(wert);
  if (kompakt && betrag >= 1_000_000) return `${zahl(wert / 1_000_000, 1)} Mio EUR`;
  if (kompakt && betrag >= 10_000) return `${zahl(wert / 1_000, 0)} Tsd EUR`;
  return `${zahl(wert, 0)} EUR`;
}

export function fmtEurVorzeichen(wert: number): string {
  const text = fmtEur(wert);
  return wert > 0 ? `+${text}` : text;
}

export function fmtMWh(wert: number): string {
  if (!Number.isFinite(wert)) return "-";
  if (Math.abs(wert) >= 1_000_000) return `${zahl(wert / 1_000_000, 2)} TWh`;
  if (Math.abs(wert) >= 10_000) return `${zahl(wert / 1_000, 1)} GWh`;
  return `${zahl(wert, 0)} MWh`;
}

export const fmtMW = (wert: number) => `${zahl(wert, wert < 10 ? 1 : 0)} MW`;
export function fmtProzent(wert: number, stellen = 1): string {
  const schwelle = 0.5 * Math.pow(10, -stellen);
  if (wert > 0 && wert < schwelle) return `unter ${zahl(schwelle * 2, stellen)} %`;
  if (wert < 0 && wert > -schwelle) return `unter ${zahl(schwelle * 2, stellen)} %`;
  return `${zahl(wert, stellen)} %`;
}
export const fmtJahre = (wert: number | null) => (wert === null ? "nie" : `${zahl(wert, 1)} Jahre`);
export const fmtStunden = (wert: number) => `${zahl(wert, 0)} h`;
