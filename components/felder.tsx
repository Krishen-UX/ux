"use client";

import { Add, CheckmarkFilled, Information, Subtract, WarningAltFilled } from "@carbon/icons-react";
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
        <WarningAltFilled className="size-4 text-mittel" />
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
            className="cursor-help border-b border-dotted border-current hover:text-foreground"
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
            className="text-muted-foreground hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring"
          />
        }
      >
        <Information className="size-4" />
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
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">
        <HerkunftsPunkt herkunft={herkunft} />
        {text}
        {hinweis ? <Hinweis text={hinweis} /> : null}
      </span>
      {wert !== undefined ? (
        <span className="ziffern text-sm text-foreground tabular-nums">{wert}</span>
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
  const anzeigeWert = Math.round((wert / teiler) * 1000) / 1000;
  const stufe = (richtung: 1 | -1) => {
    let n = wert + richtung * schritt;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    setzen(Math.round(n * 1e6) / 1e6);
  };
  return (
    <label className="block space-y-2">
      <Beschriftung text={label} hinweis={hinweis} herkunft={herkunft} />
      <div className="flex h-10 items-center border-b border-border-strong bg-field transition-colors duration-[70ms] focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ring hover:bg-field-hover">
        <input
          type="number"
          value={Number.isFinite(wert) ? anzeigeWert : ""}
          step={schritt / teiler}
          min={min === undefined ? undefined : min / teiler}
          max={max === undefined ? undefined : max / teiler}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            setzen(Number.isNaN(n) ? 0 : n * teiler);
          }}
          className="ziffern h-full w-full min-w-0 bg-transparent pl-4 text-sm outline-none"
        />
        {einheit ? (
          <span className="shrink-0 pr-2 pl-1 text-xs text-helper">{einheit}</span>
        ) : null}
        {/* Stufentasten wie im Carbon Number Input, per Tastatur reichen die Pfeiltasten. */}
        <span className="flex h-full shrink-0 items-center">
          <button
            type="button"
            tabIndex={-1}
            aria-label={`${label} verringern`}
            onClick={() => stufe(-1)}
            className="flex h-full w-10 items-center justify-center transition-colors duration-[70ms] outline-none hover:bg-layer-selected"
          >
            <Subtract className="size-4" />
          </button>
          <span className="h-4 w-px bg-border-subtle" />
          <button
            type="button"
            tabIndex={-1}
            aria-label={`${label} erhöhen`}
            onClick={() => stufe(1)}
            className="flex h-full w-10 items-center justify-center transition-colors duration-[70ms] outline-none hover:bg-layer-selected"
          >
            <Add className="size-4" />
          </button>
        </span>
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
    <div className={cn("space-y-2", deaktiviert && "pointer-events-none opacity-40")}>
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
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex items-center gap-1 text-sm text-foreground">
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
    <div className="space-y-2">
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
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="truncate">{label}</span>
        {hinweis ? <Hinweis text={hinweis} /> : null}
      </div>
      <div
        className={cn(
          "ziffern mt-1 truncate tabular-nums",
          gross ? "text-xl font-light" : "text-base font-semibold",
          ton === "akzent" && "text-akzent",
          ton === "verlust" && "text-verlust",
        )}
      >
        {wert}
      </div>
      {zusatz ? <div className="mt-0.5 text-xs text-helper">{zusatz}</div> : null}
    </div>
  );
}

export function Abschnitt({
  titel,
  aktion,
  hinweis,
  children,
}: {
  titel: string;
  aktion?: ReactNode;
  hinweis?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-base font-semibold">
          {titel}
          {hinweis ? <Hinweis text={hinweis} /> : null}
        </h3>
        {aktion}
      </div>
      {children}
    </section>
  );
}

/** Auswahlkachel nach dem Carbon Radio Tile, ausgewählt mit Rahmen und Haken. */
export function WahlKachel({
  titel,
  text,
  gewaehlt,
  waehlen,
}: {
  titel: string;
  text: string;
  gewaehlt: boolean;
  waehlen: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={gewaehlt}
      onClick={waehlen}
      className={cn(
        "relative min-h-16 bg-card p-4 pr-10 text-left transition-colors duration-[70ms] hover:bg-layer-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        gewaehlt && "outline-2 -outline-offset-2 outline-layer-selected-inverse",
      )}
    >
      {gewaehlt ? (
        <CheckmarkFilled className="absolute top-4 right-4 size-4 text-foreground" />
      ) : (
        <span className="absolute top-4 right-4 size-4 rounded-full border border-border-strong" />
      )}
      <div className="text-sm font-semibold">{titel}</div>
      <div className="mt-1 text-xs text-pretty text-muted-foreground">{text}</div>
    </button>
  );
}
