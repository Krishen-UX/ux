import type { Alternative, FcaAngebot, Projekt } from "@/lib/typen";

export interface Datenluecke {
  schluessel: string;
  angabe: string;
  frage: string;
  /** Kurz, warum die Angabe das Ergebnis bewegt. */
  wirkung: string;
}

/**
 * Angaben, die das Ergebnis tragen, aber nicht im Angebotsschreiben stehen.
 *
 * Nur die, die beim vorliegenden Archetyp überhaupt wirken. Die Liste ist
 * zugleich der Fragenkatalog für die Rückmeldung an den Netzbetreiber, deshalb
 * steht jede Angabe als ausformulierte Frage da.
 */
export function datenluecken(
  angebot: FcaAngebot,
  alternative: Alternative,
  projekt: Projekt,
): Datenluecke[] {
  const dynamisch =
    angebot.archetyp === "dynamisch_referenzanlage" || angebot.archetyp === "volldynamisch";
  const aus: Datenluecke[] = [];

  if (angebot.archetyp === "dynamisch_referenzanlage") {
    aus.push({
      schluessel: "referenz",
      angabe: "Referenzanlage",
      frage:
        "Welche Anlage oder welcher Netzknoten dient als Referenz, an welchem Umspannwerk hängt sie, und wie wird der Messwert gebildet?",
      wirkung:
        "Eine Referenz am selben Umspannwerk und eine weiter entfernte führen zu deutlich verschiedenen Abregelungsmengen.",
    });
  }

  if (angebot.archetyp === "volldynamisch") {
    aus.push({
      schluessel: "engpass",
      angabe: "Engpasshäufigkeit am Netzknoten",
      frage:
        "In wie vielen Stunden der letzten drei Jahre war der Netzknoten überlastet, und wie ist die Prognose für die Vertragslaufzeit?",
      wirkung:
        "Die angenommene Häufigkeit geht direkt in die Abregelungsmenge ein. Ohne Zahlen des Netzbetreibers ist sie geraten.",
    });
  }

  if (dynamisch && angebot.zugangsprinzip === "lifo") {
    aus.push({
      schluessel: "stack",
      angabe: "Position in der Anschlussreihenfolge",
      frage:
        "Wie viele flexible Anschlüsse hängen am selben Netzknoten, an welcher Stelle stehen wir, und wird die Position vertraglich festgeschrieben?",
      wirkung:
        "Zwischen erster und letzter Position liegt der grösste einzelne Unterschied im ganzen Vertrag.",
    });
  }

  if (alternative.festerAnschlussVerfuegbarAbJahr === null) {
    aus.push({
      schluessel: "termin",
      angabe: "Termin des Netzausbaus",
      frage:
        "Zu welchem Termin ist der Netzausbau geplant, ist der Termin verbindlich, und welche Rechtsfolge hat ein Verzug?",
      wirkung:
        "Ohne Termin lässt sich weder das Warten noch die Brückenlösung bewerten. Es bleibt nur der pessimistische Fall.",
    });
  } else if (alternative.festerAnschlussVerfuegbarAbJahr > angebot.laufzeitJahre) {
    aus.push({
      schluessel: "luecke",
      angabe: "Zeit zwischen Vertragsende und Netzausbau",
      frage: `Der Vertrag läuft ${angebot.laufzeitJahre} Jahre, der Netzausbau kommt im Jahr ${alternative.festerAnschlussVerfuegbarAbJahr}. Was gilt in den Jahren dazwischen, und zu welchen Bedingungen wird verlängert?`,
      wirkung:
        "In diesen Jahren ist vertraglich nichts geregelt. Fällt der Netzzugang weg, kostet das mehr als die gesamte Abregelung.",
    });
  }

  if (alternative.festerAnschlussBaukostenzuschussEur === null) {
    aus.push({
      schluessel: "bkz",
      angabe: "Baukostenzuschuss beim festen Anschluss",
      frage:
        "Was würde der Baukostenzuschuss betragen, wenn wir stattdessen auf einen festen Anschluss warten?",
      wirkung: "Ohne diese Zahl lässt sich das Warten nicht gegen das Angebot rechnen.",
    });
  }

  if (projekt.typ === "bess" && angebot.systemdienstleistungenEingeschraenkt) {
    aus.push({
      schluessel: "sdl",
      angabe: "Umfang der Sperre für Systemdienstleistungen",
      frage:
        "Welche Regelleistungsprodukte sind gesperrt, gilt die Sperre dauerhaft oder nur in Engpassstunden, und worauf stützt sie sich technisch?",
      wirkung:
        "Bei Batteriespeichern ist das häufig der teuerste Punkt des Vertrags, oft ohne Bezug zum Engpass.",
    });
  }

  return aus;
}
