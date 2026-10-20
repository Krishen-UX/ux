"use client";

import { Add, Close } from "@carbon/icons-react";
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
    <div className="space-y-4">
      <p className="text-xs text-pretty text-helper">
        Innerhalb eines Fensters gilt die Grenze, ausserhalb steht die volle Anschlussleistung zur
        Verfügung. Überlappende Fenster wirken zusammen, es gilt das jeweils schärfste.
      </p>
      {fenster.map((f, i) => (
        <div key={i} className="space-y-6 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <ToggleGroup
              size="sm"
              variant="outline"
              spacing={0}
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
                  className="w-10 px-0"
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
                <Close />
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
        variant="ghost"
        size="sm"
        onClick={() =>
          setzen([
            ...fenster,
            { tage: [0, 1, 2, 3, 4], vonStunde: 17, bisStunde: 20, limitMW: projekt.netzanschlussLeistungMW / 2 },
          ])
        }
      >
        Fenster hinzufügen
        <Add />
      </Button>
    </div>
  );
}
