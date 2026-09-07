import type { Alternative, FcaAngebot, Projekt } from "@/lib/typen";
import { ARCHETYP_TEXT } from "@/lib/sim/archetypen";
import { WOCHENTAG_KURZ } from "@/lib/sim/kalender";
import { fmtEur, fmtMW, fmtProzent } from "@/lib/format";

/**
 * Wie gut eine Angabe belegt ist.
 *
 * belegt     die Stelle im Dokument ist eindeutig
 * vorbelegt  ohne Dokument gestartet, der Wert ist markttypisch gesetzt
 * unsicher   die Sache ist angesprochen, aber kein Wert genannt
 * fehlt      dazu sagt kein Angebot etwas
 */
export type Sicherheit = "belegt" | "vorbelegt" | "unsicher" | "fehlt";

export interface Beleg {
  zitat: string;
  fundstelle: string;
}

export interface Auslesung {
  schluessel: string;
  feld: string;
  /** Aufbereiteter Wert aus dem aktuellen Zustand, nicht aus dem Dokument. */
  wert: string;
  sicherheit: Sicherheit;
  beleg?: Beleg;
  /** Warum die Angabe unsicher ist oder fehlt. */
  begruendung?: string;
}

/**
 * Das Auslesen des Angebotsschreibens.
 *
 * Im Prototyp ist es simuliert: die Fundstellen sind hinterlegt, die Werte
 * kommen aus dem laufenden Zustand. Korrigiert der Nutzer eine Angabe, ändert
 * sich der Wert, die Fundstelle bleibt. Das genügt, um die Interaktion zu
 * prüfen, und ist in der Oberfläche als Simulation gekennzeichnet.
 */
export function auslesen(
  projekt: Projekt,
  angebot: FcaAngebot,
  alternative: Alternative,
  quelle: "dokument" | "manuell" = "dokument",
): Auslesung[] {
  const istLast = projekt.typ === "industrielle_last";
  const dynamisch =
    angebot.archetyp === "dynamisch_referenzanlage" || angebot.archetyp === "volldynamisch";
  const grenze = istLast ? angebot.maxEntnahmeleistungMW : angebot.maxEinspeiseleistungMW;
  const aus: Auslesung[] = [];

  aus.push({
    schluessel: "archetyp",
    feld: "Archetyp",
    wert: ARCHETYP_TEXT[angebot.archetyp].titel,
    sicherheit: "belegt",
    beleg: {
      zitat:
        angebot.archetyp === "statisch_kappung"
          ? "Die Einspeiseleistung ist dauerhaft auf den nachstehenden Wert begrenzt."
          : angebot.archetyp === "zeitfenster"
            ? "Innerhalb der nachstehenden Zeitfenster ist die Leistung zu begrenzen."
            : angebot.archetyp === "dynamisch_referenzanlage"
              ? "Eine Reduzierung erfolgt in Abhängigkeit der Einspeisung im vorgelagerten Netzgebiet."
              : "Eine Reduzierung erfolgt nach Massgabe der Auslastung des Netzverknüpfungspunktes.",
      fundstelle: "Seite 3, Ziffer 4.1",
    },
  });

  if (angebot.archetyp === "zeitfenster") {
    aus.push({
      schluessel: "zeitfenster",
      feld: "Sperrfenster",
      wert: angebot.zeitfenster
        .map(
          (f) =>
            `${f.tage.map((t) => WOCHENTAG_KURZ[t]).join("")} ${f.vonStunde} bis ${f.bisStunde} Uhr auf ${fmtMW(f.limitMW)}`,
        )
        .join("; "),
      sicherheit: "belegt",
      beleg: {
        zitat: "Die Begrenzung gilt werktags in den genannten Zeitfenstern.",
        fundstelle: "Seite 3, Ziffer 4.2",
      },
    });
  } else {
    aus.push({
      schluessel: "grenze",
      feld: istLast ? "Garantierte Entnahmeleistung" : "Garantierte Einspeiseleistung",
      wert: `${fmtMW(grenze)} von ${fmtMW(projekt.netzanschlussLeistungMW)}`,
      sicherheit: "belegt",
      beleg: {
        zitat: `Es stehen Ihnen mindestens ${fmtMW(grenze)} dauerhaft zur Verfügung.`,
        fundstelle: "Seite 3, Ziffer 4.3",
      },
    });
  }

  if (angebot.archetyp === "dynamisch_referenzanlage") {
    aus.push({
      schluessel: "referenzreihe",
      feld: "Referenzgrösse",
      wert: angebot.referenzreihe === "pv" ? "Photovoltaik der Regelzone" : "Wind onshore der Regelzone",
      sicherheit: "belegt",
      beleg: {
        zitat: `Massgeblich ist die ${angebot.referenzreihe === "pv" ? "Solareinspeisung" : "Windeinspeisung"} im vorgelagerten Netzgebiet.`,
        fundstelle: "Seite 3, Ziffer 4.1",
      },
    });
    aus.push({
      schluessel: "schwellwert",
      feld: "Auslöseschwelle der Kürzung",
      wert: `${Math.round(angebot.schwellwert * 100)} % der Regionsspitze`,
      sicherheit: "unsicher",
      beleg: {
        zitat: "sofern die Einspeisung im vorgelagerten Netzgebiet ein hohes Niveau erreicht",
        fundstelle: "Seite 3, Ziffer 4.2",
      },
      begruendung:
        "Ohne Zahlenwert im Vertrag rechnen wir mit einem markttypischen Wert. Die Schwelle entscheidet, wie oft die Kürzung überhaupt greift.",
    });
  }

  if (angebot.archetyp === "volldynamisch") {
    aus.push({
      schluessel: "engpass",
      feld: "Engpasshäufigkeit am Netzknoten",
      wert: `${fmtProzent(angebot.engpassHaeufigkeitProzent, 1)} der Jahresstunden`,
      sicherheit: "fehlt",
      begruendung:
        "Die Engpassprognose gehört dem Netzbetreiber und steht in keinem Angebot. Die Zahl geht unmittelbar in die Abregelungsmenge ein.",
    });
  }

  aus.push({
    schluessel: "zugangsprinzip",
    feld: "Zugangsprinzip",
    wert: angebot.zugangsprinzip === "lifo" ? "LIFO" : "Pro rata",
    sicherheit: "belegt",
    beleg: {
      zitat:
        angebot.zugangsprinzip === "lifo"
          ? "Die Reduzierung erfolgt in umgekehrter Reihenfolge des Anschlusszeitpunktes."
          : "Die Reduzierung erfolgt anteilig auf alle betroffenen Anlagen.",
      fundstelle: "Seite 4, Ziffer 5.2",
    },
  });

  if (dynamisch && angebot.zugangsprinzip === "lifo") {
    aus.push({
      schluessel: "position",
      feld: "Position in der Anschlussreihenfolge",
      wert: `${angebot.positionImStack} von ${angebot.anzahlImStack}`,
      sicherheit: "fehlt",
      begruendung:
        "Steht in keinem Angebot. Zwischen erster und letzter Position liegt der grösste einzelne Unterschied im ganzen Vertrag.",
    });
  }

  aus.push({
    schluessel: "entschaedigung",
    feld: "Entschädigung für abgeregelte Arbeit",
    wert:
      angebot.entschaedigung === "keine"
        ? "keine"
        : angebot.entschaedigung === "voll"
          ? "voller Ersatz des entgangenen Erlöses"
          : `${angebot.entschaedigungSatzEurProMWh} EUR/MWh`,
    sicherheit: "belegt",
    beleg: {
      zitat:
        angebot.entschaedigung === "keine"
          ? "Ein Anspruch auf Entschädigung für nicht eingespeiste Energie besteht nicht."
          : "Für die reduzierte Arbeit wird eine Entschädigung nach Massgabe der Anlage 2 gewährt.",
      fundstelle: "Seite 4, Ziffer 5.4",
    },
  });

  aus.push({
    schluessel: "gradient",
    feld: "Leistungsgradient",
    wert: `${angebot.leistungsgradientProzentProMin} % je Minute`,
    sicherheit: "belegt",
    beleg: {
      zitat: `Die Anlage hat Sollwertänderungen mit mindestens ${angebot.leistungsgradientProzentProMin} Prozent je Minute umzusetzen.`,
      fundstelle: "Seite 4, Ziffer 6.1",
    },
  });

  aus.push({
    schluessel: "blindleistung",
    feld: "Blindleistungsauflage",
    wert: angebot.blindleistungsAuflage ? "besteht" : "keine",
    sicherheit: "belegt",
    beleg: {
      zitat: angebot.blindleistungsAuflage
        ? "Blindleistung ist im Bereich cos phi 0,95 bereitzustellen."
        : "Eine gesonderte Blindleistungsauflage besteht nicht.",
      fundstelle: "Seite 4, Ziffer 6.3",
    },
  });

  if (projekt.typ === "bess") {
    aus.push({
      schluessel: "sdl",
      feld: "Systemdienstleistungen",
      wert: angebot.systemdienstleistungenEingeschraenkt ? "gesperrt" : "frei",
      sicherheit: "belegt",
      beleg: {
        zitat: angebot.systemdienstleistungenEingeschraenkt
          ? "Eine Teilnahme an Regelleistungsmärkten ist für die Dauer der Vereinbarung ausgeschlossen."
          : "Die Teilnahme an Regelleistungsmärkten bleibt unberührt.",
        fundstelle: "Seite 4, Ziffer 5.5",
      },
    });
  }

  aus.push({
    schluessel: "laufzeit",
    feld: "Vertragslaufzeit",
    wert: `${angebot.laufzeitJahre} Jahre`,
    sicherheit: "belegt",
    beleg: {
      zitat: `Die Vereinbarung wird auf ${angebot.laufzeitJahre} Jahre geschlossen.`,
      fundstelle: "Seite 5, Ziffer 7.1",
    },
  });

  aus.push({
    schluessel: "termin",
    feld: "Netzausbau fertig ab",
    wert:
      alternative.festerAnschlussVerfuegbarAbJahr === null
        ? "kein Termin"
        : `Jahr ${alternative.festerAnschlussVerfuegbarAbJahr}`,
    sicherheit: "unsicher",
    beleg: {
      zitat:
        "bis zum Abschluss der Netzverstärkungsmassnahme, ein verbindlicher Termin kann derzeit nicht genannt werden",
      fundstelle: "Seite 5, Ziffer 7.2",
    },
    begruendung:
      "Ohne Termin lässt sich das Warten nicht gegenrechnen, und die Jahre nach Vertragsende sind ungeregelt.",
  });

  aus.push({
    schluessel: "bkzFca",
    feld: "Baukostenzuschuss",
    wert: fmtEur(alternative.fcaBaukostenzuschussEur),
    sicherheit: "belegt",
    beleg: {
      zitat: `Der Baukostenzuschuss beträgt ${fmtEur(alternative.fcaBaukostenzuschussEur, false)}.`,
      fundstelle: "Seite 2, Ziffer 3.1",
    },
  });

  aus.push({
    schluessel: "bkzFest",
    feld: "Baukostenzuschuss bei festem Anschluss",
    wert:
      alternative.festerAnschlussBaukostenzuschussEur === null
        ? "unbekannt"
        : fmtEur(alternative.festerAnschlussBaukostenzuschussEur),
    sicherheit: "fehlt",
    begruendung:
      "Braucht ein zweites Angebot vom Netzbetreiber. Ohne die Zahl bleibt das Warten eine Schätzung.",
  });

  if (quelle === "manuell") {
    // Ohne Dokument gibt es nichts zu zitieren. Was sonst belegt waere, ist
    // hier schlicht vorbelegt.
    return aus.map((a) => {
      const ohneBeleg: Auslesung = { ...a, beleg: undefined };
      return a.sicherheit === "belegt" ? { ...ohneBeleg, sicherheit: "vorbelegt" } : ohneBeleg;
    });
  }
  return aus;
}

export const zaehle = (liste: Auslesung[], s: Sicherheit) =>
  liste.filter((a) => a.sicherheit === s).length;

/**
 * Was jemanden braucht. Vorbelegte Werte gehören nicht dazu: sie sind gesetzt,
 * nur eben nicht aus einem Dokument.
 */
export const offeneAuslesungen = (liste: Auslesung[]) =>
  liste.filter((a) => a.sicherheit === "unsicher" || a.sicherheit === "fehlt");
