import type {
  Alternative,
  Annahmen,
  FcaAngebot,
  Projekt,
  SensitivitaetsPosten,
  SzenarioSchluessel,
} from "@/lib/typen";
import { simuliereJahr } from "./kern";
import { baueSzenarien } from "./szenarien";
import type { Wetterjahr } from "@/lib/typen";

interface Variante {
  schluessel: string;
  parameter: string;
  aenderung: string;
  verhandlungspunkt: string;
  /** Faellt weg, wenn der Parameter im vorliegenden Angebot keine Rolle spielt. */
  greift: (angebot: FcaAngebot, projekt: Projekt) => boolean;
  anwenden: (angebot: FcaAngebot, alternative: Alternative, projekt: Projekt) => void;
}

const dynamisch = (a: FcaAngebot) =>
  a.archetyp === "dynamisch_referenzanlage" || a.archetyp === "volldynamisch";

export const VARIANTEN: Variante[] = [
  {
    schluessel: "position",
    parameter: "Position in der Anschlussreihenfolge",
    aenderung: "zwei Plaetze weiter vorn",
    verhandlungspunkt:
      "Position im LIFO-Stack festschreiben und um mindestens zwei Plaetze verbessern, ersatzweise auf pro rata wechseln.",
    greift: (a) => dynamisch(a) && a.zugangsprinzip === "lifo" && a.positionImStack > 1,
    anwenden: (a) => {
      a.positionImStack = Math.max(1, a.positionImStack - 2);
    },
  },
  {
    schluessel: "zugang",
    parameter: "Zugangsprinzip",
    aenderung: "pro rata statt LIFO",
    verhandlungspunkt:
      "Gleichmaessige Verteilung der Kuerzung auf alle Teilnehmer am Knoten statt Reihenfolge nach Anschlussdatum.",
    greift: (a) => dynamisch(a) && a.zugangsprinzip === "lifo",
    anwenden: (a) => {
      a.zugangsprinzip = "pro_rata";
    },
  },
  {
    schluessel: "untergrenze",
    parameter: "Garantierte Mindestleistung",
    aenderung: "plus 25 Prozent der Anschlussleistung",
    verhandlungspunkt:
      "Hoehere garantierte Mindestleistung waehrend der Kuerzung, damit ein Sockelertrag bankfaehig bleibt.",
    greift: () => true,
    anwenden: (a, _alt, p) => {
      a.maxEinspeiseleistungMW = Math.min(
        p.netzanschlussLeistungMW,
        a.maxEinspeiseleistungMW + 0.25 * p.netzanschlussLeistungMW,
      );
      a.maxEntnahmeleistungMW = Math.min(
        p.netzanschlussLeistungMW,
        a.maxEntnahmeleistungMW + 0.25 * p.netzanschlussLeistungMW,
      );
      a.zeitfenster = a.zeitfenster.map((f) => ({
        ...f,
        limitMW: Math.min(p.netzanschlussLeistungMW, f.limitMW + 0.25 * p.netzanschlussLeistungMW),
      }));
    },
  },
  {
    schluessel: "ausloeser",
    parameter: "Ausloeser der Kuerzung",
    aenderung: "Schwelle zehn Punkte hoeher",
    verhandlungspunkt:
      "Ausloeseschwelle der Referenzanlage anheben und die Referenz vertraglich benennen, statt sie offen zu lassen.",
    greift: (a) => a.archetyp === "dynamisch_referenzanlage",
    anwenden: (a) => {
      a.schwellwert = Math.min(0.95, a.schwellwert + 0.1);
    },
  },
  {
    schluessel: "haeufigkeit",
    parameter: "Angenommene Engpasshaeufigkeit",
    aenderung: "drei Punkte niedriger",
    verhandlungspunkt:
      "Engpassprognose des Netzbetreibers offenlegen lassen und eine Obergrenze der Kuerzungsstunden vereinbaren.",
    greift: (a) => a.archetyp === "volldynamisch",
    anwenden: (a) => {
      a.engpassHaeufigkeitProzent = Math.max(0, a.engpassHaeufigkeitProzent - 3);
    },
  },
  {
    schluessel: "fenster",
    parameter: "Breite der Zeitfenster",
    aenderung: "zwei Stunden kuerzer",
    verhandlungspunkt:
      "Sperrfenster auf die tatsaechlichen Engpassstunden zuschneiden statt auf pauschale Tagesbloecke.",
    greift: (a) => a.archetyp === "zeitfenster" && a.zeitfenster.length > 0,
    anwenden: (a) => {
      a.zeitfenster = a.zeitfenster.map((f) => ({
        ...f,
        bisStunde: Math.max(f.vonStunde, f.bisStunde - 2),
      }));
    },
  },
  {
    schluessel: "kappung",
    parameter: "Hoehe der statischen Kappung",
    aenderung: "plus zehn Prozent",
    verhandlungspunkt: "Kappungsgrenze anheben, sie ist der einzige Hebel dieses Vertragstyps.",
    greift: (a) => a.archetyp === "statisch_kappung",
    anwenden: (a, _alt, p) => {
      a.maxEinspeiseleistungMW = Math.min(
        p.netzanschlussLeistungMW,
        a.maxEinspeiseleistungMW * 1.1,
      );
    },
  },
  {
    schluessel: "entschaedigung",
    parameter: "Entschaedigung",
    aenderung: "40 Euro je abgeregelter MWh",
    verhandlungspunkt:
      "Entschaedigung fuer abgeregelte Arbeit vereinbaren, mindestens fuer Kuerzungen oberhalb einer Freimenge.",
    greift: (a) => a.entschaedigung === "keine",
    anwenden: (a) => {
      a.entschaedigung = "teilweise";
      a.entschaedigungSatzEurProMWh = 40;
    },
  },
  {
    schluessel: "sdl",
    parameter: "Systemdienstleistungen",
    aenderung: "Einschraenkung entfaellt",
    verhandlungspunkt:
      "Teilnahme an Regelleistungsmaerkten freigeben, sie beruehrt den Engpass in der Regel nicht.",
    greift: (a, p) => a.systemdienstleistungenEingeschraenkt && p.typ === "bess",
    anwenden: (a) => {
      a.systemdienstleistungenEingeschraenkt = false;
    },
  },
  {
    schluessel: "blindleistung",
    parameter: "Blindleistungsauflage",
    aenderung: "entfaellt",
    verhandlungspunkt:
      "Blindleistungsbereitstellung gesondert verguetet oder gestrichen, statt sie in die Anschlussauflage zu schieben.",
    greift: (a) => a.blindleistungsAuflage,
    anwenden: (a) => {
      a.blindleistungsAuflage = false;
    },
  },
  {
    schluessel: "laufzeit",
    parameter: "Zeitpunkt des Netzausbaus",
    aenderung: "zwei Jahre frueher",
    verhandlungspunkt:
      "Verbindlichen Endtermin der Einschraenkung in den Vertrag aufnehmen, mit Rechtsfolge bei Verzug.",
    greift: (a) => a.laufzeitJahre > 2,
    anwenden: (a, alt) => {
      a.laufzeitJahre = Math.max(1, a.laufzeitJahre - 2);
      if (alt.festerAnschlussVerfuegbarAbJahr !== null) {
        alt.festerAnschlussVerfuegbarAbJahr = Math.max(
          1,
          alt.festerAnschlussVerfuegbarAbJahr - 2,
        );
      }
    },
  },
  {
    schluessel: "bkz",
    parameter: "Baukostenzuschuss FCA",
    aenderung: "25 Prozent niedriger",
    verhandlungspunkt:
      "Baukostenzuschuss an den tatsaechlich bereitgestellten Netzzugang koppeln, nicht an die volle Anschlussleistung.",
    greift: (_a, _p) => true,
    anwenden: (_a, alt) => {
      alt.fcaBaukostenzuschussEur *= 0.75;
    },
  },
];

export interface SensitivitaetsEingabe {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  alternative: Alternative;
  p50Jahr: Wetterjahr;
  p90Jahr: Wetterjahr;
  basisNpvEur: number;
  bezug: SzenarioSchluessel;
}

/** Kapitalwert des FCA-Szenarios unter einem geaenderten Angebot. */
function npvUnter(
  e: SensitivitaetsEingabe,
  angebot: FcaAngebot,
  alternative: Alternative,
): number {
  const gemeinsam = { projekt: e.projekt, angebot, annahmen: e.annahmen };
  const p50 = simuliereJahr({ ...gemeinsam, jahr: e.p50Jahr });
  const p90 = simuliereJahr({
    ...gemeinsam,
    jahr: e.p90Jahr,
    stress: e.annahmen.engpassStressfaktorP90,
  });
  const { szenarien } = baueSzenarien({ ...gemeinsam, alternative, p50, p90 });
  return szenarien[e.bezug].npvEur;
}

/**
 * Wirkung einzelner Vertragsparameter auf den Kapitalwert. Jede Variante wird
 * einzeln geaendert, alles andere bleibt gleich. Absteigend sortiert ist das
 * die Verhandlungsagenda.
 */
export function sensitivitaet(e: SensitivitaetsEingabe): SensitivitaetsPosten[] {
  const posten: SensitivitaetsPosten[] = [];
  for (const variante of VARIANTEN) {
    if (!variante.greift(e.angebot, e.projekt)) continue;
    const angebot: FcaAngebot = {
      ...e.angebot,
      zeitfenster: e.angebot.zeitfenster.map((f) => ({ ...f, tage: [...f.tage] })),
    };
    const alternative: Alternative = { ...e.alternative };
    variante.anwenden(angebot, alternative, e.projekt);
    const delta = npvUnter(e, angebot, alternative) - e.basisNpvEur;
    if (Math.abs(delta) < 1) continue;
    posten.push({
      schluessel: variante.schluessel,
      parameter: variante.parameter,
      aenderung: variante.aenderung,
      deltaNpvEur: delta,
      verhandlungspunkt: variante.verhandlungspunkt,
    });
  }
  return posten.sort((a, b) => Math.abs(b.deltaNpvEur) - Math.abs(a.deltaNpvEur));
}
