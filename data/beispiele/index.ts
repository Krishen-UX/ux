import type { Alternative, FcaAngebot } from "@/lib/typen";

/**
 * Erfundene Angebotsschreiben für die Dateiauswahl des Prototyps.
 *
 * Es gibt keine zugehörigen Dokumente. Jedes Beispiel steht für einen anderen
 * Archetyp, damit sich im Gespräch mehr als ein Vertragstyp zeigen lässt, ohne
 * dass jemand Werte von Hand setzen muss.
 */
export interface Beispieldokument {
  id: string;
  dateiname: string;
  netzbetreiber: string;
  eingegangen: string;
  seiten: number;
  groesseKb: number;
  kurz: string;
  angebot: Partial<FcaAngebot>;
  alternative: Partial<Alternative>;
}

export const BEISPIELE: Beispieldokument[] = [
  {
    id: "uw-nord",
    dateiname: "Netzanschlussangebot_UW-Nord.pdf",
    netzbetreiber: "Regionalnetz Nordost",
    eingegangen: "14. Juli 2026",
    seiten: 6,
    groesseKb: 412,
    kurz: "Kürzung nach der Windeinspeisung im Netzgebiet, Reihenfolge nach Anschlussdatum",
    angebot: {
      archetyp: "dynamisch_referenzanlage",
      referenzreihe: "wind",
      schwellwert: 0.55,
      zugangsprinzip: "lifo",
      positionImStack: 4,
      anzahlImStack: 5,
      entschaedigung: "keine",
      blindleistungsAuflage: true,
      systemdienstleistungenEingeschraenkt: true,
      laufzeitJahre: 6,
    },
    alternative: { festerAnschlussVerfuegbarAbJahr: 6 },
  },
  {
    id: "sperrfenster",
    dateiname: "Flexibler_Anschluss_Sperrfenster.pdf",
    netzbetreiber: "Stadtwerke Mittelstadt",
    eingegangen: "2. Juni 2026",
    seiten: 4,
    groesseKb: 268,
    kurz: "Feste Sperrfenster werktags, dafür planbar und ohne Reihenfolge",
    angebot: {
      archetyp: "zeitfenster",
      zeitfenster: [
        { tage: [0, 1, 2, 3, 4], vonStunde: 11, bisStunde: 15, limitMW: 15 },
        { tage: [0, 1, 2, 3, 4], vonStunde: 17, bisStunde: 20, limitMW: 20 },
      ],
      zugangsprinzip: "pro_rata",
      entschaedigung: "teilweise",
      entschaedigungSatzEurProMWh: 35,
      blindleistungsAuflage: false,
      systemdienstleistungenEingeschraenkt: false,
      laufzeitJahre: 8,
    },
    alternative: { festerAnschlussVerfuegbarAbJahr: 8 },
  },
  {
    id: "volldynamisch",
    dateiname: "NAV_Entwurf_volldynamisch.pdf",
    netzbetreiber: "Übertragungsnetz Süd",
    eingegangen: "29. August 2026",
    seiten: 11,
    groesseKb: 736,
    kurz: "Kürzung nach tatsächlicher Auslastung des Knotens, ohne Angabe zur Häufigkeit",
    angebot: {
      archetyp: "volldynamisch",
      engpassHaeufigkeitProzent: 11,
      engpassKorrelation: 0.85,
      zugangsprinzip: "lifo",
      positionImStack: 6,
      anzahlImStack: 7,
      entschaedigung: "keine",
      blindleistungsAuflage: true,
      systemdienstleistungenEingeschraenkt: true,
      laufzeitJahre: 4,
    },
    alternative: { festerAnschlussVerfuegbarAbJahr: 11 },
  },
  {
    id: "kappung",
    dateiname: "Kappungsvereinbarung_statisch.pdf",
    netzbetreiber: "Verteilnetz Westfalen",
    eingegangen: "8. Mai 2026",
    seiten: 3,
    groesseKb: 191,
    kurz: "Harte Obergrenze rund um die Uhr, dafür keine Unsicherheit über den Netzzustand",
    angebot: {
      archetyp: "statisch_kappung",
      zugangsprinzip: "pro_rata",
      entschaedigung: "keine",
      blindleistungsAuflage: false,
      systemdienstleistungenEingeschraenkt: false,
      laufzeitJahre: 10,
    },
    alternative: { festerAnschlussVerfuegbarAbJahr: 10 },
  },
];

export const zufaelligesBeispiel = (): Beispieldokument =>
  BEISPIELE[Math.floor(Math.random() * BEISPIELE.length)];
