"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { JahresLauf, Projekt } from "@/lib/typen";
import { dauerlinie } from "@/lib/sim/diagramme";
import { fmtMW, fmtProzent, fmtZahl } from "@/lib/format";
import { ACHSE, Diagramm, FARBEN, Kasten, Marke } from "./basis";

/**
 * Jahresdauerlinie. Die eingefärbte Fläche zwischen beiden Kurven ist die
 * abgeregelte Arbeit.
 */
export function DauerlinienDiagramm({
  lauf,
  projekt,
  hoehe,
}: {
  lauf: JahresLauf;
  projekt: Projekt;
  hoehe?: number;
}) {
  const daten = useMemo(() => dauerlinie(lauf, projekt), [lauf, projekt]);

  return (
    <Diagramm
      titel={`Jahresdauerlinie ${lauf.jahr}, MW`}
      hoehe={hoehe}
      legende={
        <>
          <Marke farbe={FARBEN.akzent} text="genutzt" />
          <Marke farbe={FARBEN.verlust} text="abgeregelt" />
        </>
      }
    >
      <AreaChart data={daten} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="anteil"
          type="number"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v} %`}
          {...ACHSE}
        />
        <YAxis width={34} tickFormatter={(v) => fmtZahl(Number(v), 0)} {...ACHSE} />
        <Tooltip
          cursor={{ stroke: FARBEN.achse, strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Kasten>
                <div className="ziffern space-y-0.5">
                  <div className="text-muted-foreground">
                    {fmtProzent(Number(label), 0)} der Jahresstunden
                  </div>
                  <div>fester Anschluss {fmtMW(Number(payload[0]?.payload.referenz))}</div>
                  <div className="text-akzent">
                    unter FCA {fmtMW(Number(payload[0]?.payload.fca))}
                  </div>
                </div>
              </Kasten>
            ) : null
          }
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
      </AreaChart>
    </Diagramm>
  );
}
