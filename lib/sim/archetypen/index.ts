import type { FcaAngebot } from "@/lib/typen";
import { statischKappung } from "./statisch-kappung";
import { zeitfensterLimit } from "./zeitfenster";
import { dynamischReferenzanlage } from "./dynamisch-referenzanlage";
import { volldynamisch } from "./volldynamisch";

export interface LimitEingabe {
  h: number;
  netzanschlussMW: number;
  angebot: FcaAngebot;
  /** Kuerzungsanteil dieser Anlage in dieser Stunde, 0 bis 1. */
  kuerzungsanteil: number;
  /** Wochentag dieser Stunde, 0 = Montag. */
  wochentag: number;
}

/** Zulaessige Leistung in der eingeschraenkten Richtung, MW. */
export type LimitFunktion = (eingabe: LimitEingabe) => number;

export const ARCHETYPEN: Record<FcaAngebot["archetyp"], LimitFunktion> = {
  statisch_kappung: statischKappung,
  zeitfenster: zeitfensterLimit,
  dynamisch_referenzanlage: dynamischReferenzanlage,
  volldynamisch,
};

export const ARCHETYP_TEXT: Record<
  FcaAngebot["archetyp"],
  { titel: string; kurz: string; hinweis?: string }
> = {
  statisch_kappung: {
    titel: "Statische Kappung",
    kurz: "Feste Obergrenze rund um die Uhr, unabhaengig vom Netzzustand.",
    hinweis:
      "Referenzfall. Es gibt keine Wetterabhaengigkeit des Netzzustands, deshalb liegen P50 und P90 nur wegen der Erzeugung auseinander.",
  },
  zeitfenster: {
    titel: "Zeitfenster",
    kurz: "Obergrenze gilt nur in vereinbarten Wochentag- und Stundenfenstern.",
    hinweis:
      "Planbar, aber die Fenster sind meist zu breit geschnitten. Pruefen, wie viele Fensterstunden ueberhaupt Engpassstunden sind.",
  },
  dynamisch_referenzanlage: {
    titel: "Dynamisch nach Referenzanlage",
    kurz: "Die Kuerzung greift, sobald die Erzeugung der Referenz eine Schwelle ueberschreitet.",
    hinweis:
      "Der praxisrelevante Fall. Strittig ist regelmaessig, welche Referenz gilt: eine Anlage am selben Umspannwerk oder ein weiter entfernter Netzknoten. Beides fuehrt zu deutlich verschiedenen Abregelungsmengen.",
  },
  volldynamisch: {
    titel: "Volldynamisch",
    kurz: "Kuerzung nach dem tatsaechlichen Engpass am Netzknoten.",
    hinweis:
      "Ohne belastbares Engpassprofil des Netzbetreibers ist das eine Wette. Die Kopplung an die regionale Erzeugung entscheidet, ob die Abregelung die ertragreichsten Stunden trifft.",
  },
};
