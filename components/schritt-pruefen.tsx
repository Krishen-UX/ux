"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Minus,
  TriangleAlert,
} from "lucide-react";
import type { Alternative, Annahmen, Auswertung, FcaAngebot, Projekt } from "@/lib/typen";
import { auslesen, offeneAuslesungen, zaehle, type Auslesung } from "@/lib/auslesen";
import { ergebnisgroesse } from "@/lib/kennzahlen";
import { fmtEur, fmtProzent } from "@/lib/format";
import { DauerlinienDiagramm } from "./diagramme/dauerlinie";
import { Steuerung, type SteuerungsEingabe } from "./angebot-steuerung";
import { SchrittKopf } from "./schritt-kopf";
import { Karte } from "./karte";
import type { Beispieldokument } from "@/data/beispiele";
import { cn } from "@/lib/utils";

const TON = {
  belegt: { rand: "border-border", farbe: "text-gut", wort: "belegt" },
  vorbelegt: { rand: "border-border", farbe: "text-muted-foreground", wort: "vorbelegt" },
  unsicher: { rand: "border-mittel", farbe: "text-mittel", wort: "unsicher" },
  fehlt: { rand: "border-verlust", farbe: "text-verlust", wort: "fehlen" },
} as const;

function Zeichen({ sicherheit }: { sicherheit: Auslesung["sicherheit"] }) {
  const klasse = cn("size-4 shrink-0", TON[sicherheit].farbe);
  if (sicherheit === "belegt") return <Check className={klasse} strokeWidth={2.4} />;
  if (sicherheit === "vorbelegt") return <Minus className={klasse} strokeWidth={2.2} />;
  if (sicherheit === "unsicher") return <TriangleAlert className={klasse} strokeWidth={1.9} />;
  return <CircleHelp className={klasse} strokeWidth={1.9} />;
}

function BelegZeile({ beleg }: { beleg: NonNullable<Auslesung["beleg"]> }) {
  return (
    <p className="border-l-2 border-border pl-2 text-[11px] text-pretty text-muted-foreground">
      <span className="italic">„{beleg.zitat}“</span> {beleg.fundstelle}
    </p>
  );
}

/**
 * Prüfen statt Ausfüllen.
 *
 * Was das Schreiben hergibt, steht als Vorschlag da, mit der Stelle, aus der es
 * stammt. Bestätigen geht durch Nichtstun. Oben liegt nur, was wirklich
 * jemanden braucht.
 */
export function SchrittPruefen({
  projekt,
  angebot,
  setAngebot,
  alternative,
  setAlternative,
  annahmen,
  setAnnahmen,
  auswertung,
  quelle,
  dokument,
  weiter,
}: {
  projekt: Projekt;
  angebot: FcaAngebot;
  setAngebot: (a: FcaAngebot) => void;
  alternative: Alternative;
  setAlternative: (a: Alternative) => void;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
  auswertung: Auswertung;
  quelle: "dokument" | "manuell";
  dokument: Beispieldokument | null;
  weiter: () => void;
}) {
  const eingabe: SteuerungsEingabe = {
    projekt,
    angebot,
    setAngebot,
    alternative,
    setAlternative,
    annahmen,
    setAnnahmen,
  };
  const liste = useMemo(
    () => auslesen(projekt, angebot, alternative, quelle),
    [projekt, angebot, alternative, quelle],
  );
  const offen = offeneAuslesungen(liste);
  const belegt = liste.filter((a) => a.sicherheit === "belegt" || a.sicherheit === "vorbelegt");
  const [aufgeklappt, setAufgeklappt] = useState<string | null>(null);
  const [alleZeigen, setAlleZeigen] = useState(quelle === "manuell");

  const lauf = auswertung.p50Lauf;
  const groesse = ergebnisgroesse(projekt);
  const gewinner = auswertung.szenarien[auswertung.gewinner];
  const sichtbarBelegt = alleZeigen ? belegt : belegt.slice(0, 4);

  return (
    <div className="space-y-3">
      <SchrittKopf
        nummer={2}
        titel="Prüfen"
        was={
          quelle === "dokument" ? (
            <>
              Das sind die Angaben aus dem Schreiben, jede mit der Stelle, aus der sie stammt.
              Bestätigen musst du nichts. Sieh dir die oben an, der Rest steht so im Dokument.
            </>
          ) : (
            <>
              Ohne Schreiben starten wir von markttypischen Werten. Geh die Liste durch und ändere,
              was in deinem Angebot anders steht.
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="flex flex-col gap-4">
          <Karte>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="min-w-0 flex-grow">
                <div className="text-[17px] font-semibold tracking-tight">
                  {quelle === "dokument"
                    ? `${liste.length} Angaben gelesen, ${offen.length} brauchen dich`
                    : `${liste.length} Angaben, ${offen.length} brauchen dich`}
                </div>
                <p className="text-pretty text-muted-foreground">
                  {offen.length === 0
                    ? "Nichts Offenes. Du kannst direkt weiter."
                    : quelle === "dokument"
                      ? `${zaehle(liste, "unsicher")} nennt das Schreiben nur vage, ${zaehle(liste, "fehlt")} stehen in keinem Angebot.`
                      : "Ohne Schreiben sind alle Werte markttypisch gesetzt. Ändere, was in deinem Angebot anders steht."}
                </p>
              </div>
              <div className="flex shrink-0 gap-5">
                {([quelle === "dokument" ? "belegt" : "vorbelegt", "unsicher", "fehlt"] as const).map((s) => (
                  <div key={s} className="flex flex-col items-end gap-px">
                    <span className={cn("ziffern text-xl font-semibold", TON[s].farbe)}>
                      {zaehle(liste, s)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{TON[s].wort}</span>
                  </div>
                ))}
              </div>
            </div>
            {quelle === "dokument" ? (
              <p className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                <FileText className="size-3.5 shrink-0" />
                {dokument ? `${dokument.dateiname}, ${dokument.seiten} Seiten. ` : ""}
                Im Prototyp ist das Auslesen simuliert. Die Fundstellen sind hinterlegt, es wurde
                kein Dokument gelesen.
              </p>
            ) : null}
          </Karte>

          {offen.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="border-b border-border pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Sieh dir das an
              </h3>
              {offen.map((a) => (
                <article
                  key={a.schluessel}
                  className={cn("flex gap-3 rounded-md border p-3", TON[a.sicherheit].rand)}
                >
                  <span className="mt-0.5">
                    <Zeichen sicherheit={a.sicherheit} />
                  </span>
                  <div className="flex min-w-0 flex-grow flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{a.feld}</span>
                      <span className="ziffern shrink-0 text-[15px] font-semibold tabular-nums">
                        {a.wert}
                      </span>
                    </div>
                    {a.beleg ? <BelegZeile beleg={a.beleg} /> : null}
                    {a.begruendung ? (
                      <p className="text-pretty text-muted-foreground">{a.begruendung}</p>
                    ) : null}
                    <div className="border-t border-border pt-2">
                      <Steuerung schluessel={a.schluessel} e={eingabe} kompakt />
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          <section className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-1">
              <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {quelle === "dokument" ? "Aus dem Schreiben übernommen" : "Vorbelegte Angaben"}
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {quelle === "dokument" ? "anklicken zum Korrigieren" : "anklicken zum Ändern"}
              </span>
            </div>

            {sichtbarBelegt.map((a) => {
              const offenJetzt = aufgeklappt === a.schluessel;
              return (
                <div key={a.schluessel} className="border-b border-muted last:border-0">
                  <button
                    type="button"
                    onClick={() => setAufgeklappt(offenJetzt ? null : a.schluessel)}
                    className="flex w-full items-baseline gap-2.5 py-2 text-left hover:bg-muted/40"
                  >
                    <span className="self-center">
                      <Zeichen sicherheit={a.sicherheit} />
                    </span>
                    <span className="w-[210px] shrink-0 text-muted-foreground">{a.feld}</span>
                    <span className="ziffern w-[180px] shrink-0 font-semibold tabular-nums">
                      {a.wert}
                    </span>
                    {a.beleg ? (
                      <span className="min-w-0 flex-grow truncate text-[11px] text-muted-foreground">
                        <span className="italic">„{a.beleg.zitat}“</span> {a.beleg.fundstelle}
                      </span>
                    ) : (
                      <span className="flex-grow" />
                    )}
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 self-center text-muted-foreground transition-transform",
                        offenJetzt && "rotate-180",
                      )}
                    />
                  </button>
                  {offenJetzt ? (
                    <div className="pb-3 pl-[26px]">
                      <Steuerung schluessel={a.schluessel} e={eingabe} />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {belegt.length > sichtbarBelegt.length ? (
              <button
                type="button"
                onClick={() => setAlleZeigen(true)}
                className="flex items-center gap-2 py-2 text-akzent hover:text-accent-foreground"
              >
                <ChevronDown className="size-3.5" />
                <span className="border-b border-akzent">
                  {belegt.length - sichtbarBelegt.length} weitere Angaben
                </span>
              </button>
            ) : null}
          </section>
        </div>

        <div className="flex flex-col gap-3 lg:sticky lg:top-16 lg:h-fit">
          <Karte titel="Zwischenstand" hinweis="Rechnet bei jeder Korrektur neu, mit dem mittleren der drei Wetterjahre.">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">
                Szenario {auswertung.gewinner}, {gewinner.titel}
              </span>
              <span className="ziffern text-2xl font-semibold tracking-tight text-akzent">
                {fmtEur(gewinner.npvEur)}
              </span>
              <span className="ziffern text-[11px] text-muted-foreground">
                {fmtEur(auswertung.vorsprungEur)} vor der nächstbesten Variante
              </span>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <DauerlinienDiagramm lauf={lauf} projekt={projekt} hoehe={128} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-2.5">
              <div>
                <dt className="text-[11px] text-muted-foreground">Abregelung</dt>
                <dd className="ziffern font-semibold text-verlust">
                  {fmtProzent(lauf.abregelungProzent)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">{groesse.kurz} im Jahr</dt>
                <dd className="ziffern font-semibold">
                  {groesse.formatiere(groesse.wert(lauf))}
                </dd>
              </div>
            </dl>
          </Karte>

          {offen.length > 0 ? (
            <Karte className="border-mittel bg-mittel/8">
              <div className="font-semibold">Was die offenen Angaben bewegen</div>
              <p className="mt-1 text-pretty text-muted-foreground">
                Solange sie geschätzt sind, ist die Bandbreite zwischen P50 und P90 die belastbarere
                Aussage als der einzelne Kapitalwert. Auf dem Ergebnisscreen stehen sie als Fragen an
                den Netzbetreiber.
              </p>
            </Karte>
          ) : null}

          <button
            type="button"
            onClick={weiter}
            className="flex items-center justify-center gap-2 rounded-md bg-akzent px-4 py-2.5 font-semibold text-primary-foreground hover:bg-accent-foreground"
          >
            Weiter zum Ergebnis
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
