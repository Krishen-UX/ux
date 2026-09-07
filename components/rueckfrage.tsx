"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Alternative, FcaAngebot, Projekt, SensitivitaetsPosten } from "@/lib/typen";
import type { Datenluecke } from "@/lib/datenluecken";
import { ARCHETYP_TEXT } from "@/lib/sim/archetypen";
import { Karte } from "./karte";

/**
 * Entwurf der Rückmeldung an den Netzbetreiber.
 *
 * Zieht zusammen, was das Werkzeug ohnehin weiss: die Angaben, die im Schreiben
 * fehlen, und die Punkte, die den Kapitalwert am stärksten bewegen. Was sich
 * nicht aus dem Modell ergibt, bleibt als Klammer stehen.
 */
export function entwurfRueckfrage(
  projekt: Projekt,
  angebot: FcaAngebot,
  luecken: Datenluecke[],
  posten: SensitivitaetsPosten[],
): string {
  const zeilen: string[] = [];
  zeilen.push(
    `Betreff: Rückfragen zum Angebot für einen flexiblen Netzanschluss, ${projekt.name}`,
    "",
    "Sehr geehrte Damen und Herren,",
    "",
    `vielen Dank für Ihr Angebot vom [DATUM DES SCHREIBENS] für einen flexiblen Netzanschluss unseres Vorhabens ${projekt.name} (${ARCHETYP_TEXT[angebot.archetyp].titel}).`,
  );

  if (luecken.length > 0) {
    zeilen.push(
      "",
      "Für eine belastbare Bewertung fehlen uns folgende Angaben:",
      "",
      ...luecken.map((l, i) => `${i + 1}. ${l.angabe}: ${l.frage}`),
    );
  }

  const punkte = posten.slice(0, 3);
  if (punkte.length > 0) {
    zeilen.push(
      "",
      "Darüber hinaus möchten wir folgende Punkte zur Diskussion stellen, in dieser Reihenfolge:",
      "",
      ...punkte.map((p, i) => `${i + 1}. ${p.verhandlungspunkt}`),
    );
  }

  zeilen.push(
    "",
    "Für einen Termin zur Abstimmung stehen wir gern zur Verfügung.",
    "",
    "Mit freundlichen Grüssen",
    "[NAME], [FUNKTION], [UNTERNEHMEN]",
  );
  return zeilen.join("\n");
}

export function Rueckfrage({
  projekt,
  angebot,
  alternative,
  luecken,
  posten,
}: {
  projekt: Projekt;
  angebot: FcaAngebot;
  alternative: Alternative;
  luecken: Datenluecke[];
  posten: SensitivitaetsPosten[];
}) {
  const text = useMemo(
    () => entwurfRueckfrage(projekt, angebot, luecken, posten),
    [projekt, angebot, luecken, posten],
  );
  const [kopiert, setKopiert] = useState(false);

  return (
    <Karte
      titel="Entwurf der Rückmeldung"
      hinweis="Zusammengesetzt aus den offenen Angaben und den drei teuersten Vertragspunkten. Alles in eckigen Klammern musst du selbst einsetzen."
      aktion={
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setKopiert(true);
              window.setTimeout(() => setKopiert(false), 2000);
            } catch {
              setKopiert(false);
            }
          }}
          className="flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-[11px] font-medium normal-case hover:bg-muted"
        >
          {kopiert ? <Check className="size-3.5 text-gut" /> : <Copy className="size-3.5" />}
          {kopiert ? "kopiert" : "kopieren"}
        </button>
      }
    >
      <pre className="max-h-[420px] overflow-auto rounded-md bg-muted/60 p-3 font-sans text-[12px] leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
      {alternative.festerAnschlussVerfuegbarAbJahr === null ? (
        <p className="mt-2 text-[11px] text-pretty text-muted-foreground">
          Ohne Termin für den Netzausbau steht die wichtigste Frage ganz oben. Ohne sie lässt sich
          das Warten nicht gegen das Angebot rechnen.
        </p>
      ) : null}
    </Karte>
  );
}
