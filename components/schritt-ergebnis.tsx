"use client";

import type { Alternative, Annahmen, Auswertung, FcaAngebot, Projekt } from "@/lib/typen";
import { fmtEur, fmtMWh, fmtProzent } from "@/lib/format";
import { ergebnisgroesse, jahresergebnis } from "@/lib/kennzahlen";
import { EmpfehlungsBanner } from "./empfehlung";
import { SzenarioKarten } from "./szenario-karten";
import { AnnahmenBlock } from "./annahmen-block";
import { DauerlinienDiagramm } from "./diagramme/dauerlinie";
import { WochenDiagramm } from "./diagramme/woche";
import { BarwertDiagramm } from "./diagramme/barwert";
import { SensitivitaetsBalken } from "./diagramme/sensitivitaet";
import { Kennzahl } from "./felder";
import { Karte } from "./karte";

export function SchrittErgebnis({
  projekt,
  angebot,
  annahmen,
  setAnnahmen,
  alternative,
  auswertung,
}: {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
  alternative: Alternative;
  auswertung: Auswertung;
}) {
  const p50 = auswertung.p50Lauf;
  const p90 = auswertung.p90Lauf;
  const groesse = ergebnisgroesse(projekt);
  const abstand =
    ((jahresergebnis(p50) - jahresergebnis(p90)) / Math.max(1, Math.abs(jahresergebnis(p50)))) * 100;
  const fcaSzenario =
    auswertung.szenarien.C.npvEur >= auswertung.szenarien.A.npvEur ? "C" : "A";

  return (
    <div className="space-y-4">
      <EmpfehlungsBanner auswertung={auswertung} projekt={projekt} />

      <SzenarioKarten auswertung={auswertung} projekt={projekt} />

      <div className="grid gap-3 lg:grid-cols-3">
        <Karte className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <DauerlinienDiagramm lauf={p50} projekt={projekt} hoehe={200} />
            <WochenDiagramm lauf={p50} projekt={projekt} hoehe={200} />
          </div>
        </Karte>

        <Karte>
          <BarwertDiagramm
            szenarien={auswertung.szenarien}
            diskontsatzProzent={annahmen.diskontsatzProzent}
            hoehe={200}
          />
          <p className="mt-1 text-[11px] text-pretty text-muted-foreground">
            Der Schnittpunkt mit der Nulllinie ist die diskontierte Amortisation. Szenario B startet
            später und fällt deshalb zuerst zurück.
          </p>
        </Karte>
      </div>

      <Karte titel="Bandbreite über die Wetterjahre">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Kennzahl
            label={`${groesse.kurz} P50, mittleres Jahr`}
            wert={groesse.formatiere(groesse.wert(p50))}
            zusatz={`Wetterjahr ${p50.jahr}`}
            ton="akzent"
            gross
          />
          <Kennzahl
            label={`${groesse.kurz} P90, Näherung`}
            wert={groesse.formatiere(groesse.wert(p90))}
            zusatz={`Wetterjahr ${p90.jahr}, Engpass mal ${annahmen.engpassStressfaktorP90.toFixed(1)}`}
            gross
          />
          <Kennzahl
            label="Abstand P50 zu P90"
            wert={fmtProzent(abstand)}
            zusatz="weniger Jahresergebnis im schlechten Fall"
            ton="verlust"
            gross
          />
          <Kennzahl
            label="Abregelung P50"
            wert={fmtProzent(p50.abregelungProzent)}
            zusatz={`${fmtMWh(p50.abregelungMWh)} im Jahr`}
            gross
          />
          <Kennzahl
            label="Abregelung P90"
            wert={fmtProzent(p90.abregelungProzent)}
            zusatz={`${fmtMWh(p90.abregelungMWh)} im Jahr`}
            ton="verlust"
            gross
          />
        </div>
        <p className="mt-2 text-[11px] text-pretty text-muted-foreground">
          P90 ist hier kein Monte Carlo, sondern das schwächste der drei hinterlegten Wetterjahre
          mit verschärftem Engpassprofil. Bewusst vereinfacht, der Stressfaktor steht im
          Annahmenblock.
        </p>
      </Karte>

      <Karte
        titel="Verhandlungsagenda"
        aktion={
          <span className="text-[11px] font-normal text-muted-foreground normal-case">
            Wirkung auf den Kapitalwert von Szenario {fcaSzenario}
          </span>
        }
      >
        <SensitivitaetsBalken posten={auswertung.sensitivitaet} anzahl={6} />
        {auswertung.sensitivitaet.length > 0 ? (
          <p className="mt-3 border-t border-border pt-2 text-[11px] text-pretty text-muted-foreground">
            Jede Zeile ändert genau einen Vertragsparameter, alles andere bleibt gleich. Die oberste
            Zeile ist der teuerste Punkt des Angebots, also der erste Punkt für das Gespräch mit
            dem Netzbetreiber. Baukostenzuschuss FCA aktuell {fmtEur(alternative.fcaBaukostenzuschussEur)},
            Archetyp {angebot.archetyp.replace(/_/g, " ")}.
          </p>
        ) : null}
      </Karte>

      <AnnahmenBlock
        projekt={projekt}
        annahmen={annahmen}
        setAnnahmen={setAnnahmen}
        hinweise={auswertung.hinweise}
      />
    </div>
  );
}
