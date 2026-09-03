import type { LimitEingabe } from "./index";

/**
 * Konstante Obergrenze rund um die Uhr. Dient als Referenzfall, das
 * Zugangsprinzip bleibt wirkungslos.
 */
export function statischKappung({ angebot, netzanschlussMW }: LimitEingabe): number {
  return Math.min(netzanschlussMW, angebot.maxEinspeiseleistungMW);
}
