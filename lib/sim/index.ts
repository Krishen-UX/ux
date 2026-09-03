import type {
  Alternative,
  Annahmen,
  Auswertung,
  FcaAngebot,
  JahresLauf,
  Projekt,
  SzenarioSchluessel,
  Wetterjahr,
} from "@/lib/typen";
import { simuliereJahr } from "./kern";
import { WETTERJAHRE } from "./profile";
import { baueSzenarien, umstellungsJahr } from "./szenarien";
import { sensitivitaet } from "./sensitivitaet";

export * from "./kern";
export * from "./profile";
export * from "./szenarien";
export * from "./sensitivitaet";
export { engpasstiefe, kuerzungsanteil } from "./engpass";

export interface AuswertungsEingabe {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  alternative: Alternative;
  /** Sensitivitaet ist der teuerste Teil und wird beim Ziehen am Regler ausgelassen. */
  mitSensitivitaet?: boolean;
}

const ertragVon = (lauf: JahresLauf, projekt: Projekt) =>
  projekt.typ === "industrielle_last" ? lauf.entnahmeFcaMWh : lauf.einspeisungFcaMWh;

/**
 * Vollstaendige Auswertung eines Angebots: drei Wetterjahre, drei Szenarien,
 * Sensitivitaet der Vertragsparameter.
 */
export function auswerten(e: AuswertungsEingabe): Auswertung {
  const { projekt, angebot, annahmen, alternative } = e;
  const gemeinsam = { projekt, angebot, annahmen };

  const laeufe = WETTERJAHRE.map((jahr) => simuliereJahr({ ...gemeinsam, jahr }));
  const sortiert = [...laeufe].sort((a, b) => ertragVon(a, projekt) - ertragVon(b, projekt));
  const p50Lauf = sortiert[1];
  const schwaechstes = sortiert[0];
  const p90Lauf = simuliereJahr({
    ...gemeinsam,
    jahr: schwaechstes.jahr as Wetterjahr,
    stress: annahmen.engpassStressfaktorP90,
  });

  const { szenarien, gewinner, vorsprungEur } = baueSzenarien({
    ...gemeinsam,
    alternative,
    p50: p50Lauf,
    p90: p90Lauf,
  });

  const fcaBezug: SzenarioSchluessel =
    szenarien.C.npvEur >= szenarien.A.npvEur ? "C" : "A";

  const posten = e.mitSensitivitaet
    ? sensitivitaet({
        projekt,
        angebot,
        annahmen,
        alternative,
        p50Jahr: p50Lauf.jahr,
        p90Jahr: schwaechstes.jahr,
        basisNpvEur: szenarien[fcaBezug].npvEur,
        bezug: fcaBezug,
      })
    : [];

  return {
    szenarien,
    gewinner,
    vorsprungEur,
    laeufe,
    p50Lauf,
    p90Lauf,
    sensitivitaet: posten,
    hinweise: hinweiseZu(e, p50Lauf),
  };
}

function hinweiseZu(e: AuswertungsEingabe, lauf: JahresLauf): string[] {
  const { projekt, angebot, annahmen, alternative } = e;
  const hinweise: string[] = [];

  const maxSprung = (angebot.leistungsgradientProzentProMin / 100) * 60;
  if (maxSprung >= 2) {
    hinweise.push(
      `Der Leistungsgradient von ${angebot.leistungsgradientProzentProMin} Prozent je Minute entspricht ${Math.round(maxSprung * 100)} Prozent je Stunde und ist bei Stundenaufloesung wirkungslos. Erst unterhalb von etwa 1,7 Prozent je Minute wird er im Modell sichtbar.`,
    );
  }
  if (angebot.archetyp === "statisch_kappung" || angebot.archetyp === "zeitfenster") {
    hinweise.push(
      "Bei einer vertraglich fixierten Grenze haengt die Kuerzung nicht vom Netzzustand ab. Das Zugangsprinzip und der P90-Stressfaktor bleiben ohne Wirkung.",
    );
  }
  if (annahmen.engpasstiefe === "binaer" && angebot.zugangsprinzip === "lifo") {
    hinweise.push(
      "Bei binaerer Engpasstiefe trifft die Kuerzung alle Teilnehmer gleichzeitig, die Position in der Anschlussreihenfolge wirkt dann nicht. Fuer die Bewertung des LIFO-Prinzips die gleitende Engpasstiefe waehlen.",
    );
  }
  if (projekt.installierteLeistungMW > projekt.netzanschlussLeistungMW && lauf.ueberbauungMWh > 0) {
    hinweise.push(
      `Die Ueberbauung kostet unabhaengig vom FCA ${Math.round(lauf.ueberbauungMWh).toLocaleString("de-DE")} MWh im Jahr. Dieser Anteil faellt auch beim festen Anschluss an und ist in der Abregelung nicht enthalten.`,
    );
  }
  if (alternative.festerAnschlussVerfuegbarAbJahr === null) {
    hinweise.push(
      "Ohne Termin fuer den festen Anschluss ist Szenario B nicht bewertbar und Szenario C laeuft auf die FCA-Laufzeit.",
    );
  } else if (umstellungsJahr(angebot, alternative) > angebot.laufzeitJahre) {
    hinweise.push(
      `Der Netzausbau kommt spaeter als die FCA-Laufzeit. Szenario C stellt deshalb erst im Jahr ${umstellungsJahr(angebot, alternative)} um.`,
    );
  }
  return hinweise;
}
