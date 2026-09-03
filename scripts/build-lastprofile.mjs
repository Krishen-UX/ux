/**
 * Erzeugt normierte Stundenlastprofile fuer industrielle Anschlussnehmer.
 *
 * Grundlage sind die Strukturmerkmale der BDEW/VDEW-Standardlastprofile
 * (Gewerbe G, Tagestyp Werktag/Samstag/Sonntag, Jahreszeit Winter/Uebergang/
 * Sommer). Die Profile werden analytisch nachgebildet, nicht aus der
 * BDEW-Tabelle uebernommen, damit sie ohne Fremddatei reproduzierbar sind.
 *
 * Aufruf:  node scripts/build-lastprofile.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const AUSGABE = path.join(process.cwd(), "data", "profile");
const JAHRE = [2023, 2024, 2025];
const STUNDEN = 8760;

/**
 * Wochentag je Tag im Raster der Zeitreihen, 0 = Montag. Der 29. Februar
 * entfaellt, damit das Raster zu den SMARD-Reihen passt.
 */
function wochentagRaster(jahr) {
  const aus = new Uint8Array(365);
  const datum = new Date(Date.UTC(jahr, 0, 1));
  let tag = 0;
  while (tag < 365) {
    if (!(datum.getUTCMonth() === 1 && datum.getUTCDate() === 29)) {
      aus[tag++] = (datum.getUTCDay() + 6) % 7;
    }
    datum.setUTCDate(datum.getUTCDate() + 1);
  }
  return aus;
}

/** Jahreszeit nach BDEW: Winter, Uebergang, Sommer. */
function jahreszeit(tagImJahr) {
  // Winter 1.11. bis 20.3., Sommer 15.5. bis 14.9., sonst Uebergang.
  if (tagImJahr < 79 || tagImJahr >= 304) return "winter";
  if (tagImJahr >= 134 && tagImJahr < 257) return "sommer";
  return "uebergang";
}

const PROFILE = {
  g3_durchlaufend: {
    label: "Gewerbe durchlaufend, dreischichtig",
    beschreibung:
      "Flaches Profil mit leichter Tagesanhebung, geringe Wochenendabsenkung. Nachbildung von BDEW G3.",
    // Stundenfaktoren Werktag, 0 bis 23.
    werktag: [
      0.72, 0.7, 0.69, 0.69, 0.7, 0.74, 0.82, 0.9, 0.96, 0.99, 1.0, 1.0, 0.97, 0.99, 1.0, 0.99,
      0.96, 0.92, 0.88, 0.85, 0.83, 0.8, 0.77, 0.74,
    ],
    samstagFaktor: 0.88,
    sonntagFaktor: 0.8,
    saison: { winter: 1.05, uebergang: 1.0, sommer: 0.94 },
  },
  prozesswaerme: {
    label: "Elektrifizierte Prozesswaerme",
    beschreibung:
      "Dreischichtbetrieb mit ausgepraegter Winterlast, typisch fuer Hochtemperatur- oder Trocknungsprozesse mit Waermebedarf.",
    werktag: [
      0.88, 0.87, 0.86, 0.86, 0.88, 0.93, 0.98, 1.0, 1.0, 0.99, 0.98, 0.97, 0.95, 0.96, 0.98, 0.99,
      1.0, 0.99, 0.97, 0.95, 0.93, 0.92, 0.9, 0.89,
    ],
    samstagFaktor: 0.82,
    sonntagFaktor: 0.62,
    saison: { winter: 1.14, uebergang: 1.0, sommer: 0.82 },
  },
  ladeinfrastruktur_depot: {
    label: "Ladeinfrastruktur Depot",
    beschreibung:
      "Nutzfahrzeugdepot mit Nachtladung nach Schichtende und kurzer Zwischenladung am Mittag.",
    werktag: [
      0.95, 1.0, 1.0, 0.98, 0.9, 0.7, 0.4, 0.2, 0.14, 0.12, 0.12, 0.18, 0.32, 0.34, 0.26, 0.16,
      0.14, 0.18, 0.34, 0.6, 0.82, 0.92, 0.96, 0.98,
    ],
    samstagFaktor: 0.6,
    sonntagFaktor: 0.35,
    saison: { winter: 1.08, uebergang: 1.0, sommer: 0.95 },
  },
};

/** Deterministisches Rauschen, damit die Tage nicht identisch sind. */
function rauschen(saat) {
  let x = saat >>> 0;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

function baue(profil, jahr) {
  const zufall = rauschen(jahr * 7919 + 13);
  const tage = wochentagRaster(jahr);
  const werte = new Array(STUNDEN);
  for (let h = 0; h < STUNDEN; h++) {
    const tagImJahr = Math.floor(h / 24);
    const stunde = h % 24;
    const wochentag = tage[tagImJahr];
    let v = profil.werktag[stunde];
    if (wochentag === 5) v *= profil.samstagFaktor;
    else if (wochentag === 6) v *= profil.sonntagFaktor;
    v *= profil.saison[jahreszeit(tagImJahr)];
    v *= 0.97 + 0.06 * zufall(); // Tagesschwankung plus minus 3 Prozent
    werte[h] = v;
  }
  // Auf Spitzenlast 1,0 normieren.
  const spitze = Math.max(...werte);
  return werte.map((v) => Number((v / spitze).toFixed(4)));
}

async function main() {
  await mkdir(AUSGABE, { recursive: true });
  const profile = {};
  for (const [schluessel, def] of Object.entries(PROFILE)) {
    profile[schluessel] = { label: def.label, beschreibung: def.beschreibung, jahre: {} };
    for (const jahr of JAHRE) {
      const reihe = baue(def, jahr);
      profile[schluessel].jahre[jahr] = reihe;
      const vls = Math.round(reihe.reduce((a, b) => a + b, 0));
      console.log(`${schluessel} ${jahr}: ${vls} Benutzungsstunden`);
    }
  }
  await writeFile(
    path.join(AUSGABE, "last.json"),
    JSON.stringify({
      meta: {
        quelle: "Eigene Nachbildung der Strukturmerkmale der BDEW/VDEW-Standardlastprofile",
        quelleUrl: "https://www.bdew.de/energie/standardlastprofile-strom/",
        lizenz: "eigene Erzeugung, frei verwendbar",
        reihe: "Normierte Lastprofile Industrie und Gewerbe",
        einheit: "Anteil der Spitzenlast, 0 bis 1",
        aufloesung: "1 h",
        jahre: JAHRE,
        abgerufenAm: new Date().toISOString().slice(0, 10),
        verarbeitung: [
          "Stundenfaktoren je Tagestyp analytisch gesetzt, angelehnt an BDEW-Gewerbeprofile",
          "Tagestyp aus dem tatsaechlichen Wochentag des jeweiligen Kalenderjahrs im 365-Tage-Raster ohne 29. Februar, dadurch deckungsgleich mit den SMARD-Reihen",
          "Jahreszeitfaktoren Winter, Uebergang, Sommer nach BDEW-Zeitraeumen",
          "deterministische Tagesschwankung von plus minus 3 Prozent",
          "auf Spitzenlast 1,0 normiert",
          "Feiertage sind nicht abgebildet",
        ],
      },
      profile,
    }),
  );
  console.log("geschrieben nach", AUSGABE);
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
