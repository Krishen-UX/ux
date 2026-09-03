import type { LimitEingabe } from "./index";

/**
 * Wie die Referenzanlagenregelung, die Engpasstiefe stammt aber aus dem
 * hinterlegten Engpassprofil des Netzknotens statt aus einer Schwelle.
 */
export function volldynamisch({
  angebot,
  netzanschlussMW,
  kuerzungsanteil,
}: LimitEingabe): number {
  const untergrenze = Math.min(netzanschlussMW, angebot.maxEinspeiseleistungMW);
  return netzanschlussMW - kuerzungsanteil * (netzanschlussMW - untergrenze);
}
