"use client";

import type { Alternative, Annahmen, Auswertung, FcaAngebot, Projekt } from "@/lib/typen";
import { ARCHETYP_TEXT } from "@/lib/sim/archetypen";
import { regelzoneVon } from "@/data/annahmen";
import { WOCHENTAG_KURZ } from "@/lib/sim/kalender";
import { LASTPROFILE } from "@/lib/sim/profile";
import { umstellungsJahr } from "@/lib/sim/szenarien";
import { fmtEur, fmtJahre, fmtMW, fmtMWh, fmtProzent, fmtStunden, fmtZahl } from "@/lib/format";
import { ergebnisgroesse } from "@/lib/kennzahlen";
import { empfehlung } from "./empfehlung";
import { SensitivitaetsBalken } from "./diagramme/sensitivitaet";
import { cn } from "@/lib/utils";

function Zeile({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-[3px] last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="ziffern text-right font-medium tabular-nums">{v}</dd>
    </div>
  );
}

function Block({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="seitenumbruch-vermeiden">
      <h3 className="mb-1 border-b border-foreground/25 pb-0.5 text-[10px] font-bold tracking-wider uppercase">
        {titel}
      </h3>
      <dl>{children}</dl>
    </section>
  );
}

/**
 * Einseitiges Faktenblatt als Anlage zur Rückmeldung an den Netzbetreiber.
 * Der Export läuft über die Druckansicht des Browsers.
 */
export function Faktenblatt({
  projekt,
  angebot,
  annahmen,
  alternative,
  auswertung,
}: {
  projekt: Projekt;
  angebot: FcaAngebot;
  annahmen: Annahmen;
  alternative: Alternative;
  auswertung: Auswertung;
}) {
  const e = empfehlung(auswertung, projekt);
  const p50 = auswertung.p50Lauf;
  const p90 = auswertung.p90Lauf;
  const istLast = projekt.typ === "industrielle_last";
  const istSpeicher = projekt.typ === "bess";
  const groesse = ergebnisgroesse(projekt);
  const gewinner = auswertung.szenarien[auswertung.gewinner];
  const heute = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const grenze = istLast ? angebot.maxEntnahmeleistungMW : angebot.maxEinspeiseleistungMW;
  const grenzeText =
    angebot.archetyp === "zeitfenster"
      ? angebot.zeitfenster
          .map(
            (f) =>
              `${f.tage.map((t) => WOCHENTAG_KURZ[t]).join("")} ${f.vonStunde} bis ${f.bisStunde} Uhr auf ${fmtMW(f.limitMW)}`,
          )
          .join("; ")
      : `${fmtMW(grenze)} von ${fmtMW(projekt.netzanschlussLeistungMW)}`;

  return (
    <div className="druckseite mx-auto max-w-[820px] rounded-md border border-border bg-card p-6 print:max-w-none">
      <header className="flex items-start justify-between gap-6 border-b-2 border-foreground pb-2">
        <div>
          <h1 className="text-lg leading-tight font-bold">
            Bewertung des Angebots für einen flexiblen Netzanschluss
          </h1>
          <p className="text-muted-foreground">
            {projekt.name}, {fmtMW(projekt.installierteLeistungMW)} in {projekt.bundesland},
            Regelzone {regelzoneVon(projekt.bundesland)}
          </p>
        </div>
        <div className="shrink-0 text-right text-[10px] text-muted-foreground">
          <div className="font-semibold text-foreground">FCA Assessor</div>
          <div>{heute}</div>
        </div>
      </header>

      <section
        className={cn(
          "my-3 border-l-[3px] py-1.5 pl-3",
          e.ampel === "gut"
            ? "border-gut"
            : e.ampel === "mittel"
              ? "border-mittel"
              : "border-schlecht",
        )}
      >
        <div className="text-[10px] font-bold tracking-wider uppercase">
          Ergebnis: Szenario {auswertung.gewinner}, {gewinner.titel}
        </div>
        <p className="mt-0.5 text-[15px] leading-snug font-semibold text-pretty">{e.satz}</p>
        <p className="mt-0.5 text-[11px] text-pretty text-muted-foreground">{e.begruendung}</p>
      </section>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Block titel="Projekt">
          <Zeile
            k="Anlagentyp"
            v={
              projekt.typ === "bess"
                ? "Batteriespeicher"
                : projekt.typ === "pv_freiflaeche"
                  ? "PV Freifläche"
                  : LASTPROFILE[projekt.lastprofil ?? "g3_durchlaufend"].label
            }
          />
          <Zeile k="Installierte Leistung" v={fmtMW(projekt.installierteLeistungMW)} />
          {projekt.typ === "bess" ? (
            <Zeile k="Speicherkapazität" v={`${fmtZahl(projekt.speicherKapazitaetMWh ?? 0)} MWh`} />
          ) : null}
          <Zeile k="Netzanschlussleistung" v={fmtMW(projekt.netzanschlussLeistungMW)} />
          <Zeile k="Betriebsdauer" v={`${projekt.betriebsjahre} Jahre`} />
          <Zeile k="Kalkulationszins" v={fmtProzent(annahmen.diskontsatzProzent, 1)} />
        </Block>

        <Block titel="Bewertetes Angebot">
          <Zeile k="Archetyp" v={ARCHETYP_TEXT[angebot.archetyp].titel} />
          <Zeile k="Grenze" v={grenzeText} />
          {angebot.archetyp === "dynamisch_referenzanlage" ? (
            <Zeile
              k="Auslöser"
              v={`${angebot.referenzreihe === "pv" ? "PV" : "Wind"} über ${Math.round(angebot.schwellwert * 100)} Prozent`}
            />
          ) : null}
          {angebot.archetyp === "volldynamisch" ? (
            <Zeile
              k="Engpassannahme"
              v={`${fmtProzent(angebot.engpassHäufigkeitProzent, 1)} der Stunden, Kopplung ${Math.round(angebot.engpassKorrelation * 100)} Prozent`}
            />
          ) : null}
          <Zeile
            k="Zugangsprinzip"
            v={
              angebot.zugangsprinzip === "lifo"
                ? `LIFO, Position ${angebot.positionImStack} von ${angebot.anzahlImStack}`
                : "pro rata"
            }
          />
          <Zeile
            k="Entschädigung"
            v={
              angebot.entschaedigung === "keine"
                ? "keine"
                : angebot.entschaedigung === "voll"
                  ? "voller Ersatz"
                  : `${angebot.entschaedigungSatzEurProMWh} EUR/MWh`
            }
          />
          <Zeile
            k="Auflagen"
            v={
              [
                angebot.blindleistungsAuflage ? "Blindleistung" : null,
                angebot.systemdienstleistungenEingeschraenkt ? "Systemdienstleistungen gesperrt" : null,
                `Gradient ${angebot.leistungsgradientProzentProMin} Prozent je Minute`,
              ]
                .filter(Boolean)
                .join(", ") || "keine"
            }
          />
          <Zeile
            k="Laufzeit"
            v={`${angebot.laufzeitJahre} Jahre, fester Anschluss ab Jahr ${alternative.festerAnschlussVerfuegbarAbJahr ?? "offen"}`}
          />
        </Block>

        <Block titel={`${groesse.kurz} und ${istLast ? "Kuerzung" : "Abregelung"}`}>
          <Zeile
            k="Ohne Einschränkung"
            v={
              istSpeicher
                ? fmtEur(p50.erloesReferenzEur)
                : fmtMWh(istLast ? p50.entnahmeReferenzMWh : p50.einspeisungReferenzMWh)
            }
          />
          <Zeile k="Unter dem Angebot, P50" v={groesse.formatiere(groesse.wert(p50))} />
          <Zeile k="Unter dem Angebot, P90" v={groesse.formatiere(groesse.wert(p90))} />
          <Zeile
            k="Abregelung P50"
            v={`${fmtProzent(p50.abregelungProzent)} in ${fmtStunden(p50.abregelungStunden)}`}
          />
          <Zeile
            k="Abregelung P90"
            v={`${fmtProzent(p90.abregelungProzent)} in ${fmtStunden(p90.abregelungStunden)}`}
          />
          <Zeile
            k="Erlösverlust im Jahr 1"
            v={fmtEur(p50.erloesReferenzEur - p50.erloesFcaEur - p50.entschaedigungEur)}
          />
        </Block>

        <Block titel="Szenarienvergleich, Kapitalwert">
          {(["A", "B", "C"] as const).map((s) => {
            const z = auswertung.szenarien[s];
            return (
              <Zeile
                key={s}
                k={`${s}: ${z.titel}${z.verfuegbar ? "" : ", nicht bewertbar"}`}
                v={z.verfuegbar ? `${fmtEur(z.npvEur)}, P90 ${fmtEur(z.npvP90Eur)}` : "-"}
              />
            );
          })}
          <Zeile k="Vorsprung des Gewinners" v={fmtEur(auswertung.vorsprungEur)} />
          <Zeile k="Amortisation" v={fmtJahre(gewinner.amortisationJahre)} />
          <Zeile
            k="Umstellung in Szenario C"
            v={`Jahr ${umstellungsJahr(angebot, alternative)}`}
          />
        </Block>
      </div>

      <section className="mt-4 seitenumbruch-vermeiden">
        <h3 className="mb-2 border-b border-foreground/25 pb-0.5 text-[10px] font-bold tracking-wider uppercase">
          Punkte für die Nachverhandlung, nach Wirkung auf den Kapitalwert
        </h3>
        <SensitivitaetsBalken posten={auswertung.sensitivitaet} anzahl={5} />
      </section>

      <footer className="mt-4 border-t border-border pt-2 text-[9px] leading-relaxed text-pretty text-muted-foreground">
        Berechnung über 8.760 Stunden je Wetterjahr auf Basis der Ist-Reihen für Photovoltaik,
        Wind onshore und Day-Ahead-Preise der Bundesnetzagentur, SMARD.de, CC BY 4.0, Jahre 2023 bis
        2025. Lastprofile sind an die BDEW-Gewerbeprofile angelehnt, Engpassprofile sind synthetisch
        und über Häufigkeit und Kopplung an die regionale Erzeugung parametrisiert. Ohne Lastfluss
        und ohne Netzmodell. P90 ist das schwächste der drei Wetterjahre mit einem um den Faktor{" "}
        {annahmen.engpassStressfaktorP90.toFixed(1)} verschärften Engpass, kein Monte Carlo. Die
        Ergebnisse ersetzen keine Netzberechnung und keine Anlageberatung.
      </footer>
    </div>
  );
}
