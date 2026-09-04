"use client";

import { useMemo } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import type { Annahmen, JahresLauf, Projekt } from "@/lib/typen";
import { tageswerte } from "@/lib/sim/diagramme";
import { MONATE } from "@/lib/sim/kalender";
import { fmtEur, fmtMWh, fmtZahl } from "@/lib/format";
import { ACHSE, Diagramm, FARBEN, Kasten } from "./basis";
import { GLOSSAR } from "@/lib/glossar";

/**
 * Vorschau im Projektformular. Bei Erzeugung und Last zeigt die Tagesarbeit den
 * Jahresgang, beim Speicher ist sie durch das Zyklenbudget flach, dort wird der
 * Tageserlös gezeigt.
 */
export function JahresprofilDiagramm({
  lauf,
  projekt,
  annahmen,
  hoehe = 150,
}: {
  lauf: JahresLauf;
  projekt: Projekt;
  annahmen: Annahmen;
  hoehe?: number;
}) {
  const daten = useMemo(() => tageswerte(lauf, projekt, annahmen), [lauf, projekt, annahmen]);
  const zeigeErloes = projekt.typ === "bess";
  const feld = zeigeErloes ? "erloes" : "arbeit";

  const monatsanfaenge = useMemo(() => {
    const aus: number[] = [];
    let letzter = -1;
    daten.forEach((p) => {
      if (p.monat !== letzter) {
        aus.push(p.tag);
        letzter = p.monat;
      }
    });
    return aus;
  }, [daten]);

  return (
    <Diagramm
      hinweis={GLOSSAR.tagesvorschau}
      titel={
        zeigeErloes
          ? `Tageserloes aus Arbitrage im Wetterjahr ${lauf.jahr}, Tsd EUR`
          : `Tagesarbeit im Wetterjahr ${lauf.jahr}, MWh`
      }
      hoehe={hoehe}
    >
      <AreaChart data={daten} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
        <XAxis
          dataKey="tag"
          type="number"
          domain={[0, 364]}
          ticks={monatsanfaenge}
          tickFormatter={(v) => MONATE[daten[Number(v)]?.monat ?? 0].slice(0, 3)}
          interval={0}
          {...ACHSE}
        />
        <YAxis
          width={34}
          tickFormatter={(v) => fmtZahl(zeigeErloes ? Number(v) / 1000 : Number(v), 0)}
          {...ACHSE}
        />
        <Tooltip
          cursor={{ stroke: FARBEN.achse, strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <Kasten>
                <div className="ziffern space-y-0.5">
                  <div className="text-muted-foreground">
                    {new Date(Date.UTC(2023, 0, 1 + p.tag)).getUTCDate()}. {MONATE[p.monat]}
                  </div>
                  <div>{fmtMWh(p.arbeit)} am Tag</div>
                  <div className="text-akzent">{fmtEur(p.erloes, false)}</div>
                </div>
              </Kasten>
            );
          }}
        />
        <Area
          dataKey={feld}
          stroke={FARBEN.akzent}
          strokeWidth={1}
          fill={FARBEN.akzent}
          fillOpacity={0.18}
          isAnimationActive={false}
        />
      </AreaChart>
    </Diagramm>
  );
}
