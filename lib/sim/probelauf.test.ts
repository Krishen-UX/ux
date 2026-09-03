import { describe, it } from "vitest";
import { auswerten } from "./index";
import { vorlage } from "./probe";
import type { AnlagenTyp } from "@/lib/typen";

const eur = (x: number) => (x / 1e6).toFixed(2) + " Mio";

describe("Plausibilität", () => {
  it("liefert nachvollziehbare Kennzahlen je Anlagentyp", () => {
    for (const typ of ["pv_freiflaeche", "bess", "industrielle_last"] as AnlagenTyp[]) {
      const e = vorlage(typ);
      const t0 = performance.now();
      const a = auswerten({ ...e, mitSensitivitaet: true });
      const dauer = performance.now() - t0;
      const l = a.p50Lauf;
      const menge = typ === "industrielle_last" ? l.entnahmeFcaMWh : l.einspeisungFcaMWh;
      const ref = typ === "industrielle_last" ? l.entnahmeReferenzMWh : l.einspeisungReferenzMWh;
      console.log(
        `\n== ${typ} == (${dauer.toFixed(0)} ms, Jahr ${l.jahr})\n` +
          `  Referenz ${Math.round(ref)} MWh, FCA ${Math.round(menge)} MWh, ` +
          `Abregelung ${l.abregelungProzent.toFixed(1)} % in ${l.abregelungStunden} h, Ueberbauung ${Math.round(l.ueberbauungMWh)} MWh\n` +
          `  Erloes Referenz ${eur(l.erloesReferenzEur)}, FCA ${eur(l.erloesFcaEur)}\n` +
          `  NPV A ${eur(a.szenarien.A.npvEur)} | B ${eur(a.szenarien.B.npvEur)} | C ${eur(a.szenarien.C.npvEur)} -> ${a.gewinner}\n` +
          `  Amortisation A ${a.szenarien.A.amortisationJahre?.toFixed(1) ?? "-"} a, LCOE ${a.szenarien.A.lcoeEurProMWh?.toFixed(1) ?? "-"} EUR/MWh\n` +
          `  Sensitivitaet: ` +
          a.sensitivitaet
            .slice(0, 5)
            .map((s) => `${s.parameter} ${eur(s.deltaNpvEur)}`)
            .join(", "),
      );
    }
  });
});
