"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { Szenario, SzenarioSchluessel } from "@/lib/typen";
import { barwertverlauf } from "@/lib/sim/diagramme";
import { fmtEur, fmtZahl } from "@/lib/format";
import { ACHSE, Diagramm, FARBEN, Kasten, Marke } from "./basis";
import { GLOSSAR } from "@/lib/glossar";

const STIL: Record<SzenarioSchluessel, { farbe: string; strich?: string }> = {
  A: { farbe: FARBEN.verlust },
  B: { farbe: FARBEN.linie, strich: "4 3" },
  C: { farbe: FARBEN.akzent },
};

/** Kumulierter Barwert der drei Szenarien über die Betrachtungsjahre. */
export function BarwertDiagramm({
  szenarien,
  diskontsatzProzent,
  hoehe,
}: {
  szenarien: Record<SzenarioSchluessel, Szenario>;
  diskontsatzProzent: number;
  hoehe?: number;
}) {
  const daten = useMemo(() => {
    const schluessel: SzenarioSchluessel[] = ["A", "B", "C"];
    const reihen = schluessel.map((s) =>
      barwertverlauf(szenarien[s].cashflows, diskontsatzProzent),
    );
    const laenge = Math.max(...reihen.map((r) => r.length));
    return Array.from({ length: laenge }, (_, jahr) => {
      const punkt: Record<string, number> = { jahr };
      schluessel.forEach((s, i) => {
        if (szenarien[s].verfuegbar && reihen[i][jahr]) punkt[s] = reihen[i][jahr].wert;
      });
      return punkt;
    });
  }, [szenarien, diskontsatzProzent]);

  return (
    <Diagramm
      titel="Kumulierter Barwert, Mio EUR"
      hinweis={GLOSSAR.barwertverlauf}
      hoehe={hoehe}
      legende={
        <>
          <Marke farbe={STIL.A.farbe} text="A" />
          <Marke farbe={STIL.B.farbe} text="B" />
          <Marke farbe={STIL.C.farbe} text="C" />
        </>
      }
    >
      <LineChart data={daten} margin={{ top: 4, right: 6, bottom: 0, left: 4 }}>
        <CartesianGrid stroke={FARBEN.raster} strokeDasharray="2 2" vertical={false} />
        <XAxis dataKey="jahr" tickFormatter={(v) => `${v}`} {...ACHSE} />
        <YAxis width={34} tickFormatter={(v) => fmtZahl(Number(v) / 1e6, 0)} {...ACHSE} />
        <ReferenceLine y={0} stroke={FARBEN.achse} strokeWidth={1} />
        <Tooltip
          cursor={{ stroke: FARBEN.achse, strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Kasten>
                <div className="ziffern space-y-0.5">
                  <div className="text-muted-foreground">Jahr {String(label)}</div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} style={{ color: p.color }}>
                      {String(p.dataKey)} {fmtEur(Number(p.value))}
                    </div>
                  ))}
                </div>
              </Kasten>
            ) : null
          }
        />
        {(["A", "B", "C"] as SzenarioSchluessel[]).map((s) =>
          szenarien[s].verfuegbar ? (
            <Line
              key={s}
              dataKey={s}
              stroke={STIL[s].farbe}
              strokeWidth={s === "B" ? 1.5 : 2}
              strokeDasharray={STIL[s].strich}
              dot={false}
              isAnimationActive={false}
            />
          ) : null,
        )}
      </LineChart>
    </Diagramm>
  );
}
