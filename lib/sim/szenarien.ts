import type {
  Alternative,
  Annahmen,
  FcaAngebot,
  JahresLauf,
  Projekt,
  Szenario,
  SzenarioSchluessel,
} from "@/lib/typen";
import { amortisation, lcoe, npv } from "@/lib/finanz";

export interface SzenarioEingabe {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  alternative: Alternative;
  p50: JahresLauf;
  p90: JahresLauf;
}

/** Umstellungsjahr in Szenario C: frueher geht es nicht. */
export const umstellungsJahr = (angebot: FcaAngebot, alternative: Alternative): number =>
  Math.max(angebot.laufzeitJahre, alternative.festerAnschlussVerfuegbarAbJahr ?? angebot.laufzeitJahre);

interface Bausteine {
  investitionBasis: number;
  blindleistungCapex: number;
  opexJahr: number;
  sdlVollJahr: number;
  sdlFcaJahr: number;
  ertragFcaMWh: number;
  ertragReferenzMWh: number;
  erloesFca: number;
  erloesReferenz: number;
  degradation: number;
}

function bausteine(e: SzenarioEingabe, lauf: JahresLauf): Bausteine {
  const { projekt, angebot, annahmen } = e;
  const investitionBasis =
    projekt.capexProMW * projekt.installierteLeistungMW +
    (projekt.typ === "bess"
      ? (projekt.capexProMWhSpeicher ?? 0) * (projekt.speicherKapazitaetMWh ?? 0)
      : 0);
  const sdlVollJahr = annahmen.sdlErloesEurProMWJahr * projekt.installierteLeistungMW;
  const gemessen = projekt.typ === "industrielle_last";
  return {
    investitionBasis,
    blindleistungCapex: angebot.blindleistungsAuflage
      ? annahmen.blindleistungCapexEurProMW * projekt.installierteLeistungMW
      : 0,
    opexJahr: annahmen.opexProMWJahr * projekt.installierteLeistungMW,
    sdlVollJahr,
    sdlFcaJahr: angebot.systemdienstleistungenEingeschraenkt ? 0 : sdlVollJahr,
    ertragFcaMWh: gemessen ? lauf.entnahmeFcaMWh : lauf.einspeisungFcaMWh,
    ertragReferenzMWh: gemessen ? lauf.entnahmeReferenzMWh : lauf.einspeisungReferenzMWh,
    erloesFca: lauf.erloesFcaEur + lauf.entschaedigungEur,
    erloesReferenz: lauf.erloesReferenzEur,
    degradation: 1 - annahmen.degradationProzentProJahr / 100,
  };
}

interface Reihen {
  cashflows: number[];
  kosten: number[];
  mengen: number[];
  erloesJahr1: number;
  ertragJahr1: number;
}

/**
 * Zahlungsreihe eines Szenarios. Jahr 0 ist heute, der Betrieb laeuft ueber
 * die Betriebsjahre des Projekts ab dem jeweiligen Anschlussjahr.
 */
function reihen(
  e: SzenarioEingabe,
  b: Bausteine,
  optionen: {
    startJahr: number;
    bkzStart: number;
    mitFca: boolean;
    umstellung: number | null;
    nachzahlung: number;
    horizont: number;
  },
): Reihen {
  const { projekt } = e;
  const laenge = optionen.horizont + 1;
  const cashflows = new Array(laenge).fill(0);
  const kosten = new Array(laenge).fill(0);
  const mengen = new Array(laenge).fill(0);

  const bauJahr = Math.max(0, optionen.startJahr - 1);
  const invest = b.investitionBasis + (optionen.mitFca ? b.blindleistungCapex : 0) + optionen.bkzStart;
  cashflows[bauJahr] -= invest;
  kosten[bauJahr] += invest;

  let erloesJahr1 = 0;
  let ertragJahr1 = 0;

  for (let i = 0; i < projekt.betriebsjahre; i++) {
    const kalenderjahr = optionen.startJahr + i;
    if (kalenderjahr >= laenge) break;
    const alterung = Math.pow(b.degradation, i);
    const nachUmstellung = optionen.umstellung !== null && kalenderjahr >= optionen.umstellung;
    const unterFca = optionen.mitFca && !nachUmstellung;

    const erloes = unterFca ? b.erloesFca : b.erloesReferenz;
    const sdl = unterFca ? b.sdlFcaJahr : b.sdlVollJahr;
    const menge = unterFca ? b.ertragFcaMWh : b.ertragReferenzMWh;

    cashflows[kalenderjahr] += erloes * alterung + sdl - b.opexJahr;
    kosten[kalenderjahr] += b.opexJahr;
    mengen[kalenderjahr] += menge * alterung;
    if (i === 0) {
      erloesJahr1 = erloes * alterung + sdl - b.opexJahr;
      ertragJahr1 = menge * alterung;
    }
  }

  if (optionen.umstellung !== null && optionen.nachzahlung > 0) {
    const jahr = Math.min(laenge - 1, Math.max(0, optionen.umstellung - 1));
    cashflows[jahr] -= optionen.nachzahlung;
    kosten[jahr] += optionen.nachzahlung;
  }

  return { cashflows, kosten, mengen, erloesJahr1, ertragJahr1 };
}

export function baueSzenarien(e: SzenarioEingabe): {
  szenarien: Record<SzenarioSchluessel, Szenario>;
  gewinner: SzenarioSchluessel;
  vorsprungEur: number;
} {
  const { projekt, angebot, annahmen, alternative, p50, p90 } = e;
  const b = bausteine(e, p50);
  const b90 = bausteine(e, p90);
  const r = annahmen.diskontsatzProzent;
  const wartejahr = alternative.festerAnschlussVerfuegbarAbJahr;
  const umstellung = umstellungsJahr(angebot, alternative);
  const horizont = Math.max(
    projekt.betriebsjahre + 1,
    (wartejahr ?? 1) + projekt.betriebsjahre,
    umstellung + projekt.betriebsjahre,
  );
  const nachzahlung = Math.max(
    0,
    (alternative.festerAnschlussBaukostenzuschussEur ?? 0) - alternative.fcaBaukostenzuschussEur,
  );

  const gemessen = projekt.typ === "industrielle_last";

  const baue = (
    schluessel: SzenarioSchluessel,
    titel: string,
    kurz: string,
    optionen: Parameters<typeof reihen>[2],
    lauf: JahresLauf,
    verfuegbar = true,
    hinweis?: string,
  ): Szenario => {
    const basis = reihen(e, b, optionen);
    const stress = reihen(e, b90, optionen);
    const abregelung = optionen.mitFca ? lauf.abregelungProzent : 0;
    return {
      schluessel,
      titel,
      kurz,
      npvEur: npv(basis.cashflows, r),
      npvP90Eur: npv(stress.cashflows, r),
      investitionEur:
        b.investitionBasis + (optionen.mitFca ? b.blindleistungCapex : 0) + optionen.bkzStart,
      erloesJahr1Eur: basis.erloesJahr1,
      ertragJahr1MWh: basis.ertragJahr1,
      p50ErtragMWh: optionen.mitFca ? b.ertragFcaMWh : b.ertragReferenzMWh,
      p90ErtragMWh: optionen.mitFca ? b90.ertragFcaMWh : b90.ertragReferenzMWh,
      abregelungProzent: abregelung,
      abregelungStundenProJahr: optionen.mitFca ? lauf.abregelungStunden : 0,
      amortisationJahre: amortisation(basis.cashflows, r),
      lcoeEurProMWh: gemessen ? null : lcoe(basis.kosten, basis.mengen, r),
      startJahr: optionen.startJahr,
      cashflows: basis.cashflows,
      verfuegbar,
      hinweis,
    };
  };

  const a = baue(
    "A",
    "FCA dauerhaft",
    "Anschluss sofort, die Einschraenkung bleibt ueber die gesamte Betriebsdauer.",
    {
      startJahr: 1,
      bkzStart: alternative.fcaBaukostenzuschussEur,
      mitFca: true,
      umstellung: null,
      nachzahlung: 0,
      horizont,
    },
    p50,
  );

  const bVerfuegbar = wartejahr !== null && alternative.festerAnschlussBaukostenzuschussEur !== null;
  const bSzenario = baue(
    "B",
    "Auf festen Anschluss warten",
    bVerfuegbar
      ? `Kein Betrieb bis Jahr ${wartejahr}, danach ohne Einschraenkung.`
      : "Es liegt kein Termin fuer einen festen Anschluss vor.",
    {
      startJahr: Math.max(1, wartejahr ?? 1),
      bkzStart: alternative.festerAnschlussBaukostenzuschussEur ?? 0,
      mitFca: false,
      umstellung: null,
      nachzahlung: 0,
      horizont,
    },
    p50,
    bVerfuegbar,
    bVerfuegbar
      ? undefined
      : "Ohne zugesagten Termin ist das Warten nicht bewertbar. Termin und Baukostenzuschuss im Formular ergaenzen.",
  );

  const c = baue(
    "C",
    "FCA als Bruecke",
    `Anschluss sofort unter FCA, ab Jahr ${umstellung} fester Anschluss.`,
    {
      startJahr: 1,
      bkzStart: alternative.fcaBaukostenzuschussEur,
      mitFca: true,
      umstellung,
      nachzahlung,
      horizont,
    },
    p50,
  );

  const szenarien = { A: a, B: bSzenario, C: c } as Record<SzenarioSchluessel, Szenario>;
  const kandidaten = (["A", "B", "C"] as SzenarioSchluessel[])
    .filter((s) => szenarien[s].verfuegbar)
    .sort((x, y) => szenarien[y].npvEur - szenarien[x].npvEur);
  const gewinner = kandidaten[0];
  const vorsprungEur =
    kandidaten.length > 1 ? szenarien[gewinner].npvEur - szenarien[kandidaten[1]].npvEur : 0;

  return { szenarien, gewinner, vorsprungEur };
}
