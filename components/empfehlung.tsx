"use client";

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

const TON: Record<Ampel, { rand: string; flaeche: string; punkt: string; label: string }> = {
  gut: {
    rand: "border-gut/30",
    flaeche: "bg-gut/8",
    punkt: "bg-gut",
    label: "Klare Empfehlung",
  },
  mittel: {
    rand: "border-mittel/40",
    flaeche: "bg-mittel/10",
    punkt: "bg-mittel",
    label: "Knappe Entscheidung",
  },
  schlecht: {
    rand: "border-schlecht/30",
    flaeche: "bg-schlecht/8",
    punkt: "bg-schlecht",
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

  return (
    <section
      className={cn(
        "seitenumbruch-vermeiden rounded-md border-l-[3px] px-4 py-3.5",
        ton.rand,
        ton.flaeche,
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
        <span className={cn("size-2 rounded-full", ton.punkt)} />
        {ton.label}
        <span className="font-normal text-muted-foreground normal-case">
          Szenario {auswertung.gewinner}, {gewinner.titel}
        </span>
      </div>
      <p className="mt-1.5 max-w-4xl text-lg leading-tight font-semibold text-pretty sm:text-xl">
        {e.satz}
      </p>
      <p className="mt-1.5 max-w-3xl text-pretty text-muted-foreground">{e.begruendung}</p>
    </section>
  );
}
