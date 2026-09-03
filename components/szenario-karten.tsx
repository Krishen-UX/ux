"use client";

import type { Auswertung, Projekt, SzenarioSchluessel } from "@/lib/typen";
import { fmtEur, fmtJahre, fmtMWh, fmtProzent, fmtStunden, fmtZahl } from "@/lib/format";
import { Kennzahl } from "./felder";
import { cn } from "@/lib/utils";

const REIHENFOLGE: SzenarioSchluessel[] = ["A", "B", "C"];

export function SzenarioKarten({
  auswertung,
  projekt,
}: {
  auswertung: Auswertung;
  projekt: Projekt;
}) {
  const istLast = projekt.typ === "industrielle_last";
  return (
    <div className="grid gap-2.5 md:grid-cols-3">
      {REIHENFOLGE.map((s) => {
        const z = auswertung.szenarien[s];
        const gewinnt = auswertung.gewinner === s;
        return (
          <article
            key={s}
            className={cn(
              "seitenumbruch-vermeiden rounded-md border p-3",
              gewinnt ? "border-akzent bg-akzent-schwach/40" : "border-border bg-card",
              !z.verfuegbar && "opacity-55",
            )}
          >
            <header className="flex items-baseline gap-2">
              <span
                className={cn(
                  "ziffern flex size-5 items-center justify-center rounded-[3px] text-[11px] font-bold",
                  gewinnt ? "bg-akzent text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {s}
              </span>
              <h4 className="font-semibold">{z.titel}</h4>
            </header>
            <p className="mt-1 min-h-8 text-[11px] text-pretty text-muted-foreground">{z.kurz}</p>

            <div className="mt-2 border-t border-border pt-2">
              <Kennzahl
                label="Kapitalwert"
                wert={fmtEur(z.npvEur)}
                zusatz={`P90 ${fmtEur(z.npvP90Eur)}`}
                ton={gewinnt ? "akzent" : "neutral"}
                gross
              />
            </div>

            <dl className="mt-2.5 grid grid-cols-2 gap-2.5 border-t border-border pt-2.5">
              <Kennzahl
                label={istLast ? "Bezug im Jahr 1" : "Ertrag im Jahr 1"}
                wert={fmtMWh(z.ertragJahr1MWh)}
              />
              <Kennzahl
                label="Abregelung"
                wert={z.abregelungProzent > 0 ? fmtProzent(z.abregelungProzent) : "keine"}
                zusatz={
                  z.abregelungStundenProJahr > 0
                    ? `${fmtStunden(z.abregelungStundenProJahr)} im Jahr`
                    : undefined
                }
                ton={z.abregelungProzent > 0 ? "verlust" : "neutral"}
              />
              <Kennzahl label="Amortisation" wert={fmtJahre(z.amortisationJahre)} />
              <Kennzahl
                label={istLast ? "Anschlussjahr" : "Vollkosten"}
                wert={
                  istLast
                    ? z.startJahr === 1
                      ? "sofort"
                      : `Jahr ${z.startJahr}`
                    : z.lcoeEurProMWh
                      ? `${fmtZahl(z.lcoeEurProMWh, 1)} EUR/MWh`
                      : "-"
                }
              />
            </dl>

            {z.hinweis ? (
              <p className="mt-2 border-t border-border pt-2 text-[11px] text-pretty text-muted-foreground">
                {z.hinweis}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
