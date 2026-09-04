/**
 * Fachbegriffe und Abkürzungen, die in der Oberfläche vorkommen.
 *
 * Der Prototyp wird Menschen vorgelegt, die täglich mit Netzanschlüssen zu tun
 * haben, aber nicht zwingend mit Barwertrechnung, und umgekehrt. Jeder Begriff
 * aus der jeweils anderen Welt steht deshalb im Tooltip, nicht im Fließtext.
 */
export const GLOSSAR = {
  fca: "Flexible Connection Agreement, im deutschen Recht die flexible Netzanschlussvereinbarung nach Paragraf 17 Absatz 2b EnWG. Der Anschluss kommt früher, dafür darf der Netzbetreiber die Leistung in vereinbarten Fällen begrenzen.",
  abregelung:
    "Die Arbeit, die wegen der Begrenzung nicht eingespeist oder nicht bezogen werden konnte. Gemessen gegen den festen Anschluss, nicht gegen die installierte Leistung.",
  baukostenzuschuss:
    "Einmalige Zahlung an den Netzbetreiber für die Bereitstellung der Anschlusskapazität. Beim FCA meist deutlich niedriger als beim festen Anschluss, weil weniger Kapazität fest zugesagt wird.",
  zugangsprinzip:
    "Regel, nach der eine Kürzung am Netzknoten auf die Teilnehmer verteilt wird. Der grösste einzelne Hebel im Vertrag.",
  lifo: "Last in, first out. Wer zuletzt angeschlossen wurde, wird zuerst gekürzt. Die letzte Position im Stack trägt fast die gesamte Kürzung, die erste kaum etwas.",
  proRata:
    "Die Kürzung wird gleichmässig auf alle Teilnehmer am Netzknoten verteilt, unabhängig vom Anschlussdatum.",
  referenzanlage:
    "Anlage oder Netzknoten, an deren Erzeugung die Kürzung gekoppelt ist. Ob die Referenz am selben Umspannwerk hängt oder weiter entfernt liegt, ändert die Abregelungsmenge erheblich und ist regelmässig strittig.",
  engpasstiefe:
    "Wie stark der Netzknoten in einer Stunde überlastet ist, von 0 bis 1. Erst danach entscheidet das Zugangsprinzip, welchen Anteil davon diese Anlage trägt.",
  p50: "Der mittlere der drei hinterlegten Wetterjahre. Die Kapitalwerte beruhen auf diesem Jahr.",
  p90: "Näherung für den schlechten Fall: das schwächste der drei Wetterjahre mit verschärftem Engpass. Kein Monte Carlo, bewusst grob.",
  kapitalwert:
    "Barwert aller Ein- und Auszahlungen über die Betriebsdauer, abgezinst auf heute. Positiv bedeutet, das Projekt verdient mehr als den Kalkulationszins.",
  amortisation:
    "Jahr, in dem der kumulierte Barwert erstmals über null liegt, gerechnet ab heute. Bei Szenario B zählen die Wartejahre mit.",
  lcoe: "Vollkosten je erzeugter MWh über die Lebensdauer, diskontierte Kosten geteilt durch diskontierte Arbeit. Vergleichbar mit einem PPA-Preis.",
  vollbenutzungsstunden:
    "Jahresarbeit geteilt durch die Anschlussleistung. Ein Standort mit 1.000 Stunden liefert so viel, als liefe er 1.000 Stunden auf voller Leistung.",
  ueberbauung:
    "Anlagenleistung über der Anschlussleistung. Kostet auch beim festen Anschluss Arbeit und wird deshalb getrennt von der FCA-Abregelung ausgewiesen.",
  sdl: "Systemdienstleistungen, vor allem Regelleistung. Für Batteriespeicher oft die zweite Erlössäule neben der Arbitrage. Ein FCA sperrt sie manchmal mit, obwohl sie den Engpass nicht berührt.",
  blindleistung:
    "Auflage, Blindleistung bereitzustellen. Kostet zusätzliche Investition und einen kleinen Anteil Wirkleistung in jeder Betriebsstunde.",
  leistungsgradient:
    "Wie schnell die Anlage ihre Leistung ändern darf, in Prozent je Minute. Begrenzt vor allem die Rückkehr nach einer Kürzung.",
  regelzone:
    "Gebiet eines Übertragungsnetzbetreibers. Bestimmt hier, welches Erzeugungs- und Referenzprofil gilt: 50Hertz, TenneT, Amprion oder TransnetBW.",
  marktwert:
    "Durchschnittserlös je MWh bei Direktvermarktung am Spotmarkt. Liegt bei Photovoltaik unter dem Grundpreis, weil viel Erzeugung zur gleichen Zeit anfällt.",
  deckungsbeitrag:
    "Nutzen je bezogener MWh nach Abzug der Strombezugskosten, etwa die ersparten Kosten des ersetzten Systems.",
  degradation: "Jährlicher Rückgang von Ertrag oder nutzbarer Kapazität.",
  kalkulationszins:
    "Realer Zinssatz, mit dem künftige Zahlungen auf heute abgezinst werden. Höher heisst, spätere Erlöse zählen weniger.",
  zyklen:
    "Vollständige Lade- und Entladevorgänge je Tag. Begrenzt, wie viel Arbeit ein Speicher überhaupt umsetzen kann.",
  dayAhead:
    "Börsenpreis für Strom des Folgetags, stündlich, Gebotszone Deutschland und Luxemburg. Grundlage des Speicherfahrplans und der Vermarktungserlöse.",
  vertragsluecke:
    "Zeitraum zwischen dem Ende der FCA-Laufzeit und der Fertigstellung des Netzausbaus. Vertraglich ist dort meist nichts geregelt.",
} as const;

export type Begriffsname = keyof typeof GLOSSAR;
