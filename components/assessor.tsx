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
import { SchrittStart } from "./schritt-start";
import { SchrittPruefen } from "./schritt-pruefen";
import { SchrittErgebnis } from "./schritt-ergebnis";
import { Faktenblatt } from "./faktenblatt";
import { AuslesenLauf } from "./auslesen-lauf";
import { DokumentAuswahl } from "./dokument-auswahl";
import type { Beispieldokument } from "@/data/beispiele";
import { cn } from "@/lib/utils";

const SCHRITTE = [
  { id: "start", titel: "Start" },
  { id: "pruefen", titel: "Prüfen" },
  { id: "ergebnis", titel: "Ergebnis" },
] as const;

type SchrittId = (typeof SCHRITTE)[number]["id"];

export function Assessor() {
  const start = useMemo(() => vorlage("bess"), []);
  const [schritt, setSchritt] = useState<SchrittId>("start");
  const [faktenblatt, setFaktenblatt] = useState(false);
  const [liest, setLiest] = useState(false);
  const [waehltDatei, setWaehltDatei] = useState(false);
  const [dokument, setDokument] = useState<Beispieldokument | null>(null);
  const [quelle, setQuelle] = useState<"dokument" | "manuell">("dokument");
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

  function zuruecksetzen() {
    typWechseln(projekt.typ);
    setSchritt("start");
    setFaktenblatt(false);
  }

  function starten(gewaehlteQuelle: "dokument" | "manuell") {
    setQuelle(gewaehlteQuelle);
    if (gewaehlteQuelle === "manuell") {
      setDokument(null);
      setSchritt("pruefen");
      return;
    }
    setWaehltDatei(true);
  }

  /** Das gewählte Schreiben setzt den Archetyp und seine Parameter. */
  function dokumentUebernehmen(d: Beispieldokument) {
    setDokument(d);
    setWaehltDatei(false);
    setAngebot((a) => ({ ...a, ...d.angebot }));
    setAlternative((alt) => ({ ...alt, ...d.alternative }));
    setLiest(true);
  }

  const mitSensitivitaet = schritt === "ergebnis" || faktenblatt;
  const auswertung = useMemo(
    () => auswerten({ projekt, angebot, annahmen, alternative, mitSensitivitaet }),
    [projekt, angebot, annahmen, alternative, mitSensitivitaet],
  );

  const index = SCHRITTE.findIndex((s) => s.id === schritt);
  const erreichbar = (id: SchrittId) =>
    id === "start" || schritt !== "start" || faktenblatt;

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
                disabled={!erreichbar(s.id)}
                onClick={() => {
                  setSchritt(s.id);
                  setFaktenblatt(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors",
                  s.id === schritt && !faktenblatt
                    ? "bg-akzent text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !erreichbar(s.id) && "cursor-not-allowed opacity-40 hover:bg-transparent",
                )}
              >
                <span className="ziffern text-[11px] opacity-70">{i + 1}</span>
                {s.titel}
              </button>
            ))}
            {faktenblatt ? (
              <span className="ml-1 flex items-center gap-1.5 rounded-md bg-akzent px-2.5 py-1 text-primary-foreground">
                Faktenblatt
              </span>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={zuruecksetzen}
              title="Alle Eingaben auf die Startwerte zurücksetzen"
            >
              <RotateCcw className="size-3.5" />
              Zurücksetzen
            </Button>
            {faktenblatt ? (
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="size-3.5" />
                Drucken
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-4 pb-14">
        {faktenblatt ? (
          <Faktenblatt
            projekt={projekt}
            angebot={angebot}
            annahmen={annahmen}
            alternative={alternative}
            auswertung={auswertung}
          />
        ) : schritt === "start" ? (
          <SchrittStart
            projekt={projekt}
            setProjekt={setProjekt}
            typWechseln={typWechseln}
            auswertung={auswertung}
            starten={starten}
          />
        ) : schritt === "pruefen" ? (
          <SchrittPruefen
            projekt={projekt}
            angebot={angebot}
            setAngebot={setAngebot}
            alternative={alternative}
            setAlternative={setAlternative}
            annahmen={annahmen}
            setAnnahmen={setAnnahmen}
            auswertung={auswertung}
            quelle={quelle}
            dokument={dokument}
            weiter={() => setSchritt("ergebnis")}
          />
        ) : (
          <SchrittErgebnis
            projekt={projekt}
            setProjekt={setProjekt}
            angebot={angebot}
            annahmen={annahmen}
            setAnnahmen={setAnnahmen}
            alternative={alternative}
            auswertung={auswertung}
            zumFaktenblatt={() => setFaktenblatt(true)}
          />
        )}
      </main>

      <footer className="nicht-drucken sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2">
          <p className="text-[11px] text-muted-foreground">
            Prototyp für Gespräche, keine Anlageberatung. Zeitreihen: Bundesnetzagentur | SMARD.de,
            CC BY 4.0.
          </p>
          <div className="flex gap-1.5">
            {faktenblatt ? (
              <Button variant="outline" size="sm" onClick={() => setFaktenblatt(false)}>
                <ArrowLeft className="size-3.5" />
                Zurück zum Ergebnis
              </Button>
            ) : (
              <>
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
                  disabled={index === SCHRITTE.length - 1 || schritt === "start"}
                  onClick={() => setSchritt(SCHRITTE[Math.min(SCHRITTE.length - 1, index + 1)].id)}
                >
                  {SCHRITTE[Math.min(SCHRITTE.length - 1, index + 1)].titel}
                  <ArrowRight className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      <DokumentAuswahl
        offen={waehltDatei}
        schliessen={() => setWaehltDatei(false)}
        waehlen={dokumentUebernehmen}
      />

      {liest ? (
        <AuslesenLauf
          dateiname={dokument?.dateiname ?? "Angebotsschreiben.pdf"}
          fertig={() => {
            setLiest(false);
            setSchritt("pruefen");
          }}
        />
      ) : null}
    </div>
  );
}
