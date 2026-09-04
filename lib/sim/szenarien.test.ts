import { describe, expect, it } from "vitest";
import { auswerten } from "./index";
import { luecke, umstellungsJahr } from "./szenarien";
import { vorlage } from "./probe";

describe("Laufzeit und Netzausbau", () => {
  it("stellt zum Netzausbau um, nicht zum Vertragsende", () => {
    const { angebot, alternative } = vorlage("pv_freiflaeche");
    angebot.laufzeitJahre = 5;
    alternative.festerAnschlussVerfuegbarAbJahr = 8;
    expect(umstellungsJahr(angebot, alternative)).toBe(8);

    // Bindet der Vertrag laenger als der Engpass besteht, endet die
    // Einschraenkung trotzdem mit dem Ausbau.
    angebot.laufzeitJahre = 12;
    alternative.festerAnschlussVerfuegbarAbJahr = 6;
    expect(umstellungsJahr(angebot, alternative)).toBe(6);
  });

  it("faellt ohne Termin auf die Vertragslaufzeit zurueck", () => {
    const { angebot, alternative } = vorlage("pv_freiflaeche");
    angebot.laufzeitJahre = 7;
    alternative.festerAnschlussVerfuegbarAbJahr = null;
    expect(umstellungsJahr(angebot, alternative)).toBe(7);
    expect(luecke(angebot, alternative)).toBeNull();
  });

  it("erkennt die Luecke zwischen Vertragsende und Netzausbau", () => {
    const { angebot, alternative } = vorlage("pv_freiflaeche");
    angebot.laufzeitJahre = 5;
    alternative.festerAnschlussVerfuegbarAbJahr = 8;
    expect(luecke(angebot, alternative)).toEqual({ von: 5, bis: 8 });

    angebot.laufzeitJahre = 9;
    expect(luecke(angebot, alternative)).toBeNull();
  });
});

describe("Annahme zur Vertragsluecke", () => {
  it("kostet Szenario C genau die Jahre ohne Netzzugang", () => {
    const e = vorlage("pv_freiflaeche");
    e.angebot.laufzeitJahre = 5;
    e.alternative.festerAnschlussVerfuegbarAbJahr = 8;

    const mitVerlaengerung = auswerten({ ...e, annahmen: { ...e.annahmen, nachLaufzeitende: "verlaengerung" } });
    const ohneZugang = auswerten({ ...e, annahmen: { ...e.annahmen, nachLaufzeitende: "kein_zugang" } });

    // Nur Szenario C haengt an der Annahme, A und B bleiben unberuehrt.
    expect(ohneZugang.szenarien.C.npvEur).toBeLessThan(mitVerlaengerung.szenarien.C.npvEur);
    expect(ohneZugang.szenarien.A.npvEur).toBeCloseTo(mitVerlaengerung.szenarien.A.npvEur, 6);
    expect(ohneZugang.szenarien.B.npvEur).toBeCloseTo(mitVerlaengerung.szenarien.B.npvEur, 6);
  });

  it("bleibt wirkungslos, wenn der Vertrag bis zum Ausbau laeuft", () => {
    const e = vorlage("pv_freiflaeche");
    e.angebot.laufzeitJahre = 8;
    e.alternative.festerAnschlussVerfuegbarAbJahr = 8;

    const a = auswerten({ ...e, annahmen: { ...e.annahmen, nachLaufzeitende: "verlaengerung" } });
    const b = auswerten({ ...e, annahmen: { ...e.annahmen, nachLaufzeitende: "kein_zugang" } });
    expect(b.szenarien.C.npvEur).toBeCloseTo(a.szenarien.C.npvEur, 6);
  });
});
