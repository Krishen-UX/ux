"use client";

import { TriangleAlert } from "lucide-react";
import type {
  Alternative,
  Annahmen,
  Auswertung,
  FcaAngebot,
  Projekt,
} from "@/lib/typen";
import { ARCHETYP_TEXT } from "@/lib/sim/archetypen";
import { fmtEur, fmtMW, fmtMWh, fmtProzent, fmtStunden } from "@/lib/format";
import { Abschnitt, Auswahl, Begriff, Hinweis, Kennzahl, Regler, Schalter, Zahlenfeld } from "./felder";
import { SchrittKopf } from "./schritt-kopf";
import { luecke } from "@/lib/sim/szenarien";
import { GLOSSAR } from "@/lib/glossar";
import { ZeitfensterEditor } from "./zeitfenster-editor";
import { DauerlinienDiagramm } from "./diagramme/dauerlinie";
import { WochenDiagramm } from "./diagramme/woche";
import { Karte } from "./karte";
import { cn } from "@/lib/utils";

const ARCHETYPEN: FcaAngebot["archetyp"][] = [
  "statisch_kappung",
  "zeitfenster",
  "dynamisch_referenzanlage",
  "volldynamisch",
];

export function SchrittAngebot({
  projekt,
  angebot,
  setAngebot,
  annahmen,
  setAnnahmen,
  alternative,
  setAlternative,
  auswertung,
}: {
  projekt: Projekt;
  angebot: FcaAngebot;
  setAngebot: (a: FcaAngebot) => void;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
  alternative: Alternative;
  setAlternative: (a: Alternative) => void;
  auswertung: Auswertung;
}) {
  const aendern = <K extends keyof FcaAngebot>(feld: K, wert: FcaAngebot[K]) =>
    setAngebot({ ...angebot, [feld]: wert });

  const lauf = auswertung.p50Lauf;
  const istLast = projekt.typ === "industrielle_last";
  const netz = projekt.netzanschlussLeistungMW;
  const dynamisch =
    angebot.archetyp === "dynamisch_referenzanlage" || angebot.archetyp === "volldynamisch";
  const erloesverlust =
    lauf.erloesReferenzEur - lauf.erloesFcaEur - lauf.entschaedigungEur;
  const text = ARCHETYP_TEXT[angebot.archetyp];

  const vertragsluecke = luecke(angebot, alternative);

  return (
    <div className="space-y-3">
      <SchrittKopf
        nummer={2}
        titel="FCA-Angebot"
        legende
        was={
          <>
            Übertrage hier, was im Schreiben deines Netzbetreibers steht. Jede Änderung rechnet
            sofort durch, rechts stehen die Folgen für Arbeit und Erlös. Das Ergebnis vergleicht
            immer gegen einen festen Anschluss, nicht gegen die installierte Leistung.
          </>
        }
        gebraucht={
          <>
            Gebraucht wird das Angebotsschreiben. Ordne es zuerst einem der vier Archetypen zu, dann
            trage seine Parameter ein.
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Abschnitt titel="Archetyp des Angebots">
          <div className="grid gap-2 sm:grid-cols-2">
            {ARCHETYPEN.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => aendern("archetyp", a)}
                className={cn(
                  "rounded-md border p-2 text-left transition-colors",
                  angebot.archetyp === a
                    ? "border-akzent bg-akzent-schwach"
                    : "border-border hover:border-akzent/40 hover:bg-muted/60",
                )}
              >
                <div className="font-semibold">{ARCHETYP_TEXT[a].titel}</div>
                <div className="mt-0.5 text-[11px] text-pretty text-muted-foreground">
                  {ARCHETYP_TEXT[a].kurz}
                </div>
              </button>
            ))}
          </div>
          {text.hinweis ? (
            <p className="flex gap-1.5 rounded-md bg-muted/70 p-2 text-[11px] text-pretty text-muted-foreground">
              <TriangleAlert className="mt-px size-3.5 shrink-0 text-mittel" />
              {text.hinweis}
            </p>
          ) : null}
        </Abschnitt>

        <Abschnitt titel="Grenzen">
          {angebot.archetyp === "zeitfenster" ? (
            <ZeitfensterEditor
              fenster={angebot.zeitfenster}
              setzen={(f) => aendern("zeitfenster", f)}
              projekt={projekt}
            />
          ) : (
            <>
              <Regler
                label={
                  angebot.archetyp === "statisch_kappung"
                    ? istLast
                      ? "Dauerhafte Entnahmegrenze"
                      : "Dauerhafte Einspeisegrenze"
                    : "Garantierte Leistung während der Kürzung"
                }
                wert={istLast ? angebot.maxEntnahmeleistungMW : angebot.maxEinspeiseleistungMW}
                setzen={(n) =>
                  setAngebot({
                    ...angebot,
                    maxEinspeiseleistungMW: n,
                    maxEntnahmeleistungMW: n,
                  })
                }
                min={0}
                max={netz}
                schritt={0.5}
                anzeige={(n) => `${fmtMW(n)} von ${fmtMW(netz)}`}
                hinweis="Untergrenze, auf die zurückgefahren wird. Der wichtigste bankfähige Sockel des Vertrags."
              />

              {angebot.archetyp === "dynamisch_referenzanlage" ? (
                <>
                  <Auswahl
                    label="Referenzreihe"
                    wert={angebot.referenzreihe}
                    setzen={(w) => aendern("referenzreihe", w)}
                    optionen={[
                      { wert: "pv", text: "Photovoltaik der Regelzone" },
                      { wert: "wind", text: "Wind onshore der Regelzone" },
                    ]}
                    hinweis="Welche Erzeugung die Kürzung auslöst. Ob die Referenz am selben Umspannwerk oder an einem entfernten Netzknoten hängt, ist regelmäßig strittig und aendert das Ergebnis erheblich."
                  />
                  <Regler
                    label="Auslöseschwelle"
                    wert={Math.round(angebot.schwellwert * 100)}
                    setzen={(n) => aendern("schwellwert", n / 100)}
                    min={5}
                    max={95}
                    anzeige={(n) => `${n} % der Regionsspitze`}
                    hinweis="Ab welcher regionalen Erzeugung die Kürzung greift. Je höher die Schwelle, desto seltener der Eingriff."
                  />
                </>
              ) : null}

              {angebot.archetyp === "volldynamisch" ? (
                <>
                  <Regler
                    label="Engpasshäufigkeit"
                    herkunft="schaetzung"
                    wert={angebot.engpassHäufigkeitProzent}
                    setzen={(n) => aendern("engpassHäufigkeitProzent", n)}
                    min={0}
                    max={40}
                    schritt={0.5}
                    anzeige={(n) => `${fmtProzent(n, 1)} der Jahresstunden`}
                    hinweis="Anteil der Stunden, in denen der Netzknoten überlastet ist. Ohne belastbare Prognose des Netzbetreibers ist das eine Annahme."
                  />
                  <Regler
                    label="Kopplung an die regionale Erzeugung"
                    herkunft="schaetzung"
                    wert={Math.round(angebot.engpassKorrelation * 100)}
                    setzen={(n) => aendern("engpassKorrelation", n / 100)}
                    min={0}
                    max={100}
                    anzeige={(n) => `${n} %`}
                    hinweis="Bei hoher Kopplung fallen die Engpassstunden mit den ertragreichsten Stunden zusammen. Das ist der teuerste Fall."
                  />
                </>
              ) : null}
            </>
          )}
        </Abschnitt>

        <Abschnitt titel="Zugangsprinzip">
          <p className="text-[11px] text-pretty text-muted-foreground">
            Bei <Begriff name="lifo">LIFO</Begriff> trägt die letzte Position fast die gesamte
            Kürzung, bei <Begriff name="proRata">pro rata</Begriff> tragen alle gleich viel. Das ist
            der grösste einzelne Hebel im Vertrag.
          </p>
          <Auswahl
            label="Verteilung der Kürzung am Netzknoten"
            hinweis={GLOSSAR.zugangsprinzip}
            wert={angebot.zugangsprinzip}
            setzen={(w) => aendern("zugangsprinzip", w)}
            optionen={[
              { wert: "lifo", text: "LIFO, zuletzt angeschlossen wird zuerst gekürzt" },
              { wert: "pro_rata", text: "Pro rata, alle Teilnehmer gleichmäßig" },
            ]}
          />
          {angebot.zugangsprinzip === "lifo" ? (
            <div className="space-y-2.5 rounded-md border border-akzent/30 bg-akzent-schwach/50 p-2.5">
              <Regler
                label="Position in der Anschlussreihenfolge"
                herkunft="schaetzung"
                wert={angebot.positionImStack}
                setzen={(n) => aendern("positionImStack", n)}
                min={1}
                max={angebot.anzahlImStack}
                anzeige={(n) => `${n} von ${angebot.anzahlImStack}`}
                hinweis="Position 1 wird zuletzt gekürzt, die letzte Position zuerst. Der Unterschied zwischen vorn und hinten ist der groesste einzelne Hebel im Vertrag."
                deaktiviert={!dynamisch}
              />
              <Regler
                label="Teilnehmer am Netzknoten"
                herkunft="schaetzung"
                wert={angebot.anzahlImStack}
                setzen={(n) =>
                  setAngebot({
                    ...angebot,
                    anzahlImStack: n,
                    positionImStack: Math.min(angebot.positionImStack, n),
                  })
                }
                min={1}
                max={20}
                deaktiviert={!dynamisch}
              />
            </div>
          ) : null}
          {!dynamisch ? (
            <p className="text-[11px] text-pretty text-muted-foreground">
              Bei einer vertraglich fixierten Grenze steht die Kürzung bereits fest. Das
              Zugangsprinzip wirkt erst bei den dynamischen Archetypen.
            </p>
          ) : null}
        </Abschnitt>

        <Abschnitt titel="Entschädigung und Auflagen">
          <Auswahl
            label="Entschädigung für abgeregelte Arbeit"
            wert={angebot.entschaedigung}
            setzen={(w) => aendern("entschaedigung", w)}
            optionen={[
              { wert: "keine", text: "keine" },
              { wert: "teilweise", text: "fester Satz je MWh" },
              { wert: "voll", text: "voller Ersatz des entgangenen Erlöses" },
            ]}
          />
          {angebot.entschaedigung === "teilweise" ? (
            <Regler
              label="Entschädigungssatz"
              wert={angebot.entschaedigungSatzEurProMWh}
              setzen={(n) => aendern("entschaedigungSatzEurProMWh", n)}
              min={0}
              max={200}
              anzeige={(n) => `${n} EUR/MWh`}
            />
          ) : null}
          <Regler
            label="Leistungsgradient"
            wert={angebot.leistungsgradientProzentProMin}
            setzen={(n) => aendern("leistungsgradientProzentProMin", n)}
            min={0.5}
            max={30}
            schritt={0.5}
            anzeige={(n) => `${n} % je Minute`}
            hinweis={`${GLOSSAR.leistungsgradient} Bei Stundenauflösung wirkt er erst unterhalb von etwa 1,7 Prozent je Minute, darüber ist der Effekt im Modell null.`}
          />
          <Schalter
            label="Blindleistungsauflage"
            an={angebot.blindleistungsAuflage}
            setzen={(b) => aendern("blindleistungsAuflage", b)}
            hinweis={`${GLOSSAR.blindleistung} Beide Werte stehen im Annahmenblock.`}
          />
          <Schalter
            label="Systemdienstleistungen eingeschränkt"
            an={angebot.systemdienstleistungenEingeschraenkt}
            setzen={(b) => aendern("systemdienstleistungenEingeschraenkt", b)}
            hinweis={`${GLOSSAR.sdl} Sperrt die Teilnahme an Regelleistungsmärkten.`}
          />
        </Abschnitt>

        <Abschnitt titel="Laufzeit und Alternative">
          <p className="text-[11px] text-pretty text-muted-foreground">
            Die beiden Jahreszahlen sind nicht dieselbe Angabe. Die Laufzeit steht im Vertrag, der
            Netzausbau ist eine Prognose des Netzbetreibers. Sie können auseinanderfallen.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Zahlenfeld
              label="FCA-Laufzeit"
              einheit="Jahre"
              wert={angebot.laufzeitJahre}
              setzen={(n) => aendern("laufzeitJahre", Math.max(1, Math.round(n)))}
              hinweis="Vertragslaufzeit der flexiblen Anschlussvereinbarung. Steht im Angebotsschreiben. Sie sagt nichts darüber aus, wann der Netzausbau fertig ist."
            />
            <Zahlenfeld
              label="Netzausbau fertig ab Jahr"
              wert={alternative.festerAnschlussVerfuegbarAbJahr ?? 0}
              herkunft="schaetzung"
              setzen={(n) =>
                setAlternative({
                  ...alternative,
                  festerAnschlussVerfuegbarAbJahr: n <= 0 ? null : Math.round(n),
                })
              }
              hinweis="Ab wann ein fester Anschluss verfügbar wäre. Meist eine unverbindliche Planungsaussage, nicht Teil des Vertrags. Null bedeutet, dass kein Termin vorliegt, dann ist Szenario B nicht bewertbar."
            />
            <Zahlenfeld
              label="Baukostenzuschuss FCA"
              einheit="Tsd EUR"
              schritt={50_000}
              teiler={1_000}
              wert={alternative.fcaBaukostenzuschussEur}
              setzen={(n) => setAlternative({ ...alternative, fcaBaukostenzuschussEur: n })}
              hinweis="Einmalige Zahlung für die Bereitstellung der Anschlusskapazität unter dem FCA."
            />
            <Zahlenfeld
              label="Baukostenzuschuss fest"
              einheit="Tsd EUR"
              schritt={50_000}
              teiler={1_000}
              herkunft="schaetzung"
              wert={alternative.festerAnschlussBaukostenzuschussEur ?? 0}
              setzen={(n) =>
                setAlternative({ ...alternative, festerAnschlussBaukostenzuschussEur: n })
              }
              hinweis="Was ein fester Anschluss kosten würde. Braucht ein zweites Angebot vom Netzbetreiber, sonst lässt sich das Warten nicht gegenrechnen."
            />
          </div>

          {vertragsluecke ? (
            <div className="space-y-2 rounded-md border border-mittel/40 bg-mittel/8 p-2.5">
              <p className="flex gap-1.5 text-[11px] text-pretty">
                <TriangleAlert className="mt-px size-3.5 shrink-0 text-mittel" />
                <span>
                  Der Vertrag endet im Jahr {vertragsluecke.von}, der Netzausbau kommt erst im Jahr{" "}
                  {vertragsluecke.bis}. Für {vertragsluecke.bis - vertragsluecke.von}{" "}
                  {vertragsluecke.bis - vertragsluecke.von === 1 ? "Jahr" : "Jahre"} ist der
                  Netzzugang vertraglich nicht geregelt.
                </span>
              </p>
              <Auswahl
                label="Annahme für diese Jahre"
                wert={annahmen.nachLaufzeitende}
                setzen={(w) => setAnnahmen({ ...annahmen, nachLaufzeitende: w })}
                optionen={[
                  { wert: "verlaengerung", text: "FCA wird zu gleichen Bedingungen verlängert" },
                  { wert: "kein_zugang", text: "Kein Netzzugang bis zum Netzausbau" },
                ]}
                hinweis="Der zweite Fall ist der ungünstige. Die Differenz der Kapitalwerte von Szenario C ist genau das, was ein verbindlicher Endtermin im Vertrag wert wäre."
              />
            </div>
          ) : null}

          {alternative.festerAnschlussVerfuegbarAbJahr !== null &&
          alternative.festerAnschlussVerfuegbarAbJahr < angebot.laufzeitJahre ? (
            <p className="text-[11px] text-pretty text-muted-foreground">
              Der Vertrag bindet länger, als der Engpass voraussichtlich besteht. Das Modell nimmt
              an, dass die Einschränkung mit dem Netzausbau endet. Bei einer statischen Kappung kann
              der Vertrag darüber hinaus binden, ein Umstellungsrecht gehört dann in die Verhandlung.
            </p>
          ) : null}
        </Abschnitt>
      </div>

      <div className="space-y-3 lg:sticky lg:top-16 lg:h-fit">
        <Karte>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kennzahl
              label="Abregelung"
              hinweis={GLOSSAR.abregelung}
              wert={fmtProzent(lauf.abregelungProzent)}
              zusatz={`${fmtMWh(lauf.abregelungMWh)} im Jahr`}
              ton="verlust"
              gross
            />
            <Kennzahl
              label="Betroffene Stunden"
              wert={fmtStunden(lauf.abregelungStunden)}
              zusatz={`${fmtProzent((lauf.abregelungStunden / 8760) * 100, 1)} des Jahres`}
              gross
            />
            <Kennzahl
              label={istLast ? "Bezug unter FCA" : "Ertrag unter FCA"}
              wert={fmtMWh(istLast ? lauf.entnahmeFcaMWh : lauf.einspeisungFcaMWh)}
              zusatz={`statt ${fmtMWh(istLast ? lauf.entnahmeReferenzMWh : lauf.einspeisungReferenzMWh)}`}
              ton="akzent"
              gross
            />
            <Kennzahl
              label="Erlösverlust im Jahr 1"
              wert={fmtEur(erloesverlust)}
              zusatz={
                lauf.entschaedigungEur > 0
                  ? `nach ${fmtEur(lauf.entschaedigungEur)} Entschaedigung`
                  : "ohne Entschädigung"
              }
              ton="verlust"
              gross
            />
          </div>
          {lauf.blindleistungVerlustMWh > 0.5 ? (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              Dazu {fmtMWh(lauf.blindleistungVerlustMWh)} Wirkleistungsverlust aus der
              Blindleistungsauflage.
              <Hinweis text="Dieser Verlust fällt in jeder Betriebsstunde an, nicht nur bei einer Kürzung, und ist in der Abregelungsquote nicht enthalten." />
            </p>
          ) : null}
        </Karte>

        <Karte>
          <DauerlinienDiagramm lauf={lauf} projekt={projekt} hoehe={220} />
        </Karte>
        <Karte>
          <WochenDiagramm lauf={lauf} projekt={projekt} hoehe={220} />
        </Karte>

        <Karte titel="Modellannahme zur Engpasstiefe">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Auswahl
              wert={annahmen.engpasstiefe}
              setzen={(w) => setAnnahmen({ ...annahmen, engpasstiefe: w })}
              optionen={[
                { wert: "gleitend", text: "gleitend, Kürzung wächst mit dem Engpass" },
                { wert: "binaer", text: "binaer, Kürzung greift ganz oder gar nicht" },
              ]}
            />
            <p className="max-w-[24rem] text-[11px] text-pretty text-muted-foreground">
              Nur bei gleitender Tiefe kann das Zugangsprinzip überhaupt wirken. Bei binärer
              Schaltung trifft die Kürzung alle Teilnehmer gleichzeitig.
            </p>
          </div>
        </Karte>
      </div>
      </div>
    </div>
  );
}
