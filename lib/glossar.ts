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
  archetyp:
    "Grundform des Angebots. Ein Netzbetreiberschreiben nennt sie nicht beim Namen, die Einordnung ist der erste Schritt der Bewertung. Sie entscheidet, welche Parameter überhaupt wirken.",
  grenzen:
    "Die Leistung, auf die der Netzbetreiber zurückfahren darf, und wodurch das ausgelöst wird. Bei den dynamischen Formen ist das nur die Untergrenze, wie oft sie erreicht wird, entscheidet der Netzzustand.",
  auflagen:
    "Pflichten neben der Leistungsbegrenzung. Sie kosten Geld, ohne dass eine einzige MWh abgeregelt wird, und werden bei der Bewertung eines Angebots regelmässig übersehen.",
  laufzeitBlock:
    "Wie lange der Vertrag läuft, wann der Netzausbau kommt und was beides kostet. Zwei verschiedene Termine, die regelmässig auseinanderfallen.",

  jahresdauerlinie:
    "Alle 8.760 Stunden des Jahres, absteigend nach Leistung sortiert. Links die stärksten Stunden, rechts die schwächsten. Die Fläche zwischen beiden Kurven ist genau die abgeregelte Arbeit.",
  wochenausschnitt:
    "Die Woche mit der grössten Abregelung, Stunde für Stunde. Die gestrichelte Linie ist die jeweils zulässige Leistung, die eingefärbte Fläche darüber der Verlust.",
  barwertverlauf:
    "Kumulierter Barwert je Jahr für alle drei Szenarien. Wo eine Linie die Nulllinie schneidet, ist die Investition zurückverdient.",
  tagesvorschau:
    "Was das Projekt an einem festen Anschluss über das Jahr leisten würde. Beim Speicher ist die Arbeit durch das Zyklenbudget nahezu konstant, dort steht deshalb der Erlös.",

  szenarioA:
    "Der pessimistische Fall: die Einschränkung bleibt über die gesamte Betriebsdauer bestehen, der Netzausbau kommt nie.",
  szenarioB:
    "Kein Betrieb bis zum Netzausbau, danach ohne Einschränkung. Die Wartejahre bringen keinen Erlös, und die Investition fällt später an.",
  szenarioC:
    "Anschluss sofort unter dem FCA, Wechsel auf den festen Anschluss mit dem Netzausbau. In der Praxis oft die richtige Antwort und selten gerechnet.",
  bandbreite:
    "Wie weit das Ergebnis zwischen einem mittleren und einem schlechten Jahr auseinanderliegt. Solange geschätzte Angaben im Spiel sind, ist die Bandbreite belastbarer als der einzelne Kapitalwert.",
  verhandlungsagenda:
    "Jede Zeile ändert genau einen Vertragsparameter und lässt alles andere gleich. Der Betrag ist die Wirkung auf den Kapitalwert, absteigend sortiert. Die oberste Zeile ist der teuerste Punkt des Angebots.",
  offenePunkte:
    "Angaben, die das Ergebnis tragen, aber nicht im Angebotsschreiben stehen. Die Liste steht auch auf dem Faktenblatt und lässt sich als Fragenkatalog an den Netzbetreiber zurückgeben.",

  investition:
    "Gesamte Anfangsinvestition ohne Baukostenzuschuss. Beim Speicher aus einem Leistungs- und einem Energieanteil.",
  betriebskosten:
    "Laufende Kosten je MW und Jahr: Wartung, Versicherung, Pacht, Direktvermarktung. Fallen unabhängig von der Abregelung an.",
  betriebsdauer:
    "Wirtschaftliche Nutzungsdauer. Bestimmt, über wie viele Jahre der Kapitalwert gerechnet wird.",
  inbetriebnahme:
    "Geplantes Jahr der Inbetriebnahme. Im Prototyp nur zur Einordnung, gerechnet wird immer ab Jahr 1.",
  wetterjahr:
    "Eines von drei hinterlegten Kalenderjahren mit echten Erzeugungs- und Preisreihen. Alle drei werden gerechnet, das mittlere trägt die Kapitalwerte.",
  erloesverlust:
    "Was die Einschränkung im ersten Betriebsjahr kostet, nach Abzug einer etwaigen Entschädigung. Am Spotmarkt liegt er unter dem Energieverlust, weil die Abregelung überwiegend Stunden mit niedrigen Preisen trifft.",
  betroffeneStunden:
    "Stunden im Jahr, in denen die Grenze überhaupt gegriffen hat. Sagt nichts über die Menge aus: wenige Stunden zur Mittagsspitze können teurer sein als viele in der Nacht.",
  anschlussjahr: "Erstes Betriebsjahr des Szenarios, gerechnet ab heute.",
  wirkungsgrad:
    "Anteil der geladenen Energie, der wieder eingespeist werden kann. Der Rest geht als Verlust im Umrichter und in der Zelle verloren.",
  verschleiss:
    "Kosten der Alterung je umgesetzter MWh. Wirkt wie eine Schwelle: Preisunterschiede darunter lohnen keinen Zyklus.",
  negativePreise:
    "Bei negativem Börsenpreis kostet Einspeisen Geld. Anlagen fahren dann herunter, was Arbeit kostet, aber Erlös schont.",
  marktwertfaktor:
    "Abschlag auf den Spotpreis für Direktvermarktung und Prognoserisiko. Die Kannibalisierung durch gleichzeitige Erzeugung steckt bereits im Stundenprofil und ist hier nicht enthalten.",
  ppa: "Fester Abnahmepreis über die Vertragsdauer statt stündlicher Börsenpreise. Nimmt das Preisrisiko heraus, aber auch die Chance auf hohe Stunden.",
  stressfaktor:
    "Faktor, um den der Engpass im P90-Lauf verschärft wird. Ersatz für eine Wahrscheinlichkeitsrechnung, die der Prototyp bewusst nicht macht.",

  vertragsluecke:
    "Zeitraum zwischen dem Ende der FCA-Laufzeit und der Fertigstellung des Netzausbaus. Vertraglich ist dort meist nichts geregelt.",
} as const;

export type Begriffsname = keyof typeof GLOSSAR;
