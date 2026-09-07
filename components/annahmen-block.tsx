"use client";

import type { Annahmen, Projekt } from "@/lib/typen";
import { QUELLEN } from "@/lib/sim/profile";
import { Auswahl, Regler, Schalter, Zahlenfeld } from "./felder";
import { GLOSSAR } from "@/lib/glossar";

/**
 * Alle Annahmen offen und änderbar. Ohne diesen Block kippt jedes Fachgespräch
 * in eine Methodikdebatte.
 */
export function AnnahmenBlock({
  projekt,
  setProjekt,
  annahmen,
  setAnnahmen,
  hinweise,
}: {
  projekt: Projekt;
  setProjekt: (p: Projekt) => void;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
  hinweise: string[];
}) {
  const aendern = <K extends keyof Annahmen>(feld: K, wert: Annahmen[K]) =>
    setAnnahmen({ ...annahmen, [feld]: wert });
  const projektAendern = <K extends keyof Projekt>(feld: K, wert: Projekt[K]) =>
    setProjekt({ ...projekt, [feld]: wert });
  const istLast = projekt.typ === "industrielle_last";

  return (
    <div>
          <div className="grid gap-5 pt-1 md:grid-cols-3">
            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground">Projekt und Kapital</h4>
              <Zahlenfeld
                label="Netzanschlussleistung"
                einheit="MW"
                wert={projekt.netzanschlussLeistungMW}
                setzen={(n) => projektAendern("netzanschlussLeistungMW", Math.max(0.1, n))}
                hinweis="Die Leistung, die bei einem festen Anschluss dauerhaft zur Verfügung stünde. Referenz für die Bewertung des FCA."
              />
              <Zahlenfeld
                label="Investition je MW"
                einheit="Tsd EUR"
                schritt={10_000}
                teiler={1_000}
                wert={projekt.capexProMW}
                setzen={(n) => projektAendern("capexProMW", Math.max(0, n))}
                hinweis={GLOSSAR.investition}
              />
              {projekt.typ === "bess" ? (
                <Zahlenfeld
                  label="Investition je MWh"
                  einheit="Tsd EUR"
                  schritt={5_000}
                  teiler={1_000}
                  wert={projekt.capexProMWhSpeicher ?? 0}
                  setzen={(n) => projektAendern("capexProMWhSpeicher", Math.max(0, n))}
                  hinweis="Energieanteil der Investition, also die Batteriezellen."
                />
              ) : null}
              <Zahlenfeld
                label="Betriebsdauer"
                einheit="Jahre"
                wert={projekt.betriebsjahre}
                setzen={(n) => projektAendern("betriebsjahre", Math.max(1, Math.round(n)))}
                hinweis={GLOSSAR.betriebsdauer}
              />
              <Zahlenfeld
                label="Kalkulationszins"
                hinweis={GLOSSAR.kalkulationszins}
                einheit="%"
                schritt={0.5}
                wert={annahmen.diskontsatzProzent}
                setzen={(n) => aendern("diskontsatzProzent", n)}
              />
              <Zahlenfeld
                label="Betriebskosten je MW und Jahr"
                hinweis={GLOSSAR.betriebskosten}
                einheit="Tsd EUR"
                schritt={500}
                teiler={1_000}
                wert={annahmen.opexProMWJahr}
                setzen={(n) => aendern("opexProMWJahr", n)}
              />
              <Zahlenfeld
                label="Degradation je Jahr"
                hinweis={GLOSSAR.degradation}
                einheit="%"
                schritt={0.1}
                wert={annahmen.degradationProzentProJahr}
                setzen={(n) => aendern("degradationProzentProJahr", n)}
              />
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground">
                {istLast ? "Nutzen" : "Erlöse"}
              </h4>
              {istLast ? (
                <Zahlenfeld
                  label="Deckungsbeitrag je MWh"
                  einheit="EUR"
                  wert={annahmen.wertProMWhEur}
                  setzen={(n) => aendern("wertProMWhEur", n)}
                  hinweis={GLOSSAR.deckungsbeitrag}
                />
              ) : (
                <>
                  <Auswahl
                    label="Vergütungsmodell"
                    wert={annahmen.verguetung}
                    setzen={(w) => aendern("verguetung", w)}
                    optionen={[
                      { wert: "markt", text: "Direktvermarktung zum Spotpreis" },
                      { wert: "ppa", text: "PPA zu festem Preis" },
                    ]}
                    hinweis="Am Spotmarkt trifft die Abregelung überwiegend Stunden mit niedrigen Preisen. Der Erlösverlust fällt dann kleiner aus als der Energieverlust."
                  />
                  {annahmen.verguetung === "ppa" ? (
                    <Zahlenfeld
                      label="PPA-Preis"
                      hinweis={GLOSSAR.ppa}
                      einheit="EUR/MWh"
                      wert={annahmen.ppaPreisEurProMWh}
                      setzen={(n) => aendern("ppaPreisEurProMWh", n)}
                    />
                  ) : (
                    <Zahlenfeld
                      label="Vermarktungsfaktor"
                      schritt={0.01}
                      wert={annahmen.marktwertfaktor}
                      setzen={(n) => aendern("marktwertfaktor", n)}
                      hinweis={GLOSSAR.marktwertfaktor}
                    />
                  )}
                  <Schalter
                    label="Bei negativen Preisen herunterfahren"
                    an={annahmen.negativePreiseAbregeln}
                    setzen={(b) => aendern("negativePreiseAbregeln", b)}
                    hinweis={GLOSSAR.negativePreise}
                  />
                </>
              )}
              {projekt.typ === "bess" ? (
                <>
                  <Zahlenfeld
                    label="Wirkungsgrad"
                    hinweis={GLOSSAR.wirkungsgrad}
                    einheit="%"
                    wert={annahmen.wirkungsgradProzent}
                    setzen={(n) => aendern("wirkungsgradProzent", n)}
                  />
                  <Zahlenfeld
                    label="Zyklen je Tag"
                    hinweis={GLOSSAR.zyklen}
                    schritt={0.1}
                    wert={annahmen.maxZyklenProTag}
                    setzen={(n) => aendern("maxZyklenProTag", n)}
                  />
                  <Zahlenfeld
                    label="Verschleiß je MWh"
                    hinweis={GLOSSAR.verschleiss}
                    einheit="EUR"
                    wert={annahmen.verschleissEurProMWh}
                    setzen={(n) => aendern("verschleissEurProMWh", n)}
                  />
                  <Zahlenfeld
                    label="Systemdienstleistungen je MW und Jahr"
                    hinweis={GLOSSAR.sdl}
                    einheit="Tsd EUR"
                    schritt={5_000}
                    teiler={1_000}
                    wert={annahmen.sdlErloesEurProMWJahr}
                    setzen={(n) => aendern("sdlErloesEurProMWJahr", n)}
                  />
                </>
              ) : null}
            </section>

            <section className="space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground">Netz und Risiko</h4>
              <Auswahl
                label="Engpasstiefe"
                hinweis={GLOSSAR.engpasstiefe}
                wert={annahmen.engpasstiefe}
                setzen={(w) => aendern("engpasstiefe", w)}
                optionen={[
                  { wert: "gleitend", text: "gleitend mit dem Engpass" },
                  { wert: "binaer", text: "binaer, ganz oder gar nicht" },
                ]}
              />
              <Regler
                label="Engpass-Stressfaktor für P90"
                hinweis={GLOSSAR.stressfaktor}
                wert={annahmen.engpassStressfaktorP90}
                setzen={(n) => aendern("engpassStressfaktorP90", n)}
                min={1}
                max={3}
                schritt={0.1}
                anzeige={(n) => `Faktor ${n.toFixed(1)}`}
              />
              <Auswahl
                label="Nach Ende der FCA-Laufzeit"
                wert={annahmen.nachLaufzeitende}
                setzen={(w) => aendern("nachLaufzeitende", w)}
                optionen={[
                  { wert: "verlaengerung", text: "Verlängerung zu gleichen Bedingungen" },
                  { wert: "kein_zugang", text: "Kein Netzzugang bis zum Netzausbau" },
                ]}
                hinweis="Wirkt nur, wenn der Vertrag früher endet als der Netzausbau fertig wird. Betrifft ausschliesslich Szenario C."
              />
              <Zahlenfeld
                label="Blindleistung, Investition je MW"
                hinweis={GLOSSAR.blindleistung}
                einheit="Tsd EUR"
                schritt={1_000}
                teiler={1_000}
                wert={annahmen.blindleistungCapexEurProMW}
                setzen={(n) => aendern("blindleistungCapexEurProMW", n)}
              />
              <Zahlenfeld
                label="Blindleistung, Wirkleistungsverlust"
                hinweis="Anteil der Wirkleistung, der für die Blindleistungsbereitstellung verloren geht. Fällt in jeder Betriebsstunde an, nicht nur bei einer Kürzung."
                einheit="%"
                schritt={0.1}
                wert={annahmen.blindleistungVerlustProzent}
                setzen={(n) => aendern("blindleistungVerlustProzent", n)}
              />
            </section>
          </div>

          {hinweise.length > 0 ? (
            <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
              {hinweise.map((h) => (
                <li key={h} className="flex gap-2 text-[11px] text-pretty text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-mittel" />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 border-t border-border pt-3">
            <h4 className="text-[11px] font-semibold text-muted-foreground">Herkunft der Zahlen</h4>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {QUELLEN.map((q) => (
                <div key={q.reihe} className="space-y-0.5">
                  <div className="font-medium">{q.reihe}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {q.quelle}, {q.lizenz}, Jahre {q.jahre.join(", ")}, abgerufen am{" "}
                    {q.abgerufenAm}
                  </div>
                  <ul className="ml-3.5 list-disc text-[11px] text-pretty text-muted-foreground">
                    {q.verarbeitung.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-pretty text-muted-foreground">
              Die Simulation rechnet 8.760 Stunden je Wetterjahr ohne Lastfluss und ohne Netzmodell.
              Engpassprofile sind synthetisch und über Häufigkeit und Kopplung an die regionale
              Erzeugung parametrisiert. Die Ergebnisse ersetzen keine Netzberechnung.
            </p>
          </div>
    </div>
  );
}
