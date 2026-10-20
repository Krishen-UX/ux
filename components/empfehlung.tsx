"use client";

import type { ComponentType } from "react";
import { CheckmarkFilled, ErrorFilled, WarningAltFilled } from "@carbon/icons-react";
import type { Auswertung, Projekt } from "@/lib/typen";
import { fmtEur, fmtProzent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type Ampel = "gut" | "mittel" | "schlecht";

export interface Empfehlungstext {
  ampel: Ampel;
  satz: string;
  begruendung: string;
  vorsprungAnteil: number;
}

/**
 * Ein Satz zur Entscheidung. Die Ampel bewertet nicht das Angebot an sich,
 * sondern wie eindeutig das gewinnende Szenario vorn liegt.
 */
export function empfehlung(auswertung: Auswertung, projekt: Projekt): Empfehlungstext {
  const gewinner = auswertung.szenarien[auswertung.gewinner];
  const bezug = Math.max(1, gewinner.investitionEur);
  const anteil = (auswertung.vorsprungEur / bezug) * 100;
  const knapp = anteil < 5;
  const fcaGewinnt = auswertung.gewinner !== "B";

  const ampel: Ampel = !fcaGewinnt ? "schlecht" : knapp ? "mittel" : "gut";

  const satz =
    auswertung.gewinner === "C"
      ? `Das FCA annehmen und den festen Anschluss nachziehen bringt ${fmtEur(auswertung.vorsprungEur)} mehr als die nächstbeste Variante.`
      : auswertung.gewinner === "A"
        ? `Das FCA dauerhaft anzunehmen bringt ${fmtEur(auswertung.vorsprungEur)} mehr als die nächstbeste Variante.`
        : `Auf den festen Anschluss zu warten bringt ${fmtEur(auswertung.vorsprungEur)} mehr als das FCA in seiner jetzigen Form.`;

  const begruendung = knapp
    ? "Der Abstand ist gering. Die Entscheidung hängt an den Vertragsparametern weiter unten, nicht an der Grundsatzfrage."
    : auswertung.gewinner === "B"
      ? `Die Abregelung von ${fmtProzent(auswertung.p50Lauf.abregelungProzent)} und die Auflagen kosten mehr, als der frühere Anschluss einbringt.`
      : `Der frühere Betriebsstart wiegt die Abregelung von ${fmtProzent(auswertung.p50Lauf.abregelungProzent)} auf, ${projekt.name} startet ${gewinner.startJahr === 1 ? "sofort" : `im Jahr ${gewinner.startJahr}`}.`;

  return { ampel, satz, begruendung, vorsprungAnteil: anteil };
}

const TON: Record<
  Ampel,
  { rand: string; flaeche: string; symbol: ComponentType<{ className?: string }>; farbe: string; label: string }
> = {
  gut: {
    rand: "border-gut/40 border-l-gut",
    flaeche: "bg-hinweis-gut",
    symbol: CheckmarkFilled,
    farbe: "text-gut",
    label: "Klare Empfehlung",
  },
  mittel: {
    rand: "border-mittel/40 border-l-mittel",
    flaeche: "bg-hinweis-mittel",
    symbol: WarningAltFilled,
    farbe: "text-mittel",
    label: "Knappe Entscheidung",
  },
  schlecht: {
    rand: "border-schlecht/40 border-l-schlecht",
    flaeche: "bg-hinweis-schlecht",
    symbol: ErrorFilled,
    farbe: "text-schlecht",
    label: "Angebot nachverhandeln",
  },
};

export function EmpfehlungsBanner({
  auswertung,
  projekt,
}: {
  auswertung: Auswertung;
  projekt: Projekt;
}) {
  const e = empfehlung(auswertung, projekt);
  const ton = TON[e.ampel];
  const gewinner = auswertung.szenarien[auswertung.gewinner];
  const Symbol = ton.symbol;

  return (
    <section
      role="status"
      className={cn(
        "seitenumbruch-vermeiden flex gap-4 border border-l-[3px] px-4 py-5",
        ton.rand,
        ton.flaeche,
      )}
    >
      <Symbol className={cn("mt-0.5 size-5 shrink-0", ton.farbe)} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{ton.label}</span>
          <span className="text-muted-foreground">
            Szenario {auswertung.gewinner}, {gewinner.titel}
          </span>
        </div>
        <p className="mt-2 max-w-4xl text-xl font-normal text-pretty sm:text-2xl">{e.satz}</p>
        <p className="mt-2 max-w-3xl text-sm text-pretty text-muted-foreground">{e.begruendung}</p>
      </div>
    </section>
  );
}
