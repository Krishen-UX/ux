"use client";

import { Plus, X } from "lucide-react";
import type { Projekt, Zeitfenster } from "@/lib/typen";
import { WOCHENTAG_KURZ } from "@/lib/sim/kalender";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Regler } from "./felder";
import { fmtMW } from "@/lib/format";

/** Liste der Sperrfenster mit Wochentagen, Stundenbereich und Grenze. */
export function ZeitfensterEditor({
  fenster,
  setzen,
  projekt,
}: {
  fenster: Zeitfenster[];
  setzen: (f: Zeitfenster[]) => void;
  projekt: Projekt;
}) {
  const aendern = (i: number, teil: Partial<Zeitfenster>) =>
    setzen(fenster.map((f, j) => (i === j ? { ...f, ...teil } : f)));

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-pretty text-muted-foreground">
        Innerhalb eines Fensters gilt die Grenze, ausserhalb steht die volle Anschlussleistung zur
        Verfügung. Überlappende Fenster wirken zusammen, es gilt das jeweils schärfste.
      </p>
      {fenster.map((f, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border p-2.5">
          <div className="flex items-center justify-between gap-2">
            <ToggleGroup
              size="sm"
              variant="outline"
              value={f.tage.map(String)}
              onValueChange={(werte) => {
                const tage = (werte as string[]).map(Number).sort((a, b) => a - b);
                aendern(i, { tage: tage.length ? tage : [0] });
              }}
            >
              {WOCHENTAG_KURZ.map((tag, nr) => (
                <ToggleGroupItem
                  key={nr}
                  value={String(nr)}
                  className="w-8 px-0 text-[11px] aria-pressed:border-akzent aria-pressed:bg-akzent aria-pressed:text-primary-foreground"
                >
                  {tag}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {fenster.length > 1 ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fenster entfernen"
                onClick={() => setzen(fenster.filter((_, j) => j !== i))}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <Regler
              label="ab"
              hinweis="Erste Stunde, in der die Grenze gilt. Ein Fenster von 17 bis 20 Uhr umfasst die Stunden 17, 18 und 19."
              wert={f.vonStunde}
              setzen={(n) => aendern(i, { vonStunde: n })}
              min={0}
              max={23}
              anzeige={(n) => `${n}:00`}
            />
            <Regler
              label="bis"
              hinweis="Erste Stunde, in der die Grenze nicht mehr gilt. Liegt sie vor dem Startwert, läuft das Fenster über Mitternacht."
              wert={f.bisStunde}
              setzen={(n) => aendern(i, { bisStunde: n })}
              min={1}
              max={24}
              anzeige={(n) => `${n}:00`}
            />
            <Regler
              label="Grenze"
              hinweis="Zulässige Leistung innerhalb dieses Fensters. Ausserhalb gilt die volle Anschlussleistung."
              wert={f.limitMW}
              setzen={(n) => aendern(i, { limitMW: n })}
              min={0}
              max={projekt.netzanschlussLeistungMW}
              schritt={0.5}
              anzeige={fmtMW}
            />
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          setzen([
            ...fenster,
            { tage: [0, 1, 2, 3, 4], vonStunde: 17, bisStunde: 20, limitMW: projekt.netzanschlussLeistungMW / 2 },
          ])
        }
      >
        <Plus className="size-3.5" />
        Fenster hinzufügen
      </Button>
    </div>
  );
}
