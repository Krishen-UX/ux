"use client";

import type { SensitivitaetsPosten } from "@/lib/typen";
import { fmtEurVorzeichen } from "@/lib/format";
import { FARBEN } from "./basis";

/**
 * Wirkung der Vertragsparameter auf den Kapitalwert, absteigend sortiert.
 * Das ist die Verhandlungsagenda, deshalb ohne Diagrammrahmen und mit dem
 * Verhandlungspunkt direkt am Balken.
 */
export function SensitivitaetsBalken({
  posten,
  anzahl = 5,
  mitText = true,
}: {
  posten: SensitivitaetsPosten[];
  anzahl?: number;
  mitText?: boolean;
}) {
  const sichtbar = posten.slice(0, anzahl);
  const spitze = Math.max(1, ...sichtbar.map((p) => Math.abs(p.deltaNpvEur)));

  if (sichtbar.length === 0) {
    return (
      <p className="text-muted-foreground">
        Kein Vertragsparameter dieses Angebots verändert den Kapitalwert messbar.
      </p>
    );
  }

  return (
    <ol className="space-y-4 print:space-y-1.5">
      {sichtbar.map((p, i) => {
        const positiv = p.deltaNpvEur >= 0;
        const breite = (Math.abs(p.deltaNpvEur) / spitze) * 100;
        return (
          <li key={p.schluessel} className="seitenumbruch-vermeiden space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="ziffern w-4 shrink-0 text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <span className="truncate">{p.parameter}</span>
                <span className="shrink-0 truncate text-xs text-muted-foreground">
                  {p.aenderung}
                </span>
              </span>
              <span
                className="ziffern shrink-0 font-semibold tabular-nums"
                style={{ color: positiv ? FARBEN.akzent : FARBEN.verlust }}
              >
                {fmtEurVorzeichen(p.deltaNpvEur)}
              </span>
            </div>
            <div className="ml-5.5 h-2 bg-layer-selected">
              <div
                className="h-full"
                style={{
                  width: `${breite}%`,
                  background: positiv ? FARBEN.akzent : FARBEN.verlust,
                }}
              />
            </div>
            {mitText ? (
              <p className="ml-5.5 text-xs text-pretty text-helper print:text-[10px]">
                {p.verhandlungspunkt}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
