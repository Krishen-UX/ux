/** Datenmodell des FCA Assessor. */

/** Stundenreihe über ein Jahr, 8.760 Werte. */
export type Reihe = Float32Array<ArrayBufferLike>;

export type AnlagenTyp = "bess" | "pv_freiflaeche" | "industrielle_last";

export type Regelzone = "50Hertz" | "TenneT" | "Amprion" | "TransnetBW";

export type Wetterjahr = 2023 | 2024 | 2025;

export type Referenzreihe = "pv" | "wind";

export type LastprofilSchluessel = "g3_durchlaufend" | "prozesswaerme" | "ladeinfrastruktur_depot";

export interface Projekt {
  id: string;
  name: string;
  typ: AnlagenTyp;
  /** Anlagenseitige Leistung. Bei Überbauung größer als der Netzanschluss. */
  installierteLeistungMW: number;
  /** Nur BESS. */
  speicherKapazitaetMWh?: number;
  /** Fest vereinbarte Anschlusswirkleistung ohne FCA. */
  netzanschlussLeistungMW: number;
  bundesland: string;
  inbetriebnahmeJahr: number;
  capexProMW: number;
  /** Nur BESS, Energieteil der Investition. */
  capexProMWhSpeicher?: number;
  betriebsjahre: number;
  /** Nur industrielle Last. */
  lastprofil?: LastprofilSchluessel;
}

export type FcaArchetyp =
  | "statisch_kappung"
  | "zeitfenster"
  | "dynamisch_referenzanlage"
  | "volldynamisch";

export interface Zeitfenster {
  /** 0 = Montag bis 6 = Sonntag. */
  tage: number[];
  vonStunde: number;
  /** Ausschließlich. 22 bedeutet bis 21:59. */
  bisStunde: number;
  /** Zulässige Leistung innerhalb des Fensters. */
  limitMW: number;
}

export type Zugangsprinzip = "lifo" | "pro_rata";

export type Entschaedigungsart = "keine" | "teilweise" | "voll";

export interface FcaAngebot {
  archetyp: FcaArchetyp;
  maxEinspeiseleistungMW: number;
  maxEntnahmeleistungMW: number;
  zeitfenster: Zeitfenster[];
  /** Referenzgröße der dynamischen Regelung. */
  referenzreihe: Referenzreihe;
  /** Auslöseschwelle als Anteil der regionalen Spitzenerzeugung, 0 bis 1. */
  schwellwert: number;
  /** Nur volldynamisch: Anteil der Jahresstunden mit Engpass. */
  engpassHäufigkeitProzent: number;
  /** Nur volldynamisch: Kopplung des Engpasses an die regionale Erzeugung, 0 bis 1. */
  engpassKorrelation: number;
  zugangsprinzip: Zugangsprinzip;
  positionImStack: number;
  anzahlImStack: number;
  entschaedigung: Entschaedigungsart;
  entschaedigungSatzEurProMWh: number;
  leistungsgradientProzentProMin: number;
  blindleistungsAuflage: boolean;
  systemdienstleistungenEingeschraenkt: boolean;
  /** Jahre bis zum zugesagten Netzausbau. */
  laufzeitJahre: number;
}

export interface Alternative {
  festerAnschlussVerfuegbarAbJahr: number | null;
  festerAnschlussBaukostenzuschussEur: number | null;
  fcaBaukostenzuschussEur: number;
}

export interface Annahmen {
  diskontsatzProzent: number;
  opexProMWJahr: number;
  degradationProzentProJahr: number;

  /** Erlösmodell der Einspeisung. */
  verguetung: "markt" | "ppa";
  ppaPreisEurProMWh: number;
  /** Abschlag auf den Spotpreis für Vermarktung und Profilrisiko. */
  marktwertfaktor: number;
  /** PV faehrt in Stunden mit negativem Preis herunter. */
  negativePreiseAbregeln: boolean;

  /** BESS. */
  wirkungsgradProzent: number;
  maxZyklenProTag: number;
  verschleissEurProMWh: number;
  sdlErloesEurProMWJahr: number;

  /** Industrielle Last: Deckungsbeitrag je bezogener MWh. */
  wertProMWhEur: number;

  /** Auflagen. */
  blindleistungCapexEurProMW: number;
  blindleistungVerlustProzent: number;

  /** Verschärfung des Engpasses für den P90-Lauf. */
  engpassStressfaktorP90: number;
  /** Engpasstiefe bei der Referenzanlagenregelung. */
  engpasstiefe: "gleitend" | "binaer";
}

export interface JahresKennzahlen {
  jahr: Wetterjahr;
  /** Einspeisung mit festem Anschluss, nach Überbauungskappung. */
  einspeisungReferenzMWh: number;
  einspeisungFcaMWh: number;
  /** Entnahme, positiv. */
  entnahmeReferenzMWh: number;
  entnahmeFcaMWh: number;
  /** Verlust allein durch das FCA. */
  abregelungMWh: number;
  abregelungProzent: number;
  abregelungStunden: number;
  /** Verlust durch Überbauung, fällt auch beim festen Anschluss an. */
  ueberbauungMWh: number;
  /** Zusatzverlust aus der Blindleistungsauflage, unabhängig von der Kappung. */
  blindleistungVerlustMWh: number;
  erloesReferenzEur: number;
  erloesFcaEur: number;
  entschaedigungEur: number;
}

export interface JahresLauf extends JahresKennzahlen {
  verfuegbar: Reihe;
  einspeisungReferenz: Reihe;
  einspeisungFca: Reihe;
  entnahmeReferenz: Reihe;
  entnahmeFca: Reihe;
  limitEinspeisung: Reihe;
  limitEntnahme: Reihe;
  preis: Reihe;
}

export type SzenarioSchluessel = "A" | "B" | "C";

export interface Szenario {
  schluessel: SzenarioSchluessel;
  titel: string;
  kurz: string;
  npvEur: number;
  npvP90Eur: number;
  investitionEur: number;
  erloesJahr1Eur: number;
  ertragJahr1MWh: number;
  p50ErtragMWh: number;
  p90ErtragMWh: number;
  abregelungProzent: number;
  abregelungStundenProJahr: number;
  amortisationJahre: number | null;
  lcoeEurProMWh: number | null;
  /** Erstes Betriebsjahr, 1 = sofort. */
  startJahr: number;
  cashflows: number[];
  verfuegbar: boolean;
  hinweis?: string;
}

export interface SensitivitaetsPosten {
  schluessel: string;
  parameter: string;
  aenderung: string;
  deltaNpvEur: number;
  verhandlungspunkt: string;
}

export interface Auswertung {
  szenarien: Record<SzenarioSchluessel, Szenario>;
  gewinner: SzenarioSchluessel;
  vorsprungEur: number;
  laeufe: JahresLauf[];
  p50Lauf: JahresLauf;
  p90Lauf: JahresLauf;
  sensitivitaet: SensitivitaetsPosten[];
  hinweise: string[];
}
