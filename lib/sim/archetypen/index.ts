import type { FcaAngebot } from "@/lib/typen";
import { statischKappung } from "./statisch-kappung";
import { zeitfensterLimit } from "./zeitfenster";
import { dynamischReferenzanlage } from "./dynamisch-referenzanlage";
import { volldynamisch } from "./volldynamisch";

export interface LimitEingabe {
  h: number;
  netzanschlussMW: number;
  angebot: FcaAngebot;
  /** Kürzungsanteil dieser Anlage in dieser Stunde, 0 bis 1. */
  kuerzungsanteil: number;
  /** Wochentag dieser Stunde, 0 = Montag. */
  wochentag: number;
}

/** Zulässige Leistung in der eingeschränkten Richtung, MW. */
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
    kurz: "Feste Obergrenze rund um die Uhr, unabhängig vom Netzzustand.",
    hinweis:
      "Referenzfall. Es gibt keine Wetterabhängigkeit des Netzzustands, deshalb liegen P50 und P90 nur wegen der Erzeugung auseinander.",
  },
  zeitfenster: {
    titel: "Zeitfenster",
    kurz: "Obergrenze gilt nur in vereinbarten Wochentag- und Stundenfenstern.",
    hinweis:
      "Planbar, aber die Fenster sind meist zu breit geschnitten. Prüfen, wie viele Fensterstunden überhaupt Engpassstunden sind.",
  },
  dynamisch_referenzanlage: {
    titel: "Dynamisch nach Referenzanlage",
    kurz: "Die Kürzung greift, sobald die Erzeugung der Referenz eine Schwelle überschreitet.",
    hinweis:
      "Der praxisrelevante Fall. Strittig ist regelmäßig, welche Referenz gilt: eine Anlage am selben Umspannwerk oder ein weiter entfernter Netzknoten. Beides führt zu deutlich verschiedenen Abregelungsmengen.",
  },
  volldynamisch: {
    titel: "Volldynamisch",
    kurz: "Kürzung nach dem tatsächlichen Engpass am Netzknoten.",
    hinweis:
      "Ohne belastbares Engpassprofil des Netzbetreibers ist das eine Wette. Die Kopplung an die regionale Erzeugung entscheidet, ob die Abregelung die ertragreichsten Stunden trifft.",
  },
};
