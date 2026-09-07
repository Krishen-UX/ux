# Entwürfe zur Neustruktur

Quelldateien des Design-Canvas, aus dem der Klickprototyp entstanden ist. Jede
`.dc.html` ist ein Artboard, `canvas.json` legt sie auf der Fläche aus.

| Datei | Inhalt |
|---|---|
| `Main.dc.html` | Ablaufvergleich heute gegen Vorschlag, die drei Hebel |
| `Start.dc.html` | Screen 1, Einstieg mit drei Angaben und dem Angebotsschreiben |
| `Pruefen.dc.html` | Screen 2, Prüfen der ausgelesenen Angaben |
| `Ergebnis.dc.html` | Screen 3, Ergebnis mit vorgezogener Verhandlungsagenda |
| `Muster.dc.html` | Sechs UX-Muster, die die Formulare ersetzen |

Die Zitate aus dem Angebotsschreiben und die Marktstammdaten-Abfrage in
`Pruefen.dc.html` sind erfunden. Es gibt kein zugehöriges Dokument.

Die Farbwerte stammen aus `app/globals.css`, die Kapitalwerte aus dem
Simulationskern. Gerechnet ist der Batteriespeicher-Standardfall mit Netzausbau
ab Jahr 8.

## Ausgangslage

Der Engpass ist nicht die Rechnung, sondern die Übertragung eines Dokuments, das
der Anschlussbegehrende bereits hat. Gezählt: 31 Bedienelemente bis zum Ergebnis,
12 im Projektschritt und 19 im Angebotsschritt, dazu 17 im Annahmenblock.

Drei Hebel nehmen diese Arbeit ab:

1. **Auslesen statt Abtippen.** Archetyp, Grenzen, Zugangsprinzip, Fristen und
   Auflagen kommen aus dem Schreiben, jede Angabe mit ihrer Fundstelle.
2. **Vorbelegen statt Ausfüllen.** Aus Typ, Leistung und Ort folgen Regelzone,
   Profile und Kostenannahmen.
3. **Fragen statt Raten.** Was in keinem Angebot steht, wird zur Frage an den
   Netzbetreiber statt zum leeren Feld.

## Offener Punkt

Der Entwurf setzt das automatische Auslesen voraus. Die Spezifikation hatte es
bewusst aus Runde eins genommen, weil ein halb funktionierender Extraktor das
Interview dominiert. Im Klickprototyp ist das Auslesen deshalb simuliert und in
der Oberfläche als solches gekennzeichnet.
