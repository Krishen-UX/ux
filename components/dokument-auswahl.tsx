"use client";

import { Dices, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BEISPIELE, zufaelligesBeispiel, type Beispieldokument } from "@/data/beispiele";
import { ARCHETYP_TEXT } from "@/lib/sim/archetypen";
import { fmtZahl } from "@/lib/format";

/**
 * Dateiauswahl des Prototyps.
 *
 * Sieht aus wie ein Dateidialog, enthält aber erfundene Angebotsschreiben. Jedes
 * steht für einen anderen Archetyp, damit sich im Gespräch mehr als ein
 * Vertragstyp zeigen lässt.
 */
export function DokumentAuswahl({
  offen,
  schliessen,
  waehlen,
}: {
  offen: boolean;
  schliessen: () => void;
  waehlen: (d: Beispieldokument) => void;
}) {
  return (
    <Dialog open={offen} onOpenChange={(o) => (o ? undefined : schliessen())}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Angebotsschreiben auswählen</DialogTitle>
          <DialogDescription className="text-pretty">
            Der Prototyp hat keinen Zugriff auf deine Dateien. Diese vier Schreiben sind erfunden
            und stehen für je einen Vertragstyp.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-1.5">
          {BEISPIELE.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => waehlen(d)}
                className="flex w-full items-start gap-3 rounded-md border border-border p-2.5 text-left transition-colors hover:border-akzent hover:bg-akzent-schwach/60"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-grow flex-col gap-0.5">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-medium">{d.dateiname}</span>
                    <span className="shrink-0 rounded-full border border-border px-2 py-px text-[10px] text-muted-foreground">
                      {ARCHETYP_TEXT[d.angebot.archetyp ?? "statisch_kappung"].titel}
                    </span>
                  </span>
                  <span className="text-[11px] text-pretty text-muted-foreground">{d.kurz}</span>
                  <span className="ziffern text-[11px] text-muted-foreground">
                    {d.netzbetreiber}, eingegangen {d.eingegangen}, {d.seiten} Seiten,{" "}
                    {fmtZahl(d.groesseKb)} kB
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => waehlen(zufaelligesBeispiel())}
            className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5 font-medium hover:bg-muted"
          >
            <Dices className="size-3.5" />
            Eines zufällig nehmen
          </button>
          <button
            type="button"
            onClick={schliessen}
            className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
          >
            Abbrechen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
