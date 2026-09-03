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
  pv: { id: 4070, label: "Photovoltaik, Ist-Erzeugung" },
  wind: { id: 4069, label: "Wind onshore, Ist-Erzeugung" },
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

/** Lueckenhafte Messwerte linear ueberbruecken, Raender mit Nachbarwert. */
function lueckenFuellen(werte) {
  const w = werte.slice();
  let letzterGueltig = -1;
  for (let i = 0; i < w.length; i++) {
    if (w[i] === null || w[i] === undefined || Number.isNaN(w[i])) continue;
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

/**
 * Auf genau 8.760 Stunden bringen. Ein Kalenderjahr hat wegen der
 * Sommerzeitumstellung 8.759 oder 8.761 Stundenwerte, die Abweichung wird
 * linear ueber das Jahr verteilt statt an der Umstellungsstunde eingefuegt.
 */
function auf8760(werte) {
  if (werte.length === STUNDEN) return werte.slice();
  const aus = new Array(STUNDEN);
  const skala = (werte.length - 1) / (STUNDEN - 1);
  for (let i = 0; i < STUNDEN; i++) {
    const p = i * skala;
    const u = Math.floor(p);
    const o = Math.min(u + 1, werte.length - 1);
    aus[i] = werte[u] + (werte[o] - werte[u]) * (p - u);
  }
  return aus;
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
        rohdaten[art][region][jahr] = auf8760(lueckenFuellen(punkte.map(([, v]) => v)));
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
    const reihe = auf8760(lueckenFuellen(punkte.map(([, v]) => v))).map((v) => runde(v, 2));
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
    "auf genau 8.760 Stundenwerte je Kalenderjahr resampled, Sommerzeitumstellung dadurch geglaettet",
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
          "auf genau 8.760 Stundenwerte je Kalenderjahr resampled",
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
