"use client";

import type { AnlagenTyp, Annahmen, Auswertung, Projekt } from "@/lib/typen";
import { ANLAGENTYPEN, BUNDESLAENDER, regelzoneVon } from "@/data/annahmen";
import { LASTPROFILE } from "@/lib/sim/profile";
import { fmtEur, fmtMWh, fmtProzent, fmtStunden, fmtZahl } from "@/lib/format";
import { Abschnitt, Auswahl, Kennzahl, WahlKachel, Zahlenfeld } from "./felder";
import { SchrittKopf } from "./schritt-kopf";
import { GLOSSAR } from "@/lib/glossar";
import { JahresprofilDiagramm } from "./diagramme/jahresprofil";
import { Karte } from "./karte";

export function SchrittProjekt({
  projekt,
  setProjekt,
  annahmen,
  setAnnahmen,
  typWechseln,
  auswertung,
}: {
  projekt: Projekt;
  setProjekt: (p: Projekt) => void;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
  typWechseln: (t: AnlagenTyp) => void;
  auswertung: Auswertung;
}) {
  const aendern = <K extends keyof Projekt>(feld: K, wert: Projekt[K]) =>
    setProjekt({ ...projekt, [feld]: wert });

  const lauf = auswertung.p50Lauf;
  const istLast = projekt.typ === "industrielle_last";
  const istSpeicher = projekt.typ === "bess";
  const ertrag = istLast ? lauf.entnahmeReferenzMWh : lauf.einspeisungReferenzMWh;
  const benutzungsstunden = ertrag / Math.max(1, projekt.netzanschlussLeistungMW);
  const ueberbauung =
    (projekt.installierteLeistungMW / Math.max(0.001, projekt.netzanschlussLeistungMW) - 1) * 100;
  const investition =
    projekt.capexProMW * projekt.installierteLeistungMW +
    (projekt.typ === "bess"
      ? (projekt.capexProMWhSpeicher ?? 0) * (projekt.speicherKapazitaetMWh ?? 0)
      : 0);

  return (
    <div className="space-y-8">
      <SchrittKopf
        nummer={1}
        titel="Projekt"
        was={
          <>
            Beschreibe die Anlage und ihre Wirtschaftlichkeit. Daraus entsteht der Referenzfall: was
            das Projekt an einem festen Anschluss ohne jede Einschränkung leisten würde. Alles
            Weitere wird gegen diesen Fall gemessen.
          </>
        }
        gebraucht={
          <>
            Leistung, Standort und die Investitionsannahmen aus deiner Projektkalkulation. Die
            Zeitreihen für Erzeugung und Preise bringt das Werkzeug mit.
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-10">
        <Abschnitt titel="Anlagentyp" hinweis="Bestimmt, wie das Projekt seinen Erlös erzielt und welche Richtung des Netzanschlusses das FCA überhaupt einschränken kann. Ein Wechsel setzt alle Eingaben zurück.">
          <div role="radiogroup" aria-label="Anlagentyp" className="grid gap-2 sm:grid-cols-3">
            {ANLAGENTYPEN.map((t) => (
              <WahlKachel
                key={t.typ}
                titel={t.titel}
                text={t.kurz}
                gewaehlt={projekt.typ === t.typ}
                waehlen={() => typWechseln(t.typ)}
              />
            ))}
          </div>
          <p className="text-xs text-helper">
            Ein Wechsel setzt alle Eingaben auf die Startwerte des Typs zurück.
          </p>
        </Abschnitt>

        <Abschnitt titel="Anlage" hinweis="Technische Eckdaten. Aus Leistung, Standort und Anschlussleistung entsteht der Referenzfall, gegen den alles Weitere gemessen wird.">
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Projektname</span>
              <input
                value={projekt.name}
                onChange={(e) => aendern("name", e.target.value)}
                className="h-10 w-full border-b border-border-strong bg-field px-4 text-sm transition-colors duration-[70ms] hover:bg-field-hover focus:outline-2 focus:-outline-offset-2 focus:outline-ring"
              />
            </label>

            <Zahlenfeld
              label="Installierte Leistung"
              einheit="MW"
              wert={projekt.installierteLeistungMW}
              setzen={(n) => aendern("installierteLeistungMW", Math.max(0.1, n))}
              hinweis="Anlagenseitige Leistung. Bei Überbauung liegt sie über der Anschlussleistung."
            />
            <Zahlenfeld
              label="Netzanschlussleistung"
              einheit="MW"
              wert={projekt.netzanschlussLeistungMW}
              setzen={(n) => aendern("netzanschlussLeistungMW", Math.max(0.1, n))}
              hinweis="Die Leistung, die bei einem festen Anschluss dauerhaft zur Verfügung stünde. Referenz für die Bewertung des FCA."
            />

            {projekt.typ === "bess" ? (
              <Zahlenfeld
                label="Speicherkapazität"
                einheit="MWh"
                wert={projekt.speicherKapazitaetMWh ?? 0}
                setzen={(n) => aendern("speicherKapazitaetMWh", Math.max(0.1, n))}
                hinweis="Nutzbare Energiemenge. Zusammen mit der Leistung ergibt sie die Entladedauer."
              />
            ) : null}

            {istLast ? (
              <Auswahl
                label="Lastprofil"
                wert={projekt.lastprofil ?? "g3_durchlaufend"}
                setzen={(w) => aendern("lastprofil", w)}
                optionen={Object.entries(LASTPROFILE).map(([wert, p]) => ({
                  wert: wert as NonNullable<Projekt["lastprofil"]>,
                  text: p.label,
                }))}
                hinweis="Nachbildung der BDEW-Gewerbeprofile. Bestimmt, wann die Last auf ein Sperrfenster trifft."
              />
            ) : null}

            <Auswahl
              label="Bundesland"
              wert={projekt.bundesland}
              setzen={(w) => aendern("bundesland", w)}
              optionen={BUNDESLAENDER.map((b) => ({ wert: b.name, text: b.name }))}
              hinweis="Bestimmt die Regelzone und damit das Erzeugungs- und Referenzprofil."
            />
            <Zahlenfeld
              label="Inbetriebnahme"
              hinweis={GLOSSAR.inbetriebnahme}
              wert={projekt.inbetriebnahmeJahr}
              setzen={(n) => aendern("inbetriebnahmeJahr", Math.round(n))}
              min={2026}
              max={2045}
            />
          </div>
        </Abschnitt>

        <Abschnitt titel="Wirtschaftlichkeit" hinweis="Investition, laufende Kosten und Kapitalkosten. Diese Werte entscheiden über die Höhe der Kapitalwerte, nicht über die Abregelung.">
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
            <Zahlenfeld
              label="Investition je MW"
              hinweis={GLOSSAR.investition}
              einheit="Tsd EUR"
              schritt={10_000}
              teiler={1_000}
              wert={projekt.capexProMW}
              setzen={(n) => aendern("capexProMW", Math.max(0, n))}
            />
            {projekt.typ === "bess" ? (
              <Zahlenfeld
                label="Investition je MWh"
                hinweis="Energieanteil der Investition, also die Batteriezellen. Zusammen mit dem Leistungsanteil ergibt sich die Gesamtinvestition."
                einheit="Tsd EUR"
                schritt={5_000}
                teiler={1_000}
                wert={projekt.capexProMWhSpeicher ?? 0}
                setzen={(n) => aendern("capexProMWhSpeicher", Math.max(0, n))}
              />
            ) : null}
            <Zahlenfeld
              label="Betriebskosten je MW und Jahr"
              hinweis={GLOSSAR.betriebskosten}
              einheit="Tsd EUR"
              schritt={500}
              teiler={1_000}
              wert={annahmen.opexProMWJahr}
              setzen={(n) => setAnnahmen({ ...annahmen, opexProMWJahr: Math.max(0, n) })}
            />
            <Zahlenfeld
              label="Betriebsdauer"
              hinweis={GLOSSAR.betriebsdauer}
              einheit="Jahre"
              wert={projekt.betriebsjahre}
              setzen={(n) => aendern("betriebsjahre", Math.max(1, Math.round(n)))}
              min={1}
              max={40}
            />
            <Zahlenfeld
              label="Kalkulationszins"
              einheit="%"
              schritt={0.5}
              wert={annahmen.diskontsatzProzent}
              setzen={(n) => setAnnahmen({ ...annahmen, diskontsatzProzent: n })}
              hinweis={GLOSSAR.kalkulationszins}
            />
            {istLast ? (
              <Zahlenfeld
                label="Deckungsbeitrag je MWh"
                einheit="EUR"
                wert={annahmen.wertProMWhEur}
                setzen={(n) => setAnnahmen({ ...annahmen, wertProMWhEur: n })}
                hinweis={GLOSSAR.deckungsbeitrag}
              />
            ) : null}
          </div>
        </Abschnitt>
      </div>

      <Karte className="h-fit lg:sticky lg:top-36">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          <Kennzahl
            label={istSpeicher ? "Jahreserlös" : istLast ? "Jahresbezug" : "Jahresertrag"}
            hinweis={
              istSpeicher
                ? "Erlös aus Arbitrage am Day-Ahead-Markt an einem festen Anschluss, vor Betriebskosten und ohne Systemdienstleistungen."
                : "Was das Projekt an einem festen Anschluss im mittleren Wetterjahr leisten würde. Referenz für alles Weitere."
            }
            wert={istSpeicher ? fmtEur(lauf.erloesReferenzEur) : fmtMWh(ertrag)}
            zusatz={istSpeicher ? "fester Anschluss, ohne Auflagen" : "fester Anschluss"}
            ton="akzent"
          />
          <Kennzahl
            label="Benutzungsstunden"
            wert={fmtStunden(benutzungsstunden)}
            zusatz={istSpeicher ? `${fmtMWh(ertrag)} Entladung` : "je MW Anschluss"}
            hinweis={GLOSSAR.vollbenutzungsstunden}
          />
          <Kennzahl
            label="Regelzone"
            wert={regelzoneVon(projekt.bundesland)}
            hinweis={GLOSSAR.regelzone}
            zusatz={
              ueberbauung > 0.5
                ? `Ueberbauung plus ${fmtProzent(ueberbauung, 0)}`
                : "keine Überbauung"
            }
          />
          <Kennzahl
            label="Investition"
            wert={fmtEur(investition)}
            zusatz="ohne Baukostenzuschuss"
            hinweis={GLOSSAR.investition}
          />
        </div>

        <div className="mt-8">
          <JahresprofilDiagramm lauf={lauf} projekt={projekt} annahmen={annahmen} hoehe={170} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border-subtle pt-4">
          {auswertung.laeufe.map((l) => {
            const menge = istLast ? l.entnahmeReferenzMWh : l.einspeisungReferenzMWh;
            return (
              <Kennzahl
                key={l.jahr}
                label={`Wetterjahr ${l.jahr}`}
                hinweis={GLOSSAR.wetterjahr}
                wert={istSpeicher ? fmtEur(l.erloesReferenzEur) : fmtMWh(menge)}
                zusatz={
                  istSpeicher
                    ? `${fmtMWh(menge)} Entladung`
                    : `${fmtZahl(menge / Math.max(1, projekt.netzanschlussLeistungMW), 0)} h`
                }
              />
            );
          })}
        </div>
        <p className="mt-4 text-xs text-pretty text-helper">
          Grundlage sind die Ist-Reihen der Regelzone aus drei Wetterjahren. Das mittlere Jahr trägt
          die Kapitalwerte, das schwächste mit verschärftem Engpass den P90-Fall.
        </p>
      </Karte>
      </div>
    </div>
  );
}
