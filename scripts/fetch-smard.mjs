/**
 * ETL fuer die Zeitreihen des FCA Assessor.
 *
 * Zieht Ist-Erzeugung (PV, Wind onshore) je Regelzone sowie Day-Ahead-Preise
 * der Gebotszone DE/LU von SMARD (Bundesnetzagentur) und legt sie als
 * normierte Stundenprofile unter /data/profile ab.
 *
 * Aufruf:  NODE_USE_ENV_PROXY=1 node scripts/fetch-smard.mjs
 *
 * Quelle:  Bundesnetzagentur | SMARD.de
 * Lizenz:  CC BY 4.0
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASIS = "https://www.smard.de/app/chart_data";
const AUSGABE = path.join(process.cwd(), "data", "profile");

const FILTER = {
  pv: { id: 4068, label: "Photovoltaik, Ist-Erzeugung" },
  wind: { id: 4067, label: "Wind onshore, Ist-Erzeugung" },
  preis: { id: 4169, label: "Grosshandelspreis Day-Ahead DE/LU" },
};

const REGELZONEN = ["50Hertz", "TenneT", "Amprion", "TransnetBW"];
const JAHRE = [2023, 2024, 2025];

const STUNDEN = 8760;

/** Kleiner Pool, damit SMARD nicht mit 50 parallelen Requests belegt wird. */
async function poolMap(items, groesse, fn) {
  const ergebnis = new Array(items.length);
  let naechster = 0;
  const arbeiter = Array.from({ length: groesse }, async () => {
    for (;;) {
      const i = naechster++;
      if (i >= items.length) return;
      ergebnis[i] = await fn(items[i], i);
    }
  });
  await Promise.all(arbeiter);
  return ergebnis;
}

async function holeJson(url, versuche = 4) {
  for (let v = 0; v < versuche; v++) {
    try {
      const antwort = await fetch(url);
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      return await antwort.json();
    } catch (fehler) {
      if (v === versuche - 1) throw new Error(`${url}: ${fehler.message}`);
      await new Promise((r) => setTimeout(r, 500 * 2 ** v));
    }
  }
}

/** Jahreszahl eines UTC-Zeitstempels in Europe/Berlin. */
const berlinFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
});
const jahrVon = (ms) => Number(berlinFormat.format(new Date(ms)));

/** Monat, Tag und Stunde eines Zeitstempels in Europe/Berlin. */
const berlinTeile = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

const TAGE_IM_MONAT = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const TAGE_VOR_MONAT = TAGE_IM_MONAT.reduce(
  (a, d, i) => {
    a.push(a[i] + d);
    return a;
  },
  [0],
);

const CACHE = process.env.SMARD_CACHE ?? "";

async function holeReihe(filterId, region, jahr) {
  const cacheDatei = CACHE ? path.join(CACHE, `${filterId}_${region}_${jahr}.json`) : "";
  if (cacheDatei) {
    try {
      return JSON.parse(await readFile(cacheDatei, "utf8"));
    } catch {
      /* nicht im Cache */
    }
  }
  const index = await holeJson(`${BASIS}/${filterId}/${region}/index_hour.json`);
  // Wochendateien, die das Zieljahr beruehren koennen.
  const wochen = index.timestamps.filter((ts) => {
    const ende = ts + 8 * 24 * 3600 * 1000;
    return jahrVon(ts) <= jahr && jahrVon(ende) >= jahr;
  });
  const bloecke = await poolMap(wochen, 8, (ts) =>
    holeJson(`${BASIS}/${filterId}/${region}/${filterId}_${region}_hour_${ts}.json`),
  );
  const punkte = bloecke
    .flatMap((b) => b.series)
    .filter(([ts]) => jahrVon(ts) === jahr)
    .sort((a, b) => a[0] - b[0]);
  if (cacheDatei) {
    await mkdir(CACHE, { recursive: true });
    await writeFile(cacheDatei, JSON.stringify(punkte));
  }
  return punkte;
}

/**
 * Zeitstempelbehaftete Messwerte auf ein festes Raster von 8.760 Stunden legen.
 *
 * Das Raster ist ein Normaljahr aus 365 Tagen zu 24 Stunden Ortszeit. Damit
 * liegen Erzeugung, Preis und Last in derselben Stunde uebereinander, was fuer
 * die Bewertung der Abregelung entscheidend ist.
 *
 * - der 29. Februar entfaellt in Schaltjahren
 * - die doppelte Stunde der Rueckstellung auf Normalzeit wird gemittelt
 * - die fehlende Stunde der Umstellung auf Sommerzeit wird interpoliert
 * - Fehlwerte der Quelle werden ebenso interpoliert
 */
function aufRaster(punkte, name) {
  const summe = new Float64Array(STUNDEN);
  const anzahl = new Uint16Array(STUNDEN);

  for (const [ts, wert] of punkte) {
    if (wert === null || wert === undefined || Number.isNaN(wert)) continue;
    const teile = berlinTeile.formatToParts(new Date(ts));
    let monat = 0;
    let tag = 0;
    let stunde = 0;
    for (const t of teile) {
      if (t.type === "month") monat = Number(t.value);
      else if (t.type === "day") tag = Number(t.value);
      else if (t.type === "hour") stunde = Number(t.value);
    }
    if (monat === 2 && tag === 29) continue;
    const platz = (TAGE_VOR_MONAT[monat - 1] + tag - 1) * 24 + stunde;
    if (platz < 0 || platz >= STUNDEN) continue;
    summe[platz] += wert;
    anzahl[platz] += 1;
  }

  const werte = new Array(STUNDEN);
  let luecken = 0;
  for (let i = 0; i < STUNDEN; i++) {
    if (anzahl[i] === 0) {
      werte[i] = null;
      luecken++;
    } else {
      werte[i] = summe[i] / anzahl[i];
    }
  }
  if (luecken > 24) {
    throw new Error(`${name}: ${luecken} Stunden ohne Messwert, Reihe unvollstaendig`);
  }
  return { werte: lueckenFuellen(werte), luecken };
}

/** Fehlende Stunden linear ueberbruecken, Raender mit dem Nachbarwert. */
function lueckenFuellen(werte) {
  const w = werte.slice();
  let letzterGueltig = -1;
  for (let i = 0; i < w.length; i++) {
    if (w[i] === null) continue;
    if (letzterGueltig < 0) {
      for (let j = 0; j < i; j++) w[j] = w[i];
    } else if (i - letzterGueltig > 1) {
      const a = w[letzterGueltig];
      const b = w[i];
      for (let j = letzterGueltig + 1; j < i; j++) {
        w[j] = a + ((b - a) * (j - letzterGueltig)) / (i - letzterGueltig);
      }
    }
    letzterGueltig = i;
  }
  if (letzterGueltig < 0) throw new Error("Reihe enthaelt keinen gueltigen Wert");
  for (let j = letzterGueltig + 1; j < w.length; j++) w[j] = w[letzterGueltig];
  return w;
}

function perzentil(werte, p) {
  const s = werte.slice().sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
  return s[i];
}

/**
 * Zielwerte fuer die Kalibrierung der Einzelanlagenprofile.
 *
 * Die SMARD-Reihen sind Flottenzeitreihen einer ganzen Regelzone. Durch die
 * raeumliche Glaettung ueber hunderte Standorte ist ihr Verlauf flacher als der
 * einer einzelnen Anlage: die Flotte erreicht nie ihre Nennleistung, und die
 * Randstunden sind zu stark besetzt. Fuer die Bewertung einer Kappungsgrenze
 * ist genau die Verteilungsform entscheidend, deshalb wird das Flottenprofil
 * auf ein Einzelanlagenprofil umgerechnet.
 *
 * Transformation:  p[h] = faktor * ( flotte[h] / max(flotte) ) ^ gamma
 * gamma und faktor werden je Regelzone und Jahr so bestimmt, dass die
 * Spitzenleistung dem Zielwert entspricht und die Summe den
 * Vollbenutzungsstunden eines realen Standorts der Region.
 *
 * Die relative Abweichung der einzelnen Wetterjahre bleibt dabei erhalten, die
 * Zielvorgabe wirkt nur auf den Mittelwert der drei Jahre.
 */
const KALIBRIERUNG = {
  pv: {
    zielSpitze: 0.95, // Wechselrichter, AC-seitig
    zielVls: { "50Hertz": 1060, TenneT: 1040, Amprion: 1000, TransnetBW: 1120 },
    beleg: "Spezifischer Ertrag Freiflaechen-PV, Bandbreite 950 bis 1150 kWh/kWp im Jahr, regional gestaffelt",
  },
  wind: {
    zielSpitze: 0.98,
    zielVls: { "50Hertz": 2450, TenneT: 2500, Amprion: 2400, TransnetBW: 2150 },
    beleg: "Vollbenutzungsstunden moderner Onshore-Anlagen mit grossem Rotor, Bandbreite 2000 bis 2800 h im Jahr",
  },
};

/** gamma so bestimmen, dass zielSpitze * sum(s^gamma) = zielVls gilt. */
function findeGamma(s, zielSpitze, zielVls) {
  const zielSumme = zielVls / zielSpitze;
  const summe = (g) => s.reduce((a, v) => a + Math.pow(v, g), 0);
  let unten = 0.2;
  let oben = 6;
  if (summe(unten) < zielSumme) return unten;
  if (summe(oben) > zielSumme) return oben;
  for (let i = 0; i < 60; i++) {
    const mitte = (unten + oben) / 2;
    if (summe(mitte) > zielSumme) unten = mitte;
    else oben = mitte;
  }
  return (unten + oben) / 2;
}

const runde = (x, n) => Number(x.toFixed(n));

async function main() {
  await mkdir(AUSGABE, { recursive: true });

  const rohdaten = {};
  for (const art of ["pv", "wind"]) {
    rohdaten[art] = {};
    for (const region of REGELZONEN) {
      rohdaten[art][region] = {};
      for (const jahr of JAHRE) {
        const punkte = await holeReihe(FILTER[art].id, region, jahr);
        const { werte, luecken } = aufRaster(punkte, `${art} ${region} ${jahr}`);
        rohdaten[art][region][jahr] = werte;
        if (luecken > 0) console.log(`  ${art} ${region} ${jahr}: ${luecken} Stunden interpoliert`);
      }
    }
  }

  const flotte = {};
  const kalibrierung = {};
  for (const art of ["pv", "wind"]) {
    flotte[art] = {};
    kalibrierung[art] = {};
    for (const region of REGELZONEN) {
      flotte[art][region] = {};
      kalibrierung[art][region] = {};

      // Flottenprofil: je Jahr auf das eigene Maximum normiert. Damit faellt der
      // Zubau installierter Leistung heraus, uebrig bleibt reines Wetter.
      const normiert = {};
      for (const jahr of JAHRE) {
        const roh = rohdaten[art][region][jahr];
        const spitze = Math.max(...roh);
        normiert[jahr] = roh.map((v) => Math.min(1, Math.max(0, v / spitze)));
      }

      // Zielvollbenutzungsstunden je Jahr: Regionsvorgabe im Mittel, die
      // Streuung zwischen den Wetterjahren stammt aus den Messdaten.
      const summen = JAHRE.map((j) => normiert[j].reduce((a, b) => a + b, 0));
      const mittel = summen.reduce((a, b) => a + b, 0) / summen.length;
      const ziel = KALIBRIERUNG[art].zielVls[region];
      const zielSpitze = KALIBRIERUNG[art].zielSpitze;

      JAHRE.forEach((jahr, i) => {
        const zielVls = (ziel * summen[i]) / mittel;
        const gamma = findeGamma(normiert[jahr], zielSpitze, zielVls);
        const istSumme = normiert[jahr].reduce((a, v) => a + Math.pow(v, gamma), 0);
        const faktor = zielVls / istSumme;
        flotte[art][region][jahr] = normiert[jahr].map((v) => runde(v, 4));
        kalibrierung[art][region][jahr] = { gamma: runde(gamma, 4), faktor: runde(faktor, 5) };
        console.log(
          `${art} ${region} ${jahr}: Flotte ${Math.round(summen[i])} h, Einzelanlage ${Math.round(zielVls)} h, gamma ${gamma.toFixed(2)}, Spitze ${(faktor * 1).toFixed(2)}`,
        );
      });
    }
  }

  const preise = {};
  for (const jahr of JAHRE) {
    const punkte = await holeReihe(FILTER.preis.id, "DE", jahr);
    const { werte, luecken } = aufRaster(punkte, `preis ${jahr}`);
    const reihe = werte.map((v) => runde(v, 2));
    if (luecken > 0) console.log(`  preis ${jahr}: ${luecken} Stunden interpoliert`);
    preise[jahr] = reihe;
    const mittel = reihe.reduce((a, b) => a + b, 0) / reihe.length;
    const negativ = reihe.filter((v) => v < 0).length;
    console.log(`preis DE ${jahr}: Mittel ${mittel.toFixed(2)} EUR/MWh, ${negativ} Stunden negativ`);
  }

  const kopf = (label, einheit, extra = {}) => ({
    quelle: "Bundesnetzagentur | SMARD.de",
    quelleUrl: "https://www.smard.de/home/downloadcenter/download-marktdaten",
    lizenz: "CC BY 4.0",
    reihe: label,
    einheit,
    aufloesung: "1 h",
    jahre: JAHRE,
    abgerufenAm: new Date().toISOString().slice(0, 10),
    ...extra,
  });

  const verarbeitung = (art) => [
    "Wochendateien der SMARD-Chart-API je Regelzone zusammengefuegt",
    "Fehlwerte linear interpoliert",
    "auf ein festes Raster von 365 Tagen zu 24 Stunden Ortszeit gelegt, 29. Februar entfaellt, doppelte Stunde der Zeitumstellung gemittelt, fehlende interpoliert",
    "je Jahr und Regelzone auf das Jahresmaximum normiert, dadurch unabhaengig vom Zubau installierter Leistung",
    `Umrechnung Flotte zu Einzelanlage ueber p = faktor * flotte^gamma, kalibriert auf Spitzenleistung ${KALIBRIERUNG[art].zielSpitze} und ${KALIBRIERUNG[art].beleg}`,
    "die Umrechnung geschieht erst beim Laden im Browser, die Datei enthaelt das unveraenderte Flottenprofil",
  ];

  for (const art of ["pv", "wind"]) {
    await writeFile(
      path.join(AUSGABE, `${art}.json`),
      JSON.stringify({
        meta: kopf(FILTER[art].label, "Anteil der Spitzenleistung, 0 bis 1", {
          verarbeitung: verarbeitung(art),
          zielSpitze: KALIBRIERUNG[art].zielSpitze,
          zielVollbenutzungsstunden: KALIBRIERUNG[art].zielVls,
        }),
        kalibrierung: kalibrierung[art],
        regionen: flotte[art],
      }),
    );
  }

  await writeFile(
    path.join(AUSGABE, "preis.json"),
    JSON.stringify({
      meta: kopf(FILTER.preis.label, "EUR/MWh", {
        gebotszone: "DE/LU",
        verarbeitung: [
          "Wochendateien der SMARD-Chart-API zusammengefuegt",
          "Fehlwerte linear interpoliert",
          "auf ein festes Raster von 365 Tagen zu 24 Stunden Ortszeit gelegt, deckungsgleich mit den Erzeugungsreihen",
          "unveraendert in EUR/MWh, 2 Nachkommastellen, negative Preise bleiben erhalten",
        ],
      }),
      jahre: preise,
    }),
  );
  console.log("geschrieben nach", AUSGABE);
}
main().catch((f) => {
  console.error(f);
  process.exit(1);
});
