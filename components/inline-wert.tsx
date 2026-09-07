"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Wert statt Feld.
 *
 * Die Zahl steht im Satz und ist zugleich die Eingabe. Ersetzt das Raster aus
 * beschrifteten Kästen, ohne die Tastaturbedienung aufzugeben.
 */
export function InlineZahl({
  wert,
  setzen,
  beschriftung,
  schritt = 1,
  min = 0,
  className,
}: {
  wert: number;
  setzen: (n: number) => void;
  beschriftung: string;
  schritt?: number;
  min?: number;
  className?: string;
}) {
  const stellen = String(Number.isFinite(wert) ? wert : "").length;
  return (
    <input
      type="number"
      aria-label={beschriftung}
      value={Number.isFinite(wert) ? wert : ""}
      step={schritt}
      min={min}
      onChange={(e) => {
        const n = e.target.valueAsNumber;
        setzen(Number.isNaN(n) ? 0 : n);
      }}
      style={{ width: `${Math.max(2, stellen) + 1.2}ch` }}
      className={cn(
        "ziffern border-b border-dashed border-muted-foreground bg-transparent text-center font-semibold tabular-nums outline-none",
        "focus:border-solid focus:border-akzent",
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
    />
  );
}

/** Dasselbe für eine Auswahl: der Wert steht im Satz, die Liste öffnet sich darunter. */
export function InlineAuswahl({
  wert,
  setzen,
  beschriftung,
  optionen,
}: {
  wert: string;
  setzen: (w: string) => void;
  beschriftung: string;
  optionen: { wert: string; text: string }[];
}) {
  return (
    <Select value={wert} onValueChange={(v) => setzen(v as string)}>
      <SelectTrigger
        aria-label={beschriftung}
        className="h-auto gap-1 rounded-none border-0 border-b border-dashed border-muted-foreground px-0 py-0 text-[15px] font-semibold hover:bg-transparent focus-visible:border-akzent focus-visible:ring-0"
      >
        <SelectValue>
          {(gewaehlt: unknown) =>
            optionen.find((o) => o.wert === gewaehlt)?.text ?? String(gewaehlt ?? "")
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {optionen.map((o) => (
          <SelectItem key={o.wert} value={o.wert}>
            {o.text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
