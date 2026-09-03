import type { LimitEingabe } from "./index";

/**
 * Die zulässige Leistung wandert zwischen voller Anschlussleistung und der
 * vereinbarten Untergrenze, je nachdem wie tief der Engpass ist und welchen
 * Anteil daran das Zugangsprinzip dieser Anlage zuweist.
 */
export function dynamischReferenzanlage({
  angebot,
  netzanschlussMW,
  kuerzungsanteil,
}: LimitEingabe): number {
  const untergrenze = Math.min(netzanschlussMW, angebot.maxEinspeiseleistungMW);
  return netzanschlussMW - kuerzungsanteil * (netzanschlussMW - untergrenze);
}
