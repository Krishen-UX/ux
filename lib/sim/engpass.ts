import type { Annahmen, FcaAngebot, Referenzreihe, Regelzone, Wetterjahr, Reihe } from "@/lib/typen";
import { STUNDEN, referenzSpitze, referenzprofil } from "./profile";

/** Deterministischer Zufall, damit ein Parametersatz immer dasselbe Ergebnis liefert. */
function rauschen(saat: number): () => number {
  let x = saat >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

/**
 * Engpasstiefe am Netzknoten je Stunde, 0 bis 1.
 *
 * 0 bedeutet freier Netzzugang, 1 bedeutet, dass die flexiblen Anschlüsse am
 * Knoten vollständig auf die vereinbarte Untergrenze zurückgefahren werden
 * müssen. Wie viel davon die einzelne Anlage trägt, entscheidet erst das
 * Zugangsprinzip.
 */
export function engpasstiefe(
  angebot: FcaAngebot,
  annahmen: Annahmen,
  zone: Regelzone,
  jahr: Wetterjahr,
  stress = 1,
): Reihe {
  const aus = new Float32Array(STUNDEN);

  if (angebot.archetyp === "statisch_kappung" || angebot.archetyp === "zeitfenster") {
    // Vertraglich festgelegte Grenzen, kein Netzzustand im Spiel.
    return aus;
  }

  const reihe: Referenzreihe = angebot.referenzreihe;
  const referenz = referenzprofil(reihe, zone, jahr);

  if (angebot.archetyp === "dynamisch_referenzanlage") {
    const schwelle = Math.min(0.98, Math.max(0.01, angebot.schwellwert / stress));
    if (annahmen.engpasstiefe === "binaer") {
      for (let h = 0; h < STUNDEN; h++) aus[h] = referenz[h] > schwelle ? 1 : 0;
      return aus;
    }
    const spitze = referenzSpitze(reihe, zone, jahr);
    const spanne = Math.max(0.05, spitze - schwelle);
    for (let h = 0; h < STUNDEN; h++) {
      aus[h] = Math.min(1, Math.max(0, (referenz[h] - schwelle) / spanne));
    }
    return aus;
  }

  // volldynamisch: synthetisches Engpassprofil des Netzknotens.
  const anteil = Math.min(0.6, Math.max(0, (angebot.engpassHaeufigkeitProzent * stress) / 100));
  const anzahl = Math.round(anteil * STUNDEN);
  if (anzahl === 0) return aus;

  const k = Math.min(1, Math.max(0, angebot.engpassKorrelation));
  const zufall = rauschen(Math.round(angebot.engpassHaeufigkeitProzent * 1000) + jahr * 31 + 7);
  const zufallsreihe = new Float32Array(STUNDEN);
  for (let h = 0; h < STUNDEN; h++) zufallsreihe[h] = zufall();

  // Rang der regionalen Erzeugung, damit die Kopplung skaleninvariant ist.
  const rang = new Float32Array(STUNDEN);
  const sortiert = Array.from({ length: STUNDEN }, (_, h) => h).sort(
    (a, b) => referenz[a] - referenz[b],
  );
  sortiert.forEach((h, i) => {
    rang[h] = i / (STUNDEN - 1);
  });

  const bewertung = new Float32Array(STUNDEN);
  for (let h = 0; h < STUNDEN; h++) bewertung[h] = k * rang[h] + (1 - k) * zufallsreihe[h];

  const nachBewertung = Array.from({ length: STUNDEN }, (_, h) => h).sort(
    (a, b) => bewertung[b] - bewertung[a],
  );
  for (let i = 0; i < anzahl; i++) {
    // Die stärksten Engpassstunden treffen voll, die Randstunden schwächer.
    aus[nachBewertung[i]] = 1 - 0.6 * (i / anzahl);
  }
  return aus;
}

/**
 * Anteil der Kürzung, den diese Anlage aus der Engpasstiefe des Knotens
 * übernimmt. Das ist der oekonomisch schwerste Hebel im Vertrag.
 */
export function kuerzungsanteil(tiefe: number, angebot: FcaAngebot): number {
  if (tiefe <= 0) return 0;
  if (angebot.zugangsprinzip === "pro_rata") return tiefe;
  const n = Math.max(1, Math.round(angebot.anzahlImStack));
  const p = Math.min(n, Math.max(1, Math.round(angebot.positionImStack)));
  // Abgeregelt wird von hinten nach vorne, bis der Engpass gedeckt ist.
  return Math.min(1, Math.max(0, tiefe * n - (n - p)));
}
