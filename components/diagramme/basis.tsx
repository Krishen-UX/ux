"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

/** Farben der Diagramme, abgeleitet aus den Design-Tokens. */
export const FARBEN = {
  akzent: "var(--akzent)",
  akzentSchwach: "var(--akzent-schwach)",
  verlust: "var(--verlust)",
  verlustSchwach: "var(--verlust-schwach)",
  linie: "oklch(0.72 0.01 240)",
  achse: "oklch(0.55 0.012 240)",
};

export const ACHSE = {
  stroke: "transparent",
  tick: { fill: FARBEN.achse, fontSize: 10 },
  tickLine: false,
  axisLine: false,
} as const;

export function Diagramm({
  titel,
  legende,
  hoehe = 180,
  children,
}: {
  titel: string;
  legende?: ReactNode;
  hoehe?: number;
  children: React.ReactElement;
}) {
  return (
    <figure className="space-y-1">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {titel}
        </span>
        {legende ? <span className="flex items-center gap-3 text-[11px]">{legende}</span> : null}
      </figcaption>
      <div style={{ height: hoehe }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function Marke({ farbe, text }: { farbe: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-[2px]" style={{ background: farbe }} />
      {text}
    </span>
  );
}

export function Kasten({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-2 py-1.5 text-[11px] shadow-sm">
      {children}
    </div>
  );
}
