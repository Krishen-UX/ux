"use client";

import type { Alternative, Annahmen, FcaAngebot, Projekt } from "@/lib/typen";
import { ARCHETYP_TEXT } from "@/lib/sim/archetypen";
import { GLOSSAR } from "@/lib/glossar";
import { fmtMW, fmtProzent } from "@/lib/format";
import { Auswahl, Regler, Schalter, Zahlenfeld } from "./felder";
import { ZeitfensterEditor } from "./zeitfenster-editor";
import { luecke } from "@/lib/sim/szenarien";
import { TriangleAlert } from "lucide-react";

export interface SteuerungsEingabe {
  projekt: Projekt;
  angebot: FcaAngebot;
  setAngebot: (a: FcaAngebot) => void;
  alternative: Alternative;
  setAlternative: (a: Alternative) => void;
  annahmen: Annahmen;
  setAnnahmen: (a: Annahmen) => void;
}

/**
 * Das Bedienelement zu einer ausgelesenen Angabe.
 *
 * Es gibt genau eines je Schlüssel, egal ob die Angabe im Prüfstapel oben steht
 * oder unten in der belegten Liste aufgeklappt wird.
 */
export function Steuerung({
  schluessel,
  e,
  kompakt = false,
}: {
  schluessel: string;
  e: SteuerungsEingabe;
  /** In der Prüfkarte stehen Feld und Wert schon darüber. */
  kompakt?: boolean;
}) {
  const { projekt, angebot, setAngebot, alternative, setAlternative } = e;
  const aendern = <K extends keyof FcaAngebot>(feld: K, wert: FcaAngebot[K]) =>
    setAngebot({ ...angebot, [feld]: wert });
  const istLast = projekt.typ === "industrielle_last";
  const netz = projekt.netzanschlussLeistungMW;

  switch (schluessel) {
    case "archetyp":
      return (
        <Auswahl
          wert={angebot.archetyp}
          setzen={(w) => aendern("archetyp", w)}
          hinweis={GLOSSAR.archetyp}
          optionen={(
            ["statisch_kappung", "zeitfenster", "dynamisch_referenzanlage", "volldynamisch"] as const
          ).map((a) => ({ wert: a, text: ARCHETYP_TEXT[a].titel }))}
        />
      );

    case "grenze":
      return (
        <Regler
          label={kompakt ? "" : istLast ? "Garantierte Entnahmeleistung" : "Garantierte Einspeiseleistung"}
          wert={istLast ? angebot.maxEntnahmeleistungMW : angebot.maxEinspeiseleistungMW}
          setzen={(n) =>
            setAngebot({ ...angebot, maxEinspeiseleistungMW: n, maxEntnahmeleistungMW: n })
          }
          min={0}
          max={netz}
          schritt={0.5}
          anzeige={(n) => `${fmtMW(n)} von ${fmtMW(netz)}`}
        />
      );

    case "zeitfenster":
      return (
        <ZeitfensterEditor
          fenster={angebot.zeitfenster}
          setzen={(f) => aendern("zeitfenster", f)}
          projekt={projekt}
        />
      );

    case "referenzreihe":
      return (
        <Auswahl
          label={kompakt ? "" : "Referenzgrösse"}
          wert={angebot.referenzreihe}
          setzen={(w) => aendern("referenzreihe", w)}
          hinweis={GLOSSAR.referenzanlage}
          optionen={[
            { wert: "pv", text: "Photovoltaik der Regelzone" },
            { wert: "wind", text: "Wind onshore der Regelzone" },
          ]}
        />
      );

    case "schwellwert":
      return (
        <Regler
          label={kompakt ? "" : "Auslöseschwelle"}
          wert={Math.round(angebot.schwellwert * 100)}
          setzen={(n) => aendern("schwellwert", n / 100)}
          min={5}
          max={95}
          anzeige={(n) => `${n} % der Regionsspitze`}
        />
      );

    case "engpass":
      return (
        <div className="flex flex-col gap-2.5">
          <Regler
            label="Engpasshäufigkeit"
            wert={angebot.engpassHaeufigkeitProzent}
            setzen={(n) => aendern("engpassHaeufigkeitProzent", n)}
            min={0}
            max={40}
            schritt={0.5}
            anzeige={(n) => `${fmtProzent(n, 1)} der Jahresstunden`}
          />
          <Regler
            label="Kopplung an die regionale Erzeugung"
            wert={Math.round(angebot.engpassKorrelation * 100)}
            setzen={(n) => aendern("engpassKorrelation", n / 100)}
            min={0}
            max={100}
            anzeige={(n) => `${n} %`}
          />
        </div>
      );

    case "zugangsprinzip":
      return (
        <Auswahl
          wert={angebot.zugangsprinzip}
          setzen={(w) => aendern("zugangsprinzip", w)}
          hinweis={GLOSSAR.zugangsprinzip}
          optionen={[
            { wert: "lifo", text: "LIFO, zuletzt angeschlossen wird zuerst gekürzt" },
            { wert: "pro_rata", text: "Pro rata, alle Teilnehmer gleichmässig" },
          ]}
        />
      );

    case "position":
      return (
        <div className="flex flex-col gap-2.5">
          <Regler
            label="Position in der Anschlussreihenfolge"
            wert={angebot.positionImStack}
            setzen={(n) => aendern("positionImStack", n)}
            min={1}
            max={angebot.anzahlImStack}
            anzeige={(n) => `${n} von ${angebot.anzahlImStack}`}
            hinweis={GLOSSAR.lifo}
          />
          <Regler
            label="Teilnehmer am Netzknoten"
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
          />
        </div>
      );

    case "entschaedigung":
      return (
        <div className="flex flex-col gap-2.5">
          <Auswahl
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
        </div>
      );

    case "gradient":
      return (
        <Regler
          label={kompakt ? "" : "Leistungsgradient"}
          wert={angebot.leistungsgradientProzentProMin}
          setzen={(n) => aendern("leistungsgradientProzentProMin", n)}
          min={0.5}
          max={30}
          schritt={0.5}
          anzeige={(n) => `${n} % je Minute`}
          hinweis={GLOSSAR.leistungsgradient}
        />
      );

    case "blindleistung":
      return (
        <Schalter
          label="Blindleistungsauflage besteht"
          an={angebot.blindleistungsAuflage}
          setzen={(b) => aendern("blindleistungsAuflage", b)}
          hinweis={GLOSSAR.blindleistung}
        />
      );

    case "sdl":
      return (
        <Schalter
          label="Systemdienstleistungen gesperrt"
          an={angebot.systemdienstleistungenEingeschraenkt}
          setzen={(b) => aendern("systemdienstleistungenEingeschraenkt", b)}
          hinweis={GLOSSAR.sdl}
        />
      );

    case "laufzeit":
      return (
        <Zahlenfeld
          label={kompakt ? "" : "Vertragslaufzeit"}
          einheit="Jahre"
          wert={angebot.laufzeitJahre}
          setzen={(n) => aendern("laufzeitJahre", Math.max(1, Math.round(n)))}
        />
      );

    case "termin": {
      const vertragsluecke = luecke(angebot, alternative);
      return (
        <div className="flex flex-col gap-2.5">
          <Zahlenfeld
            label={kompakt ? "" : "Netzausbau fertig ab Jahr"}
            wert={alternative.festerAnschlussVerfuegbarAbJahr ?? 0}
            setzen={(n) =>
              setAlternative({
                ...alternative,
                festerAnschlussVerfuegbarAbJahr: n <= 0 ? null : Math.round(n),
              })
            }
            hinweis="Null bedeutet, dass kein Termin vorliegt. Szenario B ist dann nicht bewertbar."
          />
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
                wert={e.annahmen.nachLaufzeitende}
                setzen={(w) => e.setAnnahmen({ ...e.annahmen, nachLaufzeitende: w })}
                optionen={[
                  { wert: "verlaengerung", text: "FCA wird zu gleichen Bedingungen verlängert" },
                  { wert: "kein_zugang", text: "Kein Netzzugang bis zum Netzausbau" },
                ]}
                hinweis="Die Differenz der Kapitalwerte von Szenario C ist genau das, was ein verbindlicher Endtermin im Vertrag wert wäre."
              />
            </div>
          ) : null}
        </div>
      );
    }

    case "bkzFca":
      return (
        <Zahlenfeld
          label={kompakt ? "" : "Baukostenzuschuss FCA"}
          einheit="Tsd EUR"
          schritt={50_000}
          teiler={1_000}
          wert={alternative.fcaBaukostenzuschussEur}
          setzen={(n) => setAlternative({ ...alternative, fcaBaukostenzuschussEur: n })}
          hinweis={GLOSSAR.baukostenzuschuss}
        />
      );

    case "bkzFest":
      return (
        <Zahlenfeld
          label={kompakt ? "" : "Baukostenzuschuss bei festem Anschluss"}
          einheit="Tsd EUR"
          schritt={50_000}
          teiler={1_000}
          wert={alternative.festerAnschlussBaukostenzuschussEur ?? 0}
          setzen={(n) =>
            setAlternative({ ...alternative, festerAnschlussBaukostenzuschussEur: n })
          }
        />
      );

    default:
      return null;
  }
}
