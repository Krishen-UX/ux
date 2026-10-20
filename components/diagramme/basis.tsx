"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { Hinweis } from "../felder";

/** Farben der Diagramme, abgeleitet aus den Design-Tokens. */
export const FARBEN = {
  akzent: "var(--akzent)",
  akzentSchwach: "var(--akzent-schwach)",
  verlust: "var(--verlust)",
  verlustSchwach: "var(--verlust-schwach)",
  linie: "#8d8d8d",
  achse: "#525252",
  raster: "#c6c6c6",
};

export const ACHSE = {
  stroke: "transparent",
  tick: { fill: FARBEN.achse, fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export function Diagramm({
  titel,
  legende,
  hoehe = 180,
  hinweis,
  children,
}: {
  titel: string;
  legende?: ReactNode;
  hoehe?: number;
  hinweis?: string;
  children: React.ReactElement;
}) {
  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {titel}
          {hinweis ? <Hinweis text={hinweis} /> : null}
        </span>
        {legende ? <span className="flex items-center gap-4 text-xs">{legende}</span> : null}
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
      <span className="size-3" style={{ background: farbe }} />
      {text}
    </span>
  );
}

export function Kasten({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-4 border-primary bg-background px-3 py-2 text-xs shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
      {children}
    </div>
  );
}
