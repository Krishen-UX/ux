import type {
  Annahmen,
  FcaAngebot,
  JahresLauf,
  Projekt,
  Reihe,
  Wetterjahr,
} from "@/lib/typen";
import { ARCHETYPEN } from "./archetypen";
import { bessDispatch } from "./dispatch";
import { engpasstiefe, kuerzungsanteil } from "./engpass";
import { STUNDEN, erzeugungsprofil, lastprofil, preisreihe } from "./profile";
import { wochentage } from "./kalender";
import { regelzoneVon } from "@/data/annahmen";

export interface LaufVorgaben {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  jahr: Wetterjahr;
  /** Verschaerfung des Engpasses fuer den P90-Lauf. */
  stress?: number;
}

/** Richtung, die das FCA einschraenkt. */
export const eingeschraenkteRichtung = (projekt: Projekt): "einspeisung" | "entnahme" =>
  projekt.typ === "industrielle_last" ? "entnahme" : "einspeisung";

/**
 * Ein Simulationsjahr in Stundenaufloesung.
 *
 * Gerechnet werden immer zwei Faelle nebeneinander: der feste Anschluss als
 * Referenz und derselbe Standort unter den Bedingungen des FCA. Die Differenz
 * ist der Verlust, den das Angebot verursacht. Die Kappung durch Ueberbauung
 * faellt in beiden Faellen an und wird getrennt ausgewiesen.
 */
export function simuliereJahr({
  projekt,
  angebot,
  annahmen,
  jahr,
  stress = 1,
}: LaufVorgaben): JahresLauf {
  const zone = regelzoneVon(projekt.bundesland);
  const preis = preisreihe(jahr);
  const tage = wochentage(jahr);
  const netz = projekt.netzanschlussLeistungMW;
  const richtung = eingeschraenkteRichtung(projekt);

  const tiefe = engpasstiefe(angebot, annahmen, zone, jahr, stress);
  const limitFn = ARCHETYPEN[angebot.archetyp];

  // Zulaessige Leistung in der eingeschraenkten Richtung.
  const limit: Reihe = new Float32Array(STUNDEN);
  for (let h = 0; h < STUNDEN; h++) {
    limit[h] = Math.max(
      0,
      Math.min(
        netz,
        limitFn({ h, netzanschlussMW: netz, angebot, kuerzungsanteil: kuerzungsanteil(tiefe[h], angebot), wochentag: tage[h] }),
      ),
    );
  }

  // Rampenbegrenzung: nach einer Kuerzung kann die Anlage nur mit dem
  // vereinbarten Gradienten zurueckkehren.
  const maxSprung =
    (angebot.leistungsgradientProzentProMin / 100) * 60 * projekt.installierteLeistungMW;
  const rampe = (reihe: Reihe): Reihe => {
    if (maxSprung >= projekt.installierteLeistungMW * 2) return reihe;
    for (let h = 1; h < STUNDEN; h++) {
      if (reihe[h] > reihe[h - 1] + maxSprung) reihe[h] = reihe[h - 1] + maxSprung;
    }
    return reihe;
  };

  // Die Blindleistungsauflage kostet Wirkleistung, unabhaengig von der Kappung.
  // Sie wird getrennt ausgewiesen und nicht als Abregelungsstunde gezaehlt.
  const verlust = angebot.blindleistungsAuflage
    ? 1 - annahmen.blindleistungVerlustProzent / 100
    : 1;

  const limitEinspeisung: Reihe = new Float32Array(STUNDEN);
  const limitEntnahme: Reihe = new Float32Array(STUNDEN);
  for (let h = 0; h < STUNDEN; h++) {
    limitEinspeisung[h] = richtung === "einspeisung" ? limit[h] : netz;
    limitEntnahme[h] = richtung === "entnahme" ? limit[h] : netz;
  }

  const verfuegbar: Reihe = new Float32Array(STUNDEN);
  let einspeisungReferenz: Reihe = new Float32Array(STUNDEN);
  let einspeisungFca: Reihe = new Float32Array(STUNDEN);
  let entnahmeReferenz: Reihe = new Float32Array(STUNDEN);
  let entnahmeFca: Reihe = new Float32Array(STUNDEN);

  if (projekt.typ === "pv_freiflaeche") {
    const profil = erzeugungsprofil("pv", zone, jahr);
    for (let h = 0; h < STUNDEN; h++) {
      const roh = profil[h] * projekt.installierteLeistungMW;
      const aus = annahmen.negativePreiseAbregeln && preis[h] < 0 ? 0 : roh;
      verfuegbar[h] = aus;
      einspeisungReferenz[h] = Math.min(aus, netz);
      einspeisungFca[h] = Math.min(aus, limitEinspeisung[h]);
    }
    einspeisungFca = rampe(einspeisungFca);
  } else if (projekt.typ === "industrielle_last") {
    const profil = lastprofil(projekt.lastprofil ?? "g3_durchlaufend", jahr);
    for (let h = 0; h < STUNDEN; h++) {
      const roh = profil[h] * projekt.installierteLeistungMW;
      verfuegbar[h] = roh;
      entnahmeReferenz[h] = Math.min(roh, netz);
      entnahmeFca[h] = Math.min(roh, limitEntnahme[h]);
    }
    entnahmeFca = rampe(entnahmeFca);
  } else {
    const leistung = Math.min(projekt.installierteLeistungMW, netz);
    const vorgaben = {
      kapazitaetMWh: projekt.speicherKapazitaetMWh ?? projekt.installierteLeistungMW * 2,
      wirkungsgrad: annahmen.wirkungsgradProzent / 100,
      maxZyklenProTag: annahmen.maxZyklenProTag,
      verschleissEurProMWh: annahmen.verschleissEurProMWh,
    };
    const voll = new Float32Array(STUNDEN).fill(leistung);
    const referenz = bessDispatch(preis, voll, voll, vorgaben);
    einspeisungReferenz = referenz.einspeisung;
    entnahmeReferenz = referenz.entnahme;
    verfuegbar.set(referenz.einspeisung);

    const spielraumEin = new Float32Array(STUNDEN);
    const spielraumEnt = new Float32Array(STUNDEN);
    for (let h = 0; h < STUNDEN; h++) {
      spielraumEin[h] = Math.min(leistung, limitEinspeisung[h]);
      spielraumEnt[h] = Math.min(leistung, limitEntnahme[h]);
    }
    const gefesselt = bessDispatch(preis, spielraumEin, spielraumEnt, vorgaben);
    einspeisungFca = rampe(gefesselt.einspeisung);
    entnahmeFca = gefesselt.entnahme;
  }

  // Kappung und Blindleistungsverlust getrennt halten.
  let blindleistungVerlustMWh = 0;
  let abregelungMWh = 0;
  let abregelungStunden = 0;
  if (richtung === "einspeisung") {
    for (let h = 0; h < STUNDEN; h++) {
      const nachKappung = einspeisungFca[h];
      if (nachKappung < einspeisungReferenz[h] - 1e-6) abregelungStunden++;
      abregelungMWh += einspeisungReferenz[h] - nachKappung;
      einspeisungFca[h] = nachKappung * verlust;
      blindleistungVerlustMWh += nachKappung - einspeisungFca[h];
    }
  } else {
    for (let h = 0; h < STUNDEN; h++) {
      if (entnahmeFca[h] < entnahmeReferenz[h] - 1e-6) abregelungStunden++;
      abregelungMWh += entnahmeReferenz[h] - entnahmeFca[h];
    }
  }

  // Kennzahlen.
  let einspeisungReferenzMWh = 0;
  let einspeisungFcaMWh = 0;
  let entnahmeReferenzMWh = 0;
  let entnahmeFcaMWh = 0;
  let ueberbauungMWh = 0;
  let erloesReferenzEur = 0;
  let erloesFcaEur = 0;

  const faktor = annahmen.marktwertfaktor;
  const ppa = annahmen.verguetung === "ppa";

  for (let h = 0; h < STUNDEN; h++) {
    einspeisungReferenzMWh += einspeisungReferenz[h];
    einspeisungFcaMWh += einspeisungFca[h];
    entnahmeReferenzMWh += entnahmeReferenz[h];
    entnahmeFcaMWh += entnahmeFca[h];

    ueberbauungMWh +=
      richtung === "einspeisung"
        ? Math.max(0, verfuegbar[h] - einspeisungReferenz[h])
        : Math.max(0, verfuegbar[h] - entnahmeReferenz[h]);

    if (projekt.typ === "industrielle_last") {
      erloesReferenzEur += entnahmeReferenz[h] * annahmen.wertProMWhEur;
      erloesFcaEur += entnahmeFca[h] * annahmen.wertProMWhEur;
    } else {
      // Der Vermarktungsabschlag gilt nur am Spotmarkt, der PPA-Preis ist netto.
      const p = ppa ? annahmen.ppaPreisEurProMWh : preis[h] * faktor;
      erloesReferenzEur += (einspeisungReferenz[h] - entnahmeReferenz[h]) * p;
      erloesFcaEur += (einspeisungFca[h] - entnahmeFca[h]) * p;
    }
  }

  if (projekt.typ === "bess") {
    erloesReferenzEur -= einspeisungReferenzMWh * annahmen.verschleissEurProMWh;
    erloesFcaEur -= einspeisungFcaMWh * annahmen.verschleissEurProMWh;
  }

  const bezug = richtung === "einspeisung" ? einspeisungReferenzMWh : entnahmeReferenzMWh;

  let entschaedigungEur = 0;
  if (angebot.entschaedigung === "teilweise") {
    entschaedigungEur = abregelungMWh * angebot.entschaedigungSatzEurProMWh;
  } else if (angebot.entschaedigung === "voll") {
    entschaedigungEur = Math.max(0, erloesReferenzEur - erloesFcaEur);
  }

  return {
    jahr,
    verfuegbar,
    einspeisungReferenz,
    einspeisungFca,
    entnahmeReferenz,
    entnahmeFca,
    limitEinspeisung,
    limitEntnahme,
    preis,
    einspeisungReferenzMWh,
    einspeisungFcaMWh,
    entnahmeReferenzMWh,
    entnahmeFcaMWh,
    abregelungMWh,
    abregelungProzent: bezug > 0 ? (abregelungMWh / bezug) * 100 : 0,
    abregelungStunden,
    ueberbauungMWh,
    blindleistungVerlustMWh,
    erloesReferenzEur,
    erloesFcaEur,
    entschaedigungEur,
  };
}
