"use client";

import { useEffect, useState } from "react";
import { Check, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SCHRITTE = [
  "Seiten erkannt",
  "Archetyp eingeordnet",
  "Grenzen und Fristen gelesen",
  "Fundstellen zugeordnet",
];

/**
 * Der Lauf des Auslesens.
 *
 * Im Prototyp wird nichts gelesen. Die Anzeige gibt es trotzdem, weil das
 * Warten Teil der Interaktion ist, die geprüft werden soll. Dass es simuliert
 * ist, steht dabei.
 */
export function AuslesenLauf({ dateiname, fertig }: { dateiname: string; fertig: () => void }) {
  const [stand, setStand] = useState(0);

  useEffect(() => {
    if (stand >= SCHRITTE.length) {
      const t = window.setTimeout(fertig, 420);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStand((s) => s + 1), 380);
    return () => window.clearTimeout(t);
  }, [stand, fertig]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="nicht-drucken fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="flex w-[380px] flex-col gap-3 rounded-md border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FileText className="size-4 shrink-0 text-akzent" />
          <span className="min-w-0 truncate font-semibold">{dateiname}</span>
        </div>
        <p className="-mt-1 text-[11px] text-muted-foreground">wird gelesen</p>
        <ol className="flex flex-col gap-1.5">
          {SCHRITTE.map((s, i) => (
            <li
              key={s}
              className={cn(
                "flex items-center gap-2 transition-opacity",
                i < stand ? "opacity-100" : i === stand ? "opacity-100" : "opacity-35",
              )}
            >
              {i < stand ? (
                <Check className="size-3.5 shrink-0 text-gut" strokeWidth={2.4} />
              ) : i === stand ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-akzent" />
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              <span className={i < stand ? "text-muted-foreground" : ""}>{s}</span>
            </li>
          ))}
        </ol>
        <p className="border-t border-border pt-2.5 text-[11px] text-pretty text-muted-foreground">
          Im Prototyp simuliert. Es wird kein Dokument gelesen, die Fundstellen sind hinterlegt.
        </p>
      </div>
    </div>
  );
}
