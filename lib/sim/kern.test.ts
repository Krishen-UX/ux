import { describe, expect, it } from "vitest";
import { simuliereJahr } from "./kern";
import { kuerzungsanteil } from "./engpass";
import { STUNDEN } from "./profile";
import { vorlage } from "./probe";
import type { FcaAngebot } from "@/lib/typen";

const summe = (r: Float32Array | number[]) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) s += r[i];
  return s;
};

describe("statische Kappung", () => {
  it("haelt die vereinbarte Obergrenze in jeder Stunde ein", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.archetyp = "statisch_kappung";
    angebot.maxEinspeiseleistungMW = 18;
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    for (let h = 0; h < STUNDEN; h++) {
      expect(lauf.einspeisungFca[h]).toBeLessThanOrEqual(18 + 1e-4);
    }
    expect(Math.max(...lauf.einspeisungFca)).toBeGreaterThan(17);
  });

  it("regelt nichts ab, wenn die Kappung über der Anschlussleistung liegt", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.archetyp = "statisch_kappung";
    angebot.maxEinspeiseleistungMW = projekt.netzanschlussLeistungMW * 2;
    angebot.blindleistungsAuflage = false;
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    expect(lauf.abregelungMWh).toBeCloseTo(0, 3);
    expect(lauf.abregelungProzent).toBeCloseTo(0, 6);
    expect(lauf.abregelungStunden).toBe(0);
  });

  it("regelt vollständig ab, wenn die Kappung null ist", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.archetyp = "statisch_kappung";
    angebot.maxEinspeiseleistungMW = 0;
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    expect(lauf.einspeisungFcaMWh).toBeCloseTo(0, 6);
    expect(lauf.abregelungProzent).toBeCloseTo(100, 6);
    expect(lauf.erloesFcaEur).toBeCloseTo(0, 6);
  });
});

describe("Zugangsprinzip", () => {
  const angebot = (aenderung: Partial<FcaAngebot>): FcaAngebot => ({
    ...vorlage("pv_freiflaeche").angebot,
    ...aenderung,
  });

  it("verteilt pro rata gleichmäßig", () => {
    const a = angebot({ zugangsprinzip: "pro_rata" });
    expect(kuerzungsanteil(0, a)).toBe(0);
    expect(kuerzungsanteil(0.4, a)).toBeCloseTo(0.4);
    expect(kuerzungsanteil(1, a)).toBeCloseTo(1);
  });

  it("kürzt bei LIFO von hinten nach vorn", () => {
    const bei = (position: number, tiefe: number) =>
      kuerzungsanteil(tiefe, angebot({ zugangsprinzip: "lifo", positionImStack: position, anzahlImStack: 5 }));
    // 40 Prozent Engpass entspricht zwei von fuenf Teilnehmern.
    expect(bei(5, 0.4)).toBeCloseTo(1);
    expect(bei(4, 0.4)).toBeCloseTo(1);
    expect(bei(3, 0.4)).toBeCloseTo(0);
    expect(bei(1, 0.4)).toBeCloseTo(0);
    // Der Grenzteilnehmer trägt den Rest.
    expect(bei(4, 0.3)).toBeCloseTo(0.5);
    // Bei vollem Engpass trifft es alle.
    expect(bei(1, 1)).toBeCloseTo(1);
  });

  it("summiert sich über den Stack auf dieselbe Menge wie pro rata", () => {
    for (const tiefe of [0.1, 0.25, 0.5, 0.73, 1]) {
      const n = 7;
      let lifo = 0;
      for (let p = 1; p <= n; p++) {
        lifo += kuerzungsanteil(tiefe, angebot({ zugangsprinzip: "lifo", positionImStack: p, anzahlImStack: n }));
      }
      expect(lifo).toBeCloseTo(tiefe * n, 6);
    }
  });

  it("spreizt die Abregelung zwischen erster und letzter Position deutlich", () => {
    const { projekt, annahmen } = vorlage("pv_freiflaeche");
    const bei = (position: number) =>
      simuliereJahr({
        projekt,
        angebot: angebot({
          archetyp: "dynamisch_referenzanlage",
          zugangsprinzip: "lifo",
          positionImStack: position,
          anzahlImStack: 5,
          schwellwert: 0.35,
          maxEinspeiseleistungMW: 0,
        }),
        annahmen,
        jahr: 2024,
      }).abregelungProzent;
    const vorn = bei(1);
    const hinten = bei(5);
    expect(hinten).toBeGreaterThan(vorn + 20);
    expect(vorn).toBeLessThan(30);
  });
});

describe("Energiebilanz", () => {
  it("schließt bei der PV-Freifläche", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.blindleistungsAuflage = false;
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2023 });
    // Verfügbar = eingespeist unter FCA + Abregelung durch FCA + Kappung durch Überbauung.
    expect(summe(lauf.verfuegbar)).toBeCloseTo(
      lauf.einspeisungFcaMWh + lauf.abregelungMWh + lauf.ueberbauungMWh,
      3,
    );
    expect(lauf.einspeisungReferenzMWh).toBeCloseTo(
      lauf.einspeisungFcaMWh + lauf.abregelungMWh,
      3,
    );
  });

  it("schließt bei der industriellen Last", () => {
    const { projekt, angebot, annahmen } = vorlage("industrielle_last");
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2023 });
    expect(lauf.entnahmeReferenzMWh).toBeCloseTo(lauf.entnahmeFcaMWh + lauf.abregelungMWh, 3);
    expect(lauf.einspeisungFcaMWh).toBe(0);
  });

  it("haelt beim Speicher den Wirkungsgrad ein", () => {
    const { projekt, angebot, annahmen } = vorlage("bess");
    angebot.blindleistungsAuflage = false;
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    const eta = annahmen.wirkungsgradProzent / 100;
    expect(lauf.einspeisungReferenzMWh).toBeCloseTo(lauf.entnahmeReferenzMWh * eta, 3);
    expect(lauf.einspeisungFcaMWh).toBeCloseTo(lauf.entnahmeFcaMWh * eta, 3);
    // Das Zyklenbudget wird nicht überschritten.
    const budget = (projekt.speicherKapazitaetMWh ?? 0) * annahmen.maxZyklenProTag * 365;
    expect(lauf.einspeisungReferenzMWh).toBeLessThanOrEqual(budget + 1);
  });
});

describe("Zeitfenster", () => {
  it("begrenzt nur innerhalb des Fensters", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.archetyp = "zeitfenster";
    angebot.blindleistungsAuflage = false;
    angebot.zeitfenster = [{ tage: [0, 1, 2, 3, 4, 5, 6], vonStunde: 11, bisStunde: 14, limitMW: 5 }];
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    for (let h = 0; h < STUNDEN; h++) {
      const stunde = h % 24;
      if (stunde >= 11 && stunde < 14) expect(lauf.limitEinspeisung[h]).toBeCloseTo(5, 4);
      else expect(lauf.limitEinspeisung[h]).toBeCloseTo(projekt.netzanschlussLeistungMW, 4);
    }
    expect(lauf.abregelungStunden).toBeGreaterThan(300);
    expect(lauf.abregelungStunden).toBeLessThan(3 * 365 + 1);
  });
});

describe("Entschädigung", () => {
  it("ersetzt bei voller Entschädigung den entgangenen Erlös", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.entschaedigung = "voll";
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    expect(lauf.erloesFcaEur + lauf.entschaedigungEur).toBeCloseTo(lauf.erloesReferenzEur, 3);
  });

  it("rechnet den Satz auf die abgeregelte Arbeit", () => {
    const { projekt, angebot, annahmen } = vorlage("pv_freiflaeche");
    angebot.entschaedigung = "teilweise";
    angebot.entschaedigungSatzEurProMWh = 40;
    const lauf = simuliereJahr({ projekt, angebot, annahmen, jahr: 2024 });
    expect(lauf.entschaedigungEur).toBeCloseTo(lauf.abregelungMWh * 40, 3);
  });
});
