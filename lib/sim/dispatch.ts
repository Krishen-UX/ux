import type { Reihe } from "@/lib/typen";
import { STUNDEN } from "./profile";

export interface DispatchVorgaben {
  kapazitaetMWh: number;
  wirkungsgrad: number;
  maxZyklenProTag: number;
  verschleissEurProMWh: number;
}

export interface DispatchErgebnis {
  /** Entladung, MW je Stunde. */
  einspeisung: Reihe;
  /** Ladung, MW je Stunde. */
  entnahme: Reihe;
}

const TAGE = STUNDEN / 24;
const MAX_PAARE = 8;

/**
 * Arbitragefahrplan eines Batteriespeichers am Day-Ahead-Markt.
 *
 * Vereinfachtes Verfahren mit perfekter Voraussicht innerhalb des Kalendertags:
 * es werden nacheinander die lohnendsten Paare aus Ladestunde und spaeterer
 * Entladestunde belegt, bis kein Paar mehr die Verschleisskosten deckt oder das
 * Zyklenbudget erschoepft ist. Die stuendlichen Spielraeume kommen von aussen,
 * dadurch wird derselbe Fahrplan sowohl frei als auch unter den Grenzen eines
 * FCA gerechnet und der Speicher weicht der Kuerzung so weit aus wie moeglich.
 */
export function bessDispatch(
  preis: Reihe,
  spielraumEinspeisung: Reihe,
  spielraumEntnahme: Reihe,
  v: DispatchVorgaben,
): DispatchErgebnis {
  const einspeisung = new Float32Array(STUNDEN);
  const entnahme = new Float32Array(STUNDEN);
  const eta = v.wirkungsgrad;
  const budgetProTag = v.kapazitaetMWh * v.maxZyklenProTag;

  const restLaden = new Float64Array(24);
  const restEntladen = new Float64Array(24);

  for (let t = 0; t < TAGE; t++) {
    const basis = t * 24;
    let budgetAus = budgetProTag;
    for (let i = 0; i < 24; i++) {
      restLaden[i] = Math.max(0, spielraumEntnahme[basis + i]);
      restEntladen[i] = Math.max(0, spielraumEinspeisung[basis + i]);
    }

    for (let runde = 0; runde < MAX_PAARE && budgetAus > 1e-6; runde++) {
      let besterGewinn = 0;
      let bestesI = -1;
      let bestesJ = -1;
      for (let i = 0; i < 23; i++) {
        if (restLaden[i] <= 1e-6) continue;
        const pi = preis[basis + i];
        for (let j = i + 1; j < 24; j++) {
          if (restEntladen[j] <= 1e-6) continue;
          const gewinn = preis[basis + j] * eta - pi - v.verschleissEurProMWh * eta;
          if (gewinn > besterGewinn) {
            besterGewinn = gewinn;
            bestesI = i;
            bestesJ = j;
          }
        }
      }
      if (bestesI < 0) break;

      const mengeEin = Math.min(
        restLaden[bestesI],
        restEntladen[bestesJ] / eta,
        budgetAus / eta,
      );
      if (mengeEin <= 1e-6) break;
      restLaden[bestesI] -= mengeEin;
      restEntladen[bestesJ] -= mengeEin * eta;
      budgetAus -= mengeEin * eta;
      entnahme[basis + bestesI] += mengeEin;
      einspeisung[basis + bestesJ] += mengeEin * eta;
    }
  }

  return { einspeisung, entnahme };
}
