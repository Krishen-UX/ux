"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Printer, RotateCcw } from "lucide-react";
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
  { id: "projekt", titel: "Projekt" },
  { id: "angebot", titel: "FCA-Angebot" },
  { id: "ergebnis", titel: "Ergebnis" },
  { id: "faktenblatt", titel: "Faktenblatt" },
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

  return (
    <div className="flex min-h-full flex-col">
      <header className="nicht-drucken sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight">FCA Assessor</span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              Flexible Netzanschlüsse bewerten
            </span>
          </div>

          <nav className="flex items-center gap-0.5" aria-label="Schritte">
            {SCHRITTE.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSchritt(s.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors",
                  s.id === schritt
                    ? "bg-akzent text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="ziffern text-[11px] opacity-70">{i + 1}</span>
                {s.titel}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => typWechseln(projekt.typ)}
              title="Alle Eingaben auf die Startwerte zurücksetzen"
            >
              <RotateCcw className="size-3.5" />
              Zurücksetzen
            </Button>
            {schritt === "faktenblatt" ? (
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="size-3.5" />
                Drucken
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-4 pb-14">
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

      <footer className="nicht-drucken sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2">
          <p className="text-[11px] text-muted-foreground">
            Prototyp für Gespräche, keine Anlageberatung. Zeitreihen: Bundesnetzagentur | SMARD.de,
            CC BY 4.0.
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => setSchritt(SCHRITTE[Math.max(0, index - 1)].id)}
            >
              <ArrowLeft className="size-3.5" />
              Zurück
            </Button>
            <Button
              size="sm"
              disabled={index === SCHRITTE.length - 1}
              onClick={() => setSchritt(SCHRITTE[Math.min(SCHRITTE.length - 1, index + 1)].id)}
            >
              {SCHRITTE[Math.min(SCHRITTE.length - 1, index + 1)].titel}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
