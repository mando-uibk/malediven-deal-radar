# Malediven Deal Radar als Web-Task

Dieser Task benötigt keinen lokalen Rechner. Voraussetzung ist, dass in ChatGPT im Web die GitHub-App mit Schreibzugriff auf `mando-uibk/malediven-deal-radar` verbunden ist.

## Einmalige Einrichtung

1. In ChatGPT im Web einen neuen Chat öffnen und die GitHub-App verbinden.
2. Den Prompt unten senden und zunächst einmal manuell ausführen lassen.
3. Prüfen, ob `data/latest-offers.json` auf `main` aktualisiert wurde und der GitHub-Pages-Workflow erfolgreich war.
4. Den Chat anschließend als geplanten Task täglich um 07:15 und 19:15 Uhr in der Zeitzone Europe/Vienna ausführen lassen.
5. Erst danach die lokale Desktop-Routine pausieren, damit keine doppelten Läufe entstehen.

## Prompt zum Kopieren

```text
Aktualisiere den Malediven Deal Radar im verbundenen öffentlichen GitHub-Repository mando-uibk/malediven-deal-radar.

Lies zu Beginn über die GitHub-Verbindung config/trip.json und data/latest-offers.json aus dem Branch main. Recherchiere danach aktuelle, konkret buchbare Malediven-Pauschalreisen für zwei Erwachsene.

Harte Kriterien:
- Abflug ausschließlich MUC, ZRH oder VIE.
- Hinreise frühestens 26.11.2026, Rückreise spätestens 10.12.2026.
- Mindestens 9 Hotelnächte.
- Flug und Hotel müssen im ausgewählten Preis als Pauschalreise enthalten sein.
- Maximal 5.000 EUR pro Person beziehungsweise 10.000 EUR gesamt.
- Zulässig sind normales All Inclusive sowie getrennt ausgewiesenes All Inclusive Plus, Premium All Inclusive oder Ultra All Inclusive.
- Angebote unterhalb All Inclusive ausschließen.
- Die konkrete Angebots- oder Buchungsseite muss direkt auf Deutsch oder Englisch lesbar sein.

Suche breit bei etablierten Reiseveranstaltern, Buchungsportalen und seriösen Dealportalen, insbesondere TUI, DERTOUR, Meiers Weltreisen, BILLA Reisen, HolidayCheck Reisen, CHECK24 Reisen, weg.de, Expedia, Secret Escapes, Voyage Privé, Restplatzbörse Österreich, 5vorFlug, L'TUR, Urlaubspiraten und Travelzoo.

Dynamische Angebotsseiten sind zulässig. Preis, Reisedaten, Abflughafen, Flugpaket und genaue Verpflegungsstufe müssen jedoch im Live-Ergebnis geprüft sein. Wenn ein Direktlink die Auswahl nicht dauerhaft übernimmt, dokumentiere unter evidence oder warnings, dass Datum, Flughafen und Tarif nach dem Öffnen erneut gewählt werden müssen.

Erfasse normales All Inclusive als board = all_inclusive. Erfasse nur nachweislich erweiterte Stufen als board = all_inclusive_plus und übernimm deren Originalbezeichnung in evidence. Erfinde keine Preise, Termine, Leistungen, Transferarten, Gepäckangaben oder Bewertungen.

Strebe 12 bis 18 unterschiedliche, belastbare Angebote an. Weniger Treffer sind zulässig, wenn nicht mehr alle Kriterien erfüllen. Dedupliziere gleiche Kombinationen aus Resort, Flughafen, Hinreise, Rückreise und Verpflegung und behalte die günstigste.

Aktualisiere anschließend über die GitHub-Verbindung ausschließlich data/latest-offers.json auf dem Branch main im vorhandenen Schema. Setze updatedAt auf die aktuelle Zeit, ersetze offers vollständig durch die aktuell belegten Treffer und dokumentiere Quellen- oder Verfügbarkeitsunsicherheiten unter warnings. Ändere weder site/index.html noch andere Dateien: Der GitHub-Actions-Workflow prüft die JSON-Datei, erzeugt die Seite und veröffentlicht GitHub Pages automatisch.

Berichte abschließend knapp die Zahl der AI- und AI+-Treffer, die besten Preise, den GitHub-Commit und den Link https://mando-uibk.github.io/malediven-deal-radar/ . Wenn das GitHub-Update nicht möglich war, ändere nichts und melde den konkreten Grund.
```
