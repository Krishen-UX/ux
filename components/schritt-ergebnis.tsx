"use client";

import { useState } from "react";
import { Mail, Printer } from "lucide-react";
import type { Alternative, Annahmen, Auswertung, FcaAngebot, Projekt } from "@/lib/typen";
import { fmtEur, fmtJahre, fmtMWh, fmtProzent } from "@/lib/format";
import { ergebnisgroesse, jahresergebnis } from "@/lib/kennzahlen";
import { datenluecken } from "@/lib/datenluecken";
import { GLOSSAR } from "@/lib/glossar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmpfehlungsBanner } from "./empfehlung";
import { AnnahmenBlock } from "./annahmen-block";
import { DauerlinienDiagramm } from "./diagramme/dauerlinie";
import { WochenDiagramm } from "./diagramme/woche";
import { BarwertDiagramm } from "./diagramme/barwert";
import { SensitivitaetsBalken } from "./diagramme/sensitivitaet";
import { Rueckfrage } from "./rueckfrage";
import { Kennzahl } from "./felder";
import { Karte } from "./karte";
import { cn } from "@/lib/utils";

const SZENARIO_HINWEIS = {
  A: GLOSSAR.szenarioA,
  B: GLOSSAR.szenarioB,
  C: GLOSSAR.szenarioC,
} as const;

export function SchrittErgebnis({
  projekt,
  setProjekt,
  angebot,
  annahmen,
  setAnnahmen,
  alternative,
  auswertung,
  zumFaktenblatt,
}: {
  projekt: Projekt;
  setProjekt: (p: Projekt) => void;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
  alternative: Alternative;
  auswertung: Auswertung;
  zumFaktenblatt: () => void;
}) {
  const [zeigeRueckfrage, setZeigeRueckfrage] = useState(false);
  const p50 = auswertung.p50Lauf;
  const p90 = auswertung.p90Lauf;
  const groesse = ergebnisgroesse(projekt);
  const luecken = datenluecken(angebot, alternative, projekt);
  const abstand =
    ((jahresergebnis(p50) - jahresergebnis(p90)) / Math.max(1, Math.abs(jahresergebnis(p50)))) * 100;
  const fcaSzenario = auswertung.szenarien.C.npvEur >= auswertung.szenarien.A.npvEur ? "C" : "A";

  return (
    <div className="space-y-4">
      <EmpfehlungsBanner
        auswertung={auswertung}
        projekt={projekt}
        geschaetzt={luecken.length}
      />

      <div className="grid gap-2.5 md:grid-cols-3">
        {(["A", "B", "C"] as const).map((s) => {
          const z = auswertung.szenarien[s];
          const gewinnt = auswertung.gewinner === s;
          return (
            <article
              key={s}
              className={cn(
                "flex flex-col gap-1 rounded-md border p-3",
                gewinnt ? "border-akzent bg-akzent-schwach/40" : "border-border",
                !z.verfuegbar && "opacity-55",
              )}
              title={SZENARIO_HINWEIS[s]}
            >
              <header className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "ziffern flex size-[17px] items-center justify-center rounded-[3px] text-[10px] font-bold",
                    gewinnt ? "bg-akzent text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </span>
                <h4 className="font-semibold">{z.titel}</h4>
              </header>
              <div
                className={cn(
                  "ziffern text-[19px] font-semibold tabular-nums",
                  gewinnt && "text-akzent",
                )}
              >
                {z.verfuegbar ? fmtEur(z.npvEur) : "nicht bewertbar"}
              </div>
              <div className="ziffern text-[11px] text-muted-foreground">
                {z.verfuegbar
                  ? `P90 ${fmtEur(z.npvP90Eur)}, Amortisation ${fmtJahre(z.amortisationJahre)}`
                  : (z.hinweis ?? "")}
              </div>
            </article>
          );
        })}
      </div>

      <Karte
        titel="Darüber solltest du sprechen"
        hinweis={GLOSSAR.verhandlungsagenda}
        aktion={
          <span className="text-[11px] font-normal text-muted-foreground normal-case">
            Wirkung auf den Kapitalwert von Szenario {fcaSzenario}
          </span>
        }
      >
        <SensitivitaetsBalken posten={auswertung.sensitivitaet} anzahl={5} />
      </Karte>

      {luecken.length > 0 ? (
        <Karte
          titel="Offene Punkte, die das Ergebnis tragen"
          hinweis={GLOSSAR.offenePunkte}
          aktion={
            <span className="text-[11px] font-normal text-muted-foreground normal-case">
              {luecken.length} {luecken.length === 1 ? "Angabe beruht" : "Angaben beruhen"} auf
              Schätzung
            </span>
          }
        >
          <ol className="space-y-2">
            {luecken.map((l, i) => (
              <li key={l.schluessel} className="flex gap-2">
                <span className="ziffern mt-0.5 w-4 shrink-0 text-[11px] text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="font-medium">{l.angabe}</div>
                  <p className="text-pretty text-muted-foreground">{l.frage}</p>
                </div>
              </li>
            ))}
          </ol>
        </Karte>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
        <button
          type="button"
          onClick={zumFaktenblatt}
          className="flex items-center gap-2 rounded-md bg-akzent px-4 py-2 font-semibold text-primary-foreground hover:bg-accent-foreground"
        >
          <Printer className="size-3.5" />
          Faktenblatt
        </button>
        <button
          type="button"
          onClick={() => setZeigeRueckfrage((z) => !z)}
          className={cn(
            "flex items-center gap-2 rounded-md border border-input px-4 py-2 font-semibold hover:bg-muted",
            zeigeRueckfrage && "bg-muted",
          )}
        >
          <Mail className="size-3.5" />
          Rückfrage an den Netzbetreiber
        </button>
      </div>

      {zeigeRueckfrage ? (
        <Rueckfrage
          projekt={projekt}
          angebot={angebot}
          alternative={alternative}
          luecken={luecken}
          posten={auswertung.sensitivitaet}
        />
      ) : null}

      <Accordion className="w-full">
        <AccordionItem value="details">
          <AccordionTrigger className="text-[11px] font-semibold tracking-wide uppercase">
            Rechenweg und Diagramme
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 pt-1 lg:grid-cols-3">
              <DauerlinienDiagramm lauf={p50} projekt={projekt} hoehe={190} />
              <WochenDiagramm lauf={p50} projekt={projekt} hoehe={190} />
              <div>
                <BarwertDiagramm
                  szenarien={auswertung.szenarien}
                  diskontsatzProzent={annahmen.diskontsatzProzent}
                  hoehe={190}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-3 sm:grid-cols-5">
              <Kennzahl
                label={`${groesse.kurz} P50`}
                wert={groesse.formatiere(groesse.wert(p50))}
                zusatz={`Wetterjahr ${p50.jahr}`}
                ton="akzent"
                hinweis={GLOSSAR.p50}
              />
              <Kennzahl
                label={`${groesse.kurz} P90`}
                wert={groesse.formatiere(groesse.wert(p90))}
                zusatz={`Wetterjahr ${p90.jahr}, Engpass mal ${annahmen.engpassStressfaktorP90.toFixed(1)}`}
                hinweis={GLOSSAR.p90}
              />
              <Kennzahl
                label="Abstand P50 zu P90"
                wert={fmtProzent(abstand)}
                zusatz="weniger Jahresergebnis im schlechten Fall"
                ton="verlust"
                hinweis={GLOSSAR.bandbreite}
              />
              <Kennzahl
                label="Abregelung P50"
                wert={fmtProzent(p50.abregelungProzent)}
                zusatz={`${fmtMWh(p50.abregelungMWh)} im Jahr`}
                hinweis={GLOSSAR.abregelung}
              />
              <Kennzahl
                label="Abregelung P90"
                wert={fmtProzent(p90.abregelungProzent)}
                zusatz={`${fmtMWh(p90.abregelungMWh)} im Jahr`}
                ton="verlust"
                hinweis="Abregelung im schwächsten Wetterjahr mit verschärftem Engpass."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="annahmen">
          <AccordionTrigger className="text-[11px] font-semibold tracking-wide uppercase">
            Annahmen und Modellgrenzen
          </AccordionTrigger>
          <AccordionContent>
            <AnnahmenBlock
              projekt={projekt}
              setProjekt={setProjekt}
              annahmen={annahmen}
              setAnnahmen={setAnnahmen}
              hinweise={auswertung.hinweise}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
