import { STUNDEN } from "./profile";

/**
 * Wochentag je Stunde im Raster der Zeitreihen, 0 = Montag.
 *
 * Die Profile liegen auf einem Normaljahr aus 365 Tagen, der 29. Februar
 * entfällt. Der Wochentag wird deshalb aus dem tatsächlichen Kalender
 * gezogen und nicht aus der Stundennummer gerechnet, sonst verschiebt sich das
 * Wochenende in Schaltjahren gegen die Preisreihe.
 */
export function wochentagReihe(jahr: number): Uint8Array {
  const aus = new Uint8Array(STUNDEN);
  const datum = new Date(Date.UTC(jahr, 0, 1));
  let tag = 0;
  while (tag < 365) {
    if (!(datum.getUTCMonth() === 1 && datum.getUTCDate() === 29)) {
      const wochentag = (datum.getUTCDay() + 6) % 7;
      aus.fill(wochentag, tag * 24, (tag + 1) * 24);
      tag++;
    }
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return aus;
}

const zwischenspeicher = new Map<number, Uint8Array>();

export function wochentage(jahr: number): Uint8Array {
  let reihe = zwischenspeicher.get(jahr);
  if (!reihe) {
    reihe = wochentagReihe(jahr);
    zwischenspeicher.set(jahr, reihe);
  }
  return reihe;
}

export const WOCHENTAG_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/** Beschriftung einer Stunde im Raster, etwa "14. Mai, 13 Uhr". */
export function stundenLabel(h: number): string {
  const tag = Math.floor(h / 24);
  const datum = new Date(Date.UTC(2023, 0, 1 + tag));
  return `${datum.getUTCDate()}. ${MONATE[datum.getUTCMonth()]}, ${h % 24} Uhr`;
}

export const MONATE = [
  "Januar",
  "Februar",
  "Maerz",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
