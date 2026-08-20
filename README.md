# Malediven Deal Radar

Eine mobile Angebotsseite für zwei Reisende aus Innsbruck. Die Recherche kann als geplanter ChatGPT-Web-Task laufen – ohne lokalen Rechner, separaten OpenAI-API-Key oder Pay-as-you-go-API-Kosten. Der Web-Task aktualisiert die geprüften Treffer im GitHub-Repository; GitHub Actions prüft die Daten, erzeugt die Seite und veröffentlicht sie.

## Suchprofil

- Reisezeitraum: **26.11.2026 bis 10.12.2026**
- mindestens **9 Nächte**
- Abflug: **München (MUC), Zürich (ZRH), Wien (VIE)**
- maximal **5.000 € pro Person** bei zwei Erwachsenen
- **All Inclusive** und **All Inclusive Plus/Premium/Ultra** werden beide aufgenommen und auf der Seite klar getrennt
- konkrete Angebots- oder Buchungsseite ausschließlich auf **Deutsch oder Englisch**
- Pauschalreise inklusive Flug
- nur etablierte Reiseveranstalter, Buchungsportale und seriöse kuratierte Dealportale; darunter **Secret Escapes, Voyage Privé, Restplatzbörse, 5vorFlug, L'TUR, Urlaubspiraten und Travelzoo**
- dynamische Angebotsseiten wie **BILLA/DERTOUR, TUI, HolidayCheck Reisen, CHECK24 Reisen oder weg.de** sind zulässig, wenn Preis, Termin, Flughafen, Flugpaket und AI-Stufe im Live-Ergebnis geprüft wurden; nach dem Öffnen kann eine erneute Auswahl nötig sein
- Recherche zweimal täglich um **07:15 und 19:15 Uhr** (Europe/Vienna)
- bis zu **18 belastbare Angebote** pro Aktualisierung; gesucht werden bis zu 12 Kandidaten je Abflughafen

Die Werte stehen in [`config/trip.json`](config/trip.json).

## Cloud-Ablauf ohne lokalen Rechner und API-Key

1. Ein geplanter ChatGPT-Web-Task recherchiert aktuelle, konkret belegte Angebote.
2. Über die verbundene GitHub-App aktualisiert er ausschließlich [`data/latest-offers.json`](data/latest-offers.json) auf `main`.
3. Der Push startet GitHub Actions. Der Workflow führt `npm test` und `npm run publish` in der Cloud aus.
4. GitHub Pages veröffentlicht die neu erzeugte [`site/index.html`](site/index.html).

Der vollständige Prompt und die einmalige Einrichtung stehen in [`WEB_TASK_PROMPT.md`](WEB_TASK_PROMPT.md). Die bisherige lokale Routine sollte erst deaktiviert werden, nachdem der Web-Task einmal erfolgreich bis zur Live-Seite durchgelaufen ist.

Preise und Verfügbarkeit ändern sich schnell. Vor der Buchung müssen Reisedaten, Flughafen, Gepäck, Transfer, die genaue AI- oder AI+-Leistungsbeschreibung und der Gesamtpreis auf der deutsch- oder englischsprachigen Anbieterseite bestätigt werden.

## Lokal prüfen

Voraussetzung ist Node.js 22 oder neuer.

```powershell
npm test
npm run publish
```

Anschließend lässt sich `site/index.html` direkt im Browser öffnen.

## Einmalig mit GitHub verbinden

Das lokale Projekt benötigt ein GitHub-Repository als Remote. Danach:

1. Die Dateien auf den Hauptbranch pushen.
2. Unter **Settings → Pages → Build and deployment** als Source **GitHub Actions** auswählen.
3. Den Workflow **Malediven Deal Radar veröffentlichen** einmal starten oder eine Änderung an `site/` pushen.

Die veröffentlichte URL kann anschließend wie jede normale Webseite per WhatsApp geteilt und auf dem Handy zum Home-Bildschirm hinzugefügt werden. Die Seite setzt keine Cookies; Favoriten bleiben nur im jeweiligen Browser. Wegen `noindex` soll sie nicht in Suchmaschinen erscheinen, technisch ist eine GitHub-Page aber öffentlich erreichbar.

## Dateien

- [`data/latest-offers.json`](data/latest-offers.json): von der Routine gepflegte Live-Funde
- [`site/index.html`](site/index.html): veröffentlichte mobile Seite
- [`config/trip.json`](config/trip.json): Suchkriterien
- [`.github/workflows/pages.yml`](.github/workflows/pages.yml): reine GitHub-Pages-Veröffentlichung

Der ältere API-Suchcode in `src/search.js` bleibt als optionale Alternative vorhanden, wird von der geplanten Codex-Routine und dem Pages-Workflow aber nicht verwendet.
