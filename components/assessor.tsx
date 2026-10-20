"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckmarkOutline,
  CircleDash,
  Incomplete,
  Printer,
  Reset,
} from "@carbon/icons-react";
import type {
  Alternative,
  AnlagenTyp,
  Annahmen,
  FcaAngebot,
  Projekt,
} from "@/lib/typen";
import { auswerten } from "@/lib/sim";
import { vorlage } from "@/lib/sim/probe";
import { Button } from "@/components/ui/button";
import { SchrittProjekt } from "./schritt-projekt";
import { SchrittAngebot } from "./schritt-angebot";
import { SchrittErgebnis } from "./schritt-ergebnis";
import { Faktenblatt } from "./faktenblatt";
import { cn } from "@/lib/utils";

const SCHRITTE = [
  { id: "projekt", titel: "Projekt", zusatz: "Anlage und Wirtschaftlichkeit" },
  { id: "angebot", titel: "FCA-Angebot", zusatz: "Archetyp und Parameter" },
  { id: "ergebnis", titel: "Ergebnis", zusatz: "Szenarien und Agenda" },
  { id: "faktenblatt", titel: "Faktenblatt", zusatz: "Eine Seite zum Drucken" },
] as const;

type SchrittId = (typeof SCHRITTE)[number]["id"];

export function Assessor() {
  const start = useMemo(() => vorlage("bess"), []);
  const [schritt, setSchritt] = useState<SchrittId>("projekt");
  const [projekt, setProjekt] = useState<Projekt>(start.projekt);
  const [angebot, setAngebot] = useState<FcaAngebot>(start.angebot);
  const [annahmen, setAnnahmen] = useState<Annahmen>(start.annahmen);
  const [alternative, setAlternative] = useState<Alternative>(start.alternative);

  function typWechseln(typ: AnlagenTyp) {
    const neu = vorlage(typ);
    setProjekt(neu.projekt);
    setAngebot(neu.angebot);
    setAnnahmen(neu.annahmen);
    setAlternative(neu.alternative);
  }

  const mitSensitivitaet = schritt === "ergebnis" || schritt === "faktenblatt";
  const auswertung = useMemo(
    () => auswerten({ projekt, angebot, annahmen, alternative, mitSensitivitaet }),
    [projekt, angebot, annahmen, alternative, mitSensitivitaet],
  );

  const index = SCHRITTE.findIndex((s) => s.id === schritt);

  // Jeder Schritt beginnt oben, sonst landet man mitten im nächsten Formular.
  function wechseln(id: SchrittId) {
    setSchritt(id);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="nicht-drucken sticky top-0 z-30">
        <header className="flex h-12 items-center border-b border-[#393939] bg-shell text-shell-text">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              wechseln("projekt");
            }}
            className="flex h-full items-center px-4 text-sm text-[#f4f4f4] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
          >
            <span className="font-semibold">FCA</span>
            <span className="ml-1">Assessor</span>
          </a>
          <span className="hidden h-6 border-l border-[#393939] pl-4 text-sm sm:inline-flex sm:items-center">
            Flexible Netzanschlüsse bewerten
          </span>

          <div className="ml-auto flex h-full items-center">
            <button
              type="button"
              onClick={() => typWechseln(projekt.typ)}
              title="Alle Eingaben auf die Startwerte zurücksetzen"
              className="flex h-full items-center gap-2 px-4 text-sm transition-colors duration-[70ms] hover:bg-shell-hover hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
            >
              <Reset className="size-5" />
              <span className="hidden md:inline">Zurücksetzen</span>
            </button>
            {schritt === "faktenblatt" ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-full items-center gap-2 bg-primary px-4 text-sm text-white transition-colors duration-[70ms] hover:bg-primary-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
              >
                <Printer className="size-5" />
                Drucken
              </button>
            ) : null}
          </div>
        </header>

        <nav aria-label="Schritte" className="border-b border-border bg-background">
          <ol className="mx-auto flex max-w-[99rem] overflow-x-auto px-4 [scrollbar-width:none] md:px-8">
            {SCHRITTE.map((s, i) => {
              const status = i < index ? "fertig" : i === index ? "aktuell" : "offen";
              return (
                <li key={s.id} className="min-w-36 flex-1 lg:max-w-64">
                  <button
                    type="button"
                    onClick={() => wechseln(s.id)}
                    aria-current={status === "aktuell" ? "step" : undefined}
                    className="group flex w-full flex-col gap-1 pt-0 pr-4 pb-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    <span
                      className={cn(
                        "h-0.5 w-full",
                        status === "offen" ? "bg-border-subtle" : "bg-primary",
                      )}
                    />
                    <span className="mt-2 flex items-start gap-2">
                      {status === "fertig" ? (
                        <CheckmarkOutline className="mt-px size-4 shrink-0 text-primary" />
                      ) : status === "aktuell" ? (
                        <Incomplete className="mt-px size-4 shrink-0 text-primary" />
                      ) : (
                        <CircleDash className="mt-px size-4 shrink-0 text-primary" />
                      )}
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-sm group-hover:text-primary group-hover:underline",
                            status === "aktuell" ? "font-semibold text-foreground" : "text-foreground",
                          )}
                        >
                          {s.titel}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.zusatz}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <main className="mx-auto w-full max-w-[99rem] flex-1 px-4 pt-8 pb-16 md:px-8">
        {schritt === "projekt" ? (
          <SchrittProjekt
            projekt={projekt}
            setProjekt={setProjekt}
            annahmen={annahmen}
            setAnnahmen={setAnnahmen}
            typWechseln={typWechseln}
            auswertung={auswertung}
          />
        ) : null}
        {schritt === "angebot" ? (
          <SchrittAngebot
            projekt={projekt}
            angebot={angebot}
            setAngebot={setAngebot}
            annahmen={annahmen}
            setAnnahmen={setAnnahmen}
            alternative={alternative}
            setAlternative={setAlternative}
            auswertung={auswertung}
          />
        ) : null}
        {schritt === "ergebnis" ? (
          <SchrittErgebnis
            projekt={projekt}
            angebot={angebot}
            annahmen={annahmen}
            setAnnahmen={setAnnahmen}
            alternative={alternative}
            auswertung={auswertung}
          />
        ) : null}
        {schritt === "faktenblatt" ? (
          <Faktenblatt
            projekt={projekt}
            angebot={angebot}
            annahmen={annahmen}
            alternative={alternative}
            auswertung={auswertung}
          />
        ) : null}
      </main>

      <footer className="nicht-drucken sticky bottom-0 z-20 border-t border-border bg-background">
        <div className="mx-auto flex max-w-[99rem] items-center justify-between gap-4 pl-4 md:pl-8">
          <p className="hidden py-3 text-xs text-helper sm:block">
            Prototyp für Gespräche, keine Anlageberatung. Zeitreihen: Bundesnetzagentur | SMARD.de,
            CC BY 4.0.
          </p>
          <div className="ml-auto flex gap-px">
            <Button
              variant="secondary"
              size="lg"
              disabled={index === 0}
              onClick={() => wechseln(SCHRITTE[Math.max(0, index - 1)].id)}
            >
              Zurück
            </Button>
            <Button
              size="lg"
              className="min-w-52"
              disabled={index === SCHRITTE.length - 1}
              onClick={() => wechseln(SCHRITTE[Math.min(SCHRITTE.length - 1, index + 1)].id)}
            >
              {index === SCHRITTE.length - 1
                ? "Letzter Schritt"
                : `Weiter: ${SCHRITTE[index + 1].titel}`}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
