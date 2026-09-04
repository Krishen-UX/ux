"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSAR, type Begriffsname } from "@/lib/glossar";
import { cn } from "@/lib/utils";

/**
 * Woher eine Angabe kommt. Was nicht im Angebotsschreiben steht, muss der
 * Anschlussbegehrende erfragen oder schätzen, und genau dort sitzt die
 * Unsicherheit des Ergebnisses.
 */
export type Herkunft = "angebot" | "schaetzung";

const HERKUNFT_TEXT =
  "Diese Angabe steht in der Regel nicht im Angebotsschreiben. Beim Netzbetreiber erfragen, sonst schätzen und die Bandbreite über P90 und die Verhandlungsagenda absichern.";

function HerkunftsPunkt({ herkunft }: { herkunft?: Herkunft }) {
  if (herkunft !== "schaetzung") return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" aria-label="Herkunft der Angabe" className="shrink-0" />}
      >
        <span className="block size-1.5 rounded-full bg-mittel" />
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-pretty">{HERKUNFT_TEXT}</TooltipContent>
    </Tooltip>
  );
}

/** Fachbegriff im Fliesstext, Erklärung im Tooltip statt im Absatz. */
export function Begriff({
  name,
  children,
}: {
  name: Begriffsname;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="cursor-help underline decoration-dotted underline-offset-2 hover:text-foreground"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-pretty">{GLOSSAR[name]}</TooltipContent>
    </Tooltip>
  );
}

export function Hinweis({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Erläuterung"
            className="text-muted-foreground/60 hover:text-foreground"
          />
        }
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-pretty">{text}</TooltipContent>
    </Tooltip>
  );
}

function Beschriftung({
  text,
  hinweis,
  wert,
  herkunft,
}: {
  text: string;
  hinweis?: string;
  wert?: ReactNode;
  herkunft?: Herkunft;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="flex items-center gap-1 text-muted-foreground">
        <HerkunftsPunkt herkunft={herkunft} />
        {text}
        {hinweis ? <Hinweis text={hinweis} /> : null}
      </span>
      {wert !== undefined ? (
        <span className="ziffern font-medium tabular-nums">{wert}</span>
      ) : null}
    </div>
  );
}

export function Zahlenfeld({
  label,
  wert,
  setzen,
  einheit,
  hinweis,
  schritt = 1,
  min,
  max,
  teiler = 1,
  herkunft,
}: {
  label: string;
  wert: number;
  setzen: (n: number) => void;
  einheit?: string;
  hinweis?: string;
  schritt?: number;
  min?: number;
  max?: number;
  herkunft?: Herkunft;
  /** Große Beträge in Tausend anzeigen, damit die Ziffernfolge lesbar bleibt. */
  teiler?: number;
}) {
  return (
    <label className="block space-y-1">
      <Beschriftung text={label} hinweis={hinweis} herkunft={herkunft} />
      <div className="flex items-center rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
        <input
          type="number"
          value={Number.isFinite(wert) ? Math.round((wert / teiler) * 1000) / 1000 : ""}
          step={schritt / teiler}
          min={min === undefined ? undefined : min / teiler}
          max={max === undefined ? undefined : max / teiler}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            setzen(Number.isNaN(n) ? 0 : n * teiler);
          }}
          className="ziffern h-8 w-full bg-transparent px-2 text-right font-medium outline-none"
        />
        {einheit ? (
          <span className="shrink-0 pr-2 pl-1 text-[11px] text-muted-foreground">{einheit}</span>
        ) : null}
      </div>
    </label>
  );
}

export function Regler({
  label,
  wert,
  setzen,
  min,
  max,
  schritt = 1,
  einheit,
  hinweis,
  anzeige,
  deaktiviert,
  herkunft,
}: {
  label: string;
  wert: number;
  setzen: (n: number) => void;
  min: number;
  max: number;
  schritt?: number;
  einheit?: string;
  hinweis?: string;
  anzeige?: (n: number) => string;
  deaktiviert?: boolean;
  herkunft?: Herkunft;
}) {
  const text = anzeige ? anzeige(wert) : `${wert}${einheit ? ` ${einheit}` : ""}`;
  return (
    <div className={cn("space-y-1.5", deaktiviert && "pointer-events-none opacity-40")}>
      <Beschriftung text={label} hinweis={hinweis} wert={text} herkunft={herkunft} />
      <Slider
        value={[wert]}
        min={min}
        max={max}
        step={schritt}
        disabled={deaktiviert}
        onValueChange={(v) => setzen(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}

export function Schalter({
  label,
  an,
  setzen,
  hinweis,
}: {
  label: string;
  an: boolean;
  setzen: (b: boolean) => void;
  hinweis?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="flex items-center gap-1 text-muted-foreground">
        {label}
        {hinweis ? <Hinweis text={hinweis} /> : null}
      </span>
      <Switch checked={an} onCheckedChange={setzen} size="sm" />
    </div>
  );
}

export function Auswahl<T extends string>({
  label,
  wert,
  setzen,
  optionen,
  hinweis,
  herkunft,
}: {
  label?: string;
  wert: T;
  setzen: (w: T) => void;
  optionen: { wert: T; text: string }[];
  hinweis?: string;
  herkunft?: Herkunft;
}) {
  return (
    <div className="space-y-1">
      {label ? <Beschriftung text={label} hinweis={hinweis} herkunft={herkunft} /> : null}
      <Select value={wert} onValueChange={(v) => setzen(v as T)}>
        <SelectTrigger size="sm" className="w-full">
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
    </div>
  );
}

/** Große Kennzahl mit Beschriftung darunter. */
export function Kennzahl({
  label,
  wert,
  zusatz,
  ton = "neutral",
  gross,
  hinweis,
}: {
  label: string;
  wert: string;
  zusatz?: string;
  ton?: "neutral" | "akzent" | "verlust";
  gross?: boolean;
  hinweis?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {label}
        {hinweis ? <Hinweis text={hinweis} /> : null}
      </div>
      <div
        className={cn(
          "ziffern truncate font-semibold tabular-nums",
          gross ? "text-xl" : "text-[15px]",
          ton === "akzent" && "text-akzent",
          ton === "verlust" && "text-verlust",
        )}
      >
        {wert}
      </div>
      {zusatz ? <div className="text-[11px] text-muted-foreground">{zusatz}</div> : null}
    </div>
  );
}

export function Abschnitt({
  titel,
  aktion,
  children,
}: {
  titel: string;
  aktion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-1">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {titel}
        </h3>
        {aktion}
      </div>
      {children}
    </section>
  );
}
