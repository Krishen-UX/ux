"use client";

import { useState } from "react";
import { ArrowRight, FileText, Lock, Sparkles, Upload } from "lucide-react";
import type { AnlagenTyp, Auswertung, Projekt } from "@/lib/typen";
import { ANLAGENTYPEN, BUNDESLAENDER, regelzoneVon } from "@/data/annahmen";
import { LASTPROFILE } from "@/lib/sim/profile";
import { fmtEur, fmtMWh } from "@/lib/format";
import { Begriff, Hinweis } from "./felder";
import { InlineZahl, InlineAuswahl } from "./inline-wert";
import { cn } from "@/lib/utils";

/**
 * Einstieg. Drei Angaben und das Angebotsschreiben, alles Weitere ist
 * vorbelegt. Der Satz ist die Eingabe, nicht ein Raster aus Feldern.
 */
export function SchrittStart({
  projekt,
  setProjekt,
  typWechseln,
  auswertung,
  starten,
}: {
  projekt: Projekt;
  setProjekt: (p: Projekt) => void;
  typWechseln: (t: AnlagenTyp) => void;
  auswertung: Auswertung;
  starten: (quelle: "dokument" | "manuell") => void;
}) {
  const [ueberDerAblage, setUeberDerAblage] = useState(false);
  const aendern = <K extends keyof Projekt>(feld: K, wert: Projekt[K]) =>
    setProjekt({ ...projekt, [feld]: wert });

  const istSpeicher = projekt.typ === "bess";
  const istLast = projekt.typ === "industrielle_last";
  const lauf = auswertung.p50Lauf;
  const investition =
    projekt.capexProMW * projekt.installierteLeistungMW +
    (istSpeicher ? (projekt.capexProMWhSpeicher ?? 0) * (projekt.speicherKapazitaetMWh ?? 0) : 0);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7 py-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Angebot bewerten</h1>
        <p className="text-pretty text-muted-foreground">
          Zwei Dinge brauchen wir. Alles Weitere ist vorbelegt und lässt sich später ändern.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-baseline gap-2">
          <span className="ziffern flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-muted text-[11px] font-bold text-muted-foreground">
            1
          </span>
          <span className="text-[15px] font-semibold">Was baust du?</span>
        </h2>

        <div className="grid gap-2 sm:grid-cols-3">
          {ANLAGENTYPEN.map((t) => (
            <button
              key={t.typ}
              type="button"
              onClick={() => typWechseln(t.typ)}
              className={cn(
                "rounded-md border p-2.5 text-left transition-colors",
                projekt.typ === t.typ
                  ? "border-akzent bg-akzent-schwach"
                  : "border-border hover:border-akzent/40 hover:bg-muted/60",
              )}
            >
              <div className="font-semibold">{t.titel}</div>
              <div className="mt-0.5 text-[11px] text-pretty text-muted-foreground">{t.kurz}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 rounded-md border border-border p-3.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px]">
            <span className="text-muted-foreground">mit</span>
            <InlineZahl
              wert={projekt.installierteLeistungMW}
              setzen={(n) => aendern("installierteLeistungMW", Math.max(0.1, n))}
              beschriftung="Installierte Leistung in MW"
            />
            <span className="text-muted-foreground">MW</span>
            {istSpeicher ? (
              <>
                <span className="text-muted-foreground">und</span>
                <InlineZahl
                  wert={projekt.speicherKapazitaetMWh ?? 0}
                  setzen={(n) => aendern("speicherKapazitaetMWh", Math.max(0.1, n))}
                  beschriftung="Speicherkapazität in MWh"
                />
                <span className="text-muted-foreground">MWh</span>
              </>
            ) : null}
            {istLast ? (
              <>
                <span className="text-muted-foreground">als</span>
                <InlineAuswahl
                  wert={projekt.lastprofil ?? "g3_durchlaufend"}
                  setzen={(w) => aendern("lastprofil", w as NonNullable<Projekt["lastprofil"]>)}
                  beschriftung="Lastprofil"
                  optionen={Object.entries(LASTPROFILE).map(([wert, p]) => ({
                    wert,
                    text: p.label,
                  }))}
                />
              </>
            ) : null}
            <span className="text-muted-foreground">in</span>
            <InlineAuswahl
              wert={projekt.bundesland}
              setzen={(w) => aendern("bundesland", w)}
              beschriftung="Bundesland"
              optionen={BUNDESLAENDER.map((b) => ({ wert: b.name, text: b.name }))}
            />
          </div>

          <div className="flex items-start gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gut" />
            <span className="text-pretty">
              Daraus folgen <Begriff name="regelzone">Regelzone {regelzoneVon(projekt.bundesland)}</Begriff>,
              Erzeugungs- und Preisprofil sowie {fmtEur(investition)} Investition. Am festen Anschluss
              wären das {fmtMWh(istLast ? lauf.entnahmeReferenzMWh : lauf.einspeisungReferenzMWh)} im
              Jahr.
              <Hinweis text="Alle abgeleiteten Werte stehen im Annahmenblock auf dem Ergebnisscreen und sind dort änderbar." />
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-baseline gap-2">
          <span className="ziffern flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-muted text-[11px] font-bold text-muted-foreground">
            2
          </span>
          <span className="text-[15px] font-semibold">Was hat der Netzbetreiber angeboten?</span>
        </h2>

        <button
          type="button"
          onClick={() => starten("dokument")}
          onDragOver={(e) => {
            e.preventDefault();
            setUeberDerAblage(true);
          }}
          onDragLeave={() => setUeberDerAblage(false)}
          onDrop={(e) => {
            e.preventDefault();
            setUeberDerAblage(false);
            starten("dokument");
          }}
          className={cn(
            "flex flex-col items-center gap-2.5 rounded-md border-[1.5px] border-dashed px-6 py-9 text-center transition-colors",
            ueberDerAblage
              ? "border-akzent bg-akzent-schwach"
              : "border-akzent/70 bg-akzent-schwach/60 hover:bg-akzent-schwach",
          )}
        >
          <Upload className="size-7 text-akzent" strokeWidth={1.5} />
          <span className="text-[15px] font-semibold text-accent-foreground">
            Angebotsschreiben hier ablegen
          </span>
          <span className="max-w-[460px] text-pretty text-accent-foreground">
            PDF, Foto der Seiten oder eingefügter Text. Wir lesen Archetyp, Grenzen, Zugangsprinzip,
            Fristen und Auflagen heraus und belegen jede Angabe mit ihrer Fundstelle.
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <span>Noch kein Angebot?</span>
          <button
            type="button"
            onClick={() => starten("manuell")}
            className="border-b border-akzent text-akzent hover:border-accent-foreground hover:text-accent-foreground"
          >
            Angebot selbst beschreiben
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />
          Das Schreiben bleibt im Browser und wird nicht gespeichert
        </span>
        <button
          type="button"
          onClick={() => starten("dokument")}
          className="flex items-center gap-2 rounded-md bg-akzent px-4 py-2 font-semibold text-primary-foreground hover:bg-accent-foreground"
        >
          <FileText className="size-3.5" />
          Angebot auslesen
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <p className="text-[11px] text-pretty text-muted-foreground">
        Im Prototyp ist das Auslesen simuliert. Es wird kein Dokument gelesen, die Fundstellen sind
        hinterlegt. Das genügt, um den Ablauf zu prüfen.
      </p>
    </div>
  );
}
