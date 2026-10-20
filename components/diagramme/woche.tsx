"use client";

import { useMemo } from "react";
import { Area, ComposedChart, Line, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { JahresLauf, Projekt } from "@/lib/typen";
import { schaerfsteWoche } from "@/lib/sim/diagramme";
import { WOCHENTAG_KURZ, stundenLabel } from "@/lib/sim/kalender";
import { fmtMW, fmtZahl } from "@/lib/format";
import { ACHSE, Diagramm, FARBEN, Kasten, Marke } from "./basis";
import { GLOSSAR } from "@/lib/glossar";

/** Ausschnitt der Woche mit der stärksten Abregelung. */
export function WochenDiagramm({
  lauf,
  projekt,
  hoehe,
}: {
  lauf: JahresLauf;
  projekt: Projekt;
  hoehe?: number;
}) {
  const daten = useMemo(() => schaerfsteWoche(lauf, projekt), [lauf, projekt]);
  const tagesgrenzen = daten.filter((p) => p.stunde === 0).map((p) => p.h);

  return (
    <Diagramm
      titel="Woche mit der stärksten Abregelung, MW"
      hinweis={GLOSSAR.wochenausschnitt}
      hoehe={hoehe}
      legende={
        <>
          <Marke farbe={FARBEN.akzent} text="genutzt" />
          <Marke farbe={FARBEN.verlust} text="abgeregelt" />
          <Marke farbe={FARBEN.linie} text="zulässig" />
        </>
      }
    >
      <ComposedChart data={daten} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <XAxis
          dataKey="h"
          type="number"
          domain={["dataMin", "dataMax"]}
          ticks={tagesgrenzen}
          tickFormatter={(v) => WOCHENTAG_KURZ[daten.find((p) => p.h === v)?.tag ?? 0]}
          interval={0}
          {...ACHSE}
        />
        <YAxis width={34} tickFormatter={(v) => fmtZahl(Number(v), 0)} {...ACHSE} />
        {tagesgrenzen.slice(1).map((h) => (
          <ReferenceLine key={h} x={h} stroke={FARBEN.raster} />
        ))}
        <Tooltip
          cursor={{ stroke: FARBEN.achse, strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <Kasten>
                <div className="ziffern space-y-0.5">
                  <div className="text-muted-foreground">{stundenLabel(p.h)}</div>
                  <div>fester Anschluss {fmtMW(p.referenz)}</div>
                  <div className="text-akzent">unter FCA {fmtMW(p.fca)}</div>
                  <div className="text-muted-foreground">
                    zulaessig {fmtMW(p.limit)}, Preis {fmtZahl(p.preis, 0)} EUR/MWh
                  </div>
                </div>
              </Kasten>
            );
          }}
        />
        <Area
          dataKey="referenz"
          stroke="none"
          fill={FARBEN.verlust}
          fillOpacity={0.85}
          isAnimationActive={false}
        />
        <Area
          dataKey="fca"
          stroke={FARBEN.akzent}
          strokeWidth={1}
          fill={FARBEN.akzent}
          fillOpacity={0.9}
          isAnimationActive={false}
        />
        <Line
          dataKey="limit"
          stroke={FARBEN.linie}
          strokeWidth={1.5}
          strokeDasharray="3 2"
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </Diagramm>
  );
}
