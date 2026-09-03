# FCA Assessor

Prototyp, der ein Angebot für einen flexiblen Netzanschluss in unter zehn Minuten
in eine Wirtschaftlichkeits- und Verhandlungsgrundlage übersetzt.

Gedacht als testbares Artefakt für Stakeholder-Gespräche, nicht als Produkt.
Die Hypothese, die er prüfen soll: Anschlussbegehrende würden ein solches Werkzeug
nutzen, statt die Bewertung als Beratungsleistung einzukaufen oder nach Bauchgefühl
zu verhandeln.

## Starten

```bash
npm install
npm run dev        # Entwicklungsserver
npm run build && npm start
npm test           # Unit-Tests des Simulationskerns
npm run typecheck
npm run lint
```

Die Zeitreihen liegen fertig aufbereitet im Repo. Neu ziehen nur, wenn ein
weiteres Jahr dazukommen soll:

```bash
NODE_USE_ENV_PROXY=1 node scripts/fetch-smard.mjs   # Erzeugung und Preise von SMARD
node scripts/build-lastprofile.mjs                  # Lastprofile Industrie
```

## Was der Prototyp kann

Ein Projekt, Deutschland, Mittel- und Hochspannung, drei Anlagentypen
(Batteriespeicher, PV Freifläche, industrielle Last) und vier FCA-Archetypen.

1. **Projekt** Anlagentyp und acht Felder, daneben sofort das Jahresprofil.
2. **FCA-Angebot** Archetyp und seine Parameter. Jede Änderung rechnet ohne Knopf
   durch, ein Reglerzug liegt bei rund 55 Millisekunden.
3. **Ergebnis** Empfehlung, drei Szenarien als Kapitalwert, Zeitreihen,
   Sensitivität der Vertragsparameter, offener Annahmenblock.
4. **Faktenblatt** eine Seite über die Druckansicht des Browsers, als Anlage für
   die Rückmeldung an den Netzbetreiber.

### Die drei Szenarien

| Szenario | Beschreibung |
|---|---|
| A | FCA dauerhaft. Anschluss sofort, die Einschränkung bleibt über die Betriebsdauer. |
| B | Auf den festen Anschluss warten. Kein Erlös bis zum Anschlussjahr, danach ohne Kürzung, höherer Baukostenzuschuss. |
| C | FCA als Brücke. Anschluss sofort unter FCA, ab dem Netzausbau fester Anschluss. |

Szenario C ist in der Praxis oft die richtige Antwort und wird selten gerechnet.
Es ist der Aufhänger für die Gespräche.

### Die vier Archetypen

| Archetyp | Auslöser der Kürzung |
|---|---|
| Statische Kappung | konstante Obergrenze, Referenzfall |
| Zeitfenster | vereinbarte Wochentag- und Stundenfenster |
| Dynamisch nach Referenzanlage | Erzeugung der Region über einer Schwelle |
| Volldynamisch | synthetisches Engpassprofil des Netzknotens |

Bei den beiden dynamischen Fällen verteilt das Zugangsprinzip die Kürzung des
Knotens auf die Teilnehmer. LIFO kürzt von hinten nach vorn, pro rata gleichmäßig.
Die Spreizung zwischen erster und letzter Position ist der größte einzelne Hebel
im Vertrag und deshalb ein eigener Regler.

## Modell

Die Simulation rechnet 8.760 Stunden je Wetterjahr, vollständig im Browser, ohne
Backend. Für jede Stunde stehen zwei Fälle nebeneinander: der feste Anschluss als
Referenz und derselbe Standort unter den Bedingungen des FCA. Die Differenz ist
der Verlust, den das Angebot verursacht.

- **PV Freifläche** Erzeugungsprofil mal installierte Leistung, gekappt auf die
  jeweils zulässige Leistung. Die Kappung durch Überbauung fällt auch beim festen
  Anschluss an und wird getrennt ausgewiesen.
- **Batteriespeicher** Arbitragefahrplan am Day-Ahead-Markt mit perfekter
  Voraussicht innerhalb des Kalendertags. Der Fahrplan wird zweimal gerechnet,
  einmal frei und einmal unter den Grenzen des FCA. Der Speicher weicht der
  Kürzung damit so weit aus, wie es seine Spielräume zulassen, was den Verlust
  deutlich kleiner macht als eine naive Kappung.
- **Industrielle Last** Lastprofil mal Anschlussleistung, gekappt auf die
  zulässige Entnahme. Bewertet über einen Deckungsbeitrag je bezogener MWh.

**P50 und P90** sind bewusst grob: kein Monte Carlo, sondern drei hinterlegte
Wetterjahre plus ein Engpass-Stressfaktor. P50 ist das mittlere, P90 das
schwächste Jahr mit verschärftem Engpass. Geordnet wird nach dem wirtschaftlichen
Jahresergebnis, nicht nach der Arbeit, sonst läge P90 beim Speicher über P50.

**Bekannte Modellgrenzen**, alle auch im UI sichtbar:

- Kein Lastfluss, kein Netzmodell, keine Netzbetreiberanbindung.
- Engpassprofile sind synthetisch, parametrisiert über Häufigkeit und Kopplung an
  die regionale Erzeugung.
- Der Leistungsgradient wirkt bei Stundenauflösung erst unterhalb von etwa
  1,7 Prozent je Minute. Darüber ist der Effekt im Modell null.
- Die Engpasstiefe der Referenzanlagenregelung ist wahlweise binär oder gleitend.
  Nur gleitend kann das Zugangsprinzip überhaupt wirken.

Der Simulationskern unter `lib/sim` ist rein funktional und ohne UI aufrufbar.
Abgedeckt sind: Kappung greift, LIFO verteilt korrekt und summiert sich über den
Stack auf pro rata, Energiebilanz schließt, Zeitfenster begrenzen nur innerhalb
des Fensters, Entschädigung rechnet auf die abgeregelte Arbeit, dazu die
Grenzfälle ohne und mit vollständiger Abregelung.

## Daten

Alle Zeitreihen liegen als JSON unter `data/profile`, jede mit Quelle, Lizenz,
Jahr und Verarbeitungsschritten im Kopf. Die Herkunft ist im UI einsehbar.

| Reihe | Quelle | Lizenz |
|---|---|---|
| Photovoltaik und Wind onshore, Ist-Erzeugung je Regelzone | Bundesnetzagentur, SMARD.de | CC BY 4.0 |
| Großhandelspreis Day-Ahead DE/LU | Bundesnetzagentur, SMARD.de | CC BY 4.0 |
| Lastprofile Industrie und Gewerbe | eigene Nachbildung der BDEW/VDEW-Strukturmerkmale | frei verwendbar |
| Engpassprofile | synthetisch, parametrisiert | eigen |

Bei Verwendung der SMARD-Reihen ist die Quelle anzugeben:
`Bundesnetzagentur | SMARD.de`.

**renewables.ninja wird bewusst nicht verwendet.** Die Daten stehen unter
CC BY-NC 4.0 und sind damit für alles nach dem Prototyp unbrauchbar. PVGIS und
das Marktstammdatenregister sind nicht eingebunden, kämen aber als Ergänzung in
Frage, PVGIS erst nach Prüfung der Nutzungsbedingungen.

### Aufbereitung der Erzeugungsreihen

SMARD liefert Flottenzeitreihen einer ganzen Regelzone. Durch die räumliche
Glättung über hunderte Standorte ist ihr Verlauf flacher als der einer einzelnen
Anlage, und die Flotte erreicht nie ihre Nennleistung. Für die Bewertung einer
Kappungsgrenze ist genau die Verteilungsform entscheidend, deshalb wird das
Flottenprofil über `p = faktor * flotte^gamma` auf ein Einzelanlagenprofil
umgerechnet. Die beiden Parameter werden je Regelzone und Jahr so bestimmt, dass
Spitzenleistung und Vollbenutzungsstunden zu realen Standorten passen. Die
Streuung zwischen den Wetterjahren bleibt dabei erhalten.

Zur Kontrolle: die Preisreihe enthält für 2024 exakt die 457 veröffentlichten
Stunden mit negativem Day-Ahead-Preis, für 2023 sind es 301 und für 2025 573. Die
aus den Profilen errechnete Marktwertquote der Photovoltaik liegt im Mittel über
die vier Regelzonen bei 0,73 für 2023, 0,54 für 2024 und 0,46 für 2025 und bildet
damit den fallenden Marktwert korrekt ab.

## Bewusst nicht drin

- **Angebot automatisch auslesen.** Testet nicht die Kernhypothese, ist die
  aufwendigste Komponente, und ein halb funktionierender Extraktor dominiert das
  Gespräch. Die Anforderungen dafür entstehen erst aus den Schreiben, die in den
  Tests eingesammelt werden.
- Nutzerkonten, Persistenz über die Sitzung hinaus, Portfolioansicht.
- Mehrsprachigkeit. Niederländische Vertragsformen frühestens in Runde zwei und
  dann auf Basis echter Vertragsmuster.
- Preisprognosen aus Marktmodellen.

## Vertraulichkeit

Die in den Gesprächen eingesammelten FCA-Angebote sind vertrauliche
Geschäftsunterlagen. Sie gehören nicht in dieses Repo, nicht nach `data` und
nicht in Prompts an Dritte. Ablage getrennt, mit schriftlicher Zustimmung der
Teilnehmenden und in anonymisierter Form.

## Verzeichnisse

```
app/                  Einstieg, Layout, Design-Tokens
components/           Screens und Diagramme
components/ui/        shadcn/ui, per CLI erzeugt
lib/sim/              Simulationskern, rein funktional
lib/sim/archetypen/   je Archetyp eine Datei
lib/finanz/           Kapitalwert, LCOE, Amortisation
lib/kennzahlen.ts     welche Größe ein Anlagentyp als Ergebnis trägt
data/profile/         Erzeugungs-, Preis- und Lastprofile als JSON
data/annahmen/        Startwerte je Anlagentyp
scripts/              ETL für die Zeitreihen
```
