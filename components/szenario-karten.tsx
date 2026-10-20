"use client";

import type { Auswertung, Projekt, SzenarioSchluessel } from "@/lib/typen";
import { fmtEur, fmtJahre, fmtMWh, fmtProzent, fmtStunden, fmtZahl } from "@/lib/format";
import { Hinweis, Kennzahl } from "./felder";
import { GLOSSAR } from "@/lib/glossar";
import { cn } from "@/lib/utils";

const REIHENFOLGE: SzenarioSchluessel[] = ["A", "B", "C"];

const SZENARIO_HINWEIS: Record<SzenarioSchluessel, string> = {
  A: GLOSSAR.szenarioA,
  B: GLOSSAR.szenarioB,
  C: GLOSSAR.szenarioC,
};

export function SzenarioKarten({
  auswertung,
  projekt,
}: {
  auswertung: Auswertung;
  projekt: Projekt;
}) {
  const istLast = projekt.typ === "industrielle_last";
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {REIHENFOLGE.map((s) => {
        const z = auswertung.szenarien[s];
        const gewinnt = auswertung.gewinner === s;
        return (
          <article
            key={s}
            className={cn(
              "seitenumbruch-vermeiden relative bg-card p-4",
              gewinnt && "shadow-[inset_0_3px_0_var(--primary)]",
              !z.verfuegbar && "opacity-55",
            )}
          >
            <header className="flex items-center gap-2">
              <span
                className={cn(
                  "ziffern flex size-6 shrink-0 items-center justify-center text-sm font-semibold",
                  gewinnt ? "bg-primary text-primary-foreground" : "bg-layer-selected text-foreground",
                )}
              >
                {s}
              </span>
              <h4 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                {z.titel}
                <Hinweis text={SZENARIO_HINWEIS[s]} />
              </h4>
              {gewinnt ? (
                <span className="ml-auto inline-flex h-6 shrink-0 items-center rounded-full bg-tag-blau px-2 text-xs text-tag-blau-text">
                  Empfohlen
                </span>
              ) : null}
            </header>
            <p className="mt-2 min-h-8 text-xs text-pretty text-muted-foreground">{z.kurz}</p>

            <div className="mt-4 border-t border-border-subtle pt-4">
              <Kennzahl
                label="Kapitalwert"
                hinweis={GLOSSAR.kapitalwert}
                wert={fmtEur(z.npvEur)}
                zusatz={`P90 ${fmtEur(z.npvP90Eur)}`}
                ton={gewinnt ? "akzent" : "neutral"}
                gross
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border-subtle pt-4">
              <Kennzahl
                label={istLast ? "Bezug im Jahr 1" : "Ertrag im Jahr 1"}
                wert={fmtMWh(z.ertragJahr1MWh)}
                hinweis="Arbeit im ersten Betriebsjahr des Szenarios. Bei Szenario B beginnt der Betrieb erst mit dem Netzausbau."
              />
              <Kennzahl
                label="Abregelung"
                hinweis={GLOSSAR.abregelung}
                wert={z.abregelungProzent > 0 ? fmtProzent(z.abregelungProzent) : "keine"}
                zusatz={
                  z.abregelungStundenProJahr > 0
                    ? `${fmtStunden(z.abregelungStundenProJahr)} im Jahr`
                    : undefined
                }
                ton={z.abregelungProzent > 0 ? "verlust" : "neutral"}
              />
              <Kennzahl
                label="Amortisation"
                wert={fmtJahre(z.amortisationJahre)}
                hinweis={GLOSSAR.amortisation}
              />
              <Kennzahl
                label={istLast ? "Anschlussjahr" : "Vollkosten"}
                hinweis={istLast ? GLOSSAR.anschlussjahr : GLOSSAR.lcoe}
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
              <p className="mt-4 border-t border-border-subtle pt-3 text-xs text-pretty text-helper">
                {z.hinweis}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
