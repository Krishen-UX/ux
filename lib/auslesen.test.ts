import { describe, expect, it } from "vitest";
import { auslesen, offeneAuslesungen, zaehle } from "./auslesen";
import { datenluecken } from "./datenluecken";
import { vorlage } from "./sim/probe";
import { BEISPIELE } from "@/data/beispiele";

describe("Auslesen", () => {
  it("liefert für jeden Anlagentyp eine vollstaendige Liste ohne Doppelte", () => {
    for (const typ of ["bess", "pv_freiflaeche", "industrielle_last"] as const) {
      const { projekt, angebot, alternative } = vorlage(typ);
      const liste = auslesen(projekt, angebot, alternative);
      expect(liste.length).toBeGreaterThan(8);
      expect(new Set(liste.map((a) => a.schluessel)).size).toBe(liste.length);
      // Jede belegte Angabe traegt eine Fundstelle, jede offene eine Begruendung.
      for (const a of liste) {
        if (a.sicherheit === "belegt") expect(a.beleg?.fundstelle).toBeTruthy();
        else expect(a.begruendung).toBeTruthy();
      }
    }
  });

  it("zeigt je Archetyp die Angaben, die dort ueberhaupt wirken", () => {
    const { projekt, angebot, alternative } = vorlage("pv_freiflaeche");
    const schluessel = (a: typeof angebot) =>
      auslesen(projekt, a, alternative).map((x) => x.schluessel);

    expect(schluessel({ ...angebot, archetyp: "zeitfenster" })).toContain("zeitfenster");
    expect(schluessel({ ...angebot, archetyp: "zeitfenster" })).not.toContain("schwellwert");
    expect(schluessel({ ...angebot, archetyp: "volldynamisch" })).toContain("engpass");
    expect(schluessel({ ...angebot, archetyp: "dynamisch_referenzanlage" })).toContain("schwellwert");
    expect(schluessel({ ...angebot, archetyp: "statisch_kappung" })).toContain("grenze");
    expect(schluessel({ ...angebot, archetyp: "statisch_kappung" })).not.toContain("engpass");
  });

  it("nennt die Position nur, wenn sie ueberhaupt wirkt", () => {
    const { projekt, angebot, alternative } = vorlage("bess");
    const hat = (a: typeof angebot) =>
      auslesen(projekt, a, alternative).some((x) => x.schluessel === "position");
    expect(hat({ ...angebot, archetyp: "dynamisch_referenzanlage", zugangsprinzip: "lifo" })).toBe(true);
    expect(hat({ ...angebot, archetyp: "dynamisch_referenzanlage", zugangsprinzip: "pro_rata" })).toBe(false);
    expect(hat({ ...angebot, archetyp: "statisch_kappung", zugangsprinzip: "lifo" })).toBe(false);
  });

  it("zitiert ohne Dokument nichts", () => {
    const { projekt, angebot, alternative } = vorlage("bess");
    const manuell = auslesen(projekt, angebot, alternative, "manuell");
    expect(manuell.some((a) => a.beleg)).toBe(false);
    expect(manuell.some((a) => a.sicherheit === "belegt")).toBe(false);
    // Was ohne Dokument offen ist, bleibt offen.
    const mitDokument = auslesen(projekt, angebot, alternative, "dokument");
    expect(offeneAuslesungen(manuell).map((a) => a.schluessel)).toEqual(
      offeneAuslesungen(mitDokument).map((a) => a.schluessel),
    );
  });

  it("haelt die Zaehlung mit der Liste zusammen", () => {
    const { projekt, angebot, alternative } = vorlage("bess");
    const liste = auslesen(projekt, angebot, alternative);
    const summe = zaehle(liste, "belegt") + zaehle(liste, "unsicher") + zaehle(liste, "fehlt");
    expect(summe).toBe(liste.length);
    expect(offeneAuslesungen(liste).length).toBe(
      zaehle(liste, "unsicher") + zaehle(liste, "fehlt"),
    );
  });

  it("laesst kein offenes Feld ohne Frage an den Netzbetreiber", () => {
    // Was im Pruefschritt offen bleibt, muss auf dem Faktenblatt als Frage stehen.
    const { projekt, angebot, alternative } = vorlage("bess");
    const offen = offeneAuslesungen(auslesen(projekt, angebot, alternative));
    const fragen = datenluecken(angebot, alternative, projekt);
    expect(offen.length).toBeGreaterThan(0);
    expect(fragen.length).toBeGreaterThan(0);
  });
});

describe("Beispieldokumente", () => {
  it("decken alle vier Archetypen ab und haben eindeutige Dateinamen", () => {
    const archetypen = BEISPIELE.map((b) => b.angebot.archetyp);
    expect(new Set(archetypen).size).toBe(4);
    expect(new Set(BEISPIELE.map((b) => b.dateiname)).size).toBe(BEISPIELE.length);
    expect(new Set(BEISPIELE.map((b) => b.id)).size).toBe(BEISPIELE.length);
  });

  it("ergibt mit jedem Beispiel eine rechenbare Auswertung", async () => {
    const { auswerten } = await import("./sim");
    for (const b of BEISPIELE) {
      const e = vorlage("bess");
      const angebot = { ...e.angebot, ...b.angebot };
      const alternative = { ...e.alternative, ...b.alternative };
      const a = auswerten({ ...e, angebot, alternative, mitSensitivitaet: true });
      expect(Number.isFinite(a.szenarien.C.npvEur)).toBe(true);
      expect(a.sensitivitaet.length).toBeGreaterThan(0);
    }
  });
});
