import type { LimitEingabe } from "./index";

/**
 * Obergrenze gilt nur innerhalb der vereinbarten Fenster, sonst steht die
 * volle Anschlussleistung zur Verfuegung. Ueberlappende Fenster wirken
 * kumulativ, es gilt das jeweils schaerfste.
 */
export function zeitfensterLimit({ h, angebot, netzanschlussMW, wochentag }: LimitEingabe): number {
  const tag = wochentag;
  const stunde = h % 24;
  let limit = netzanschlussMW;
  for (const fenster of angebot.zeitfenster) {
    if (!fenster.tage.includes(tag)) continue;
    const innerhalb =
      fenster.vonStunde <= fenster.bisStunde
        ? stunde >= fenster.vonStunde && stunde < fenster.bisStunde
        : stunde >= fenster.vonStunde || stunde < fenster.bisStunde;
    if (innerhalb) limit = Math.min(limit, fenster.limitMW);
  }
  return limit;
}
