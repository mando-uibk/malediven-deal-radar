# Malediven Deal Radar

Eine mobile Angebotsseite für zwei Reisende aus Innsbruck. Die Recherche läuft als geplante Codex-Routine – ohne separaten OpenAI-API-Key und ohne Pay-as-you-go-API-Kosten. Nach jeder Suche werden die geprüften Treffer lokal gespeichert, die Seite neu erzeugt und bei verbundenem GitHub-Repository veröffentlicht.

## Suchprofil

- Reisezeitraum: **26.11.2026 bis 10.12.2026**
- mindestens **9 Nächte**
- Abflug: **München (MUC), Zürich (ZRH), Wien (VIE)**
- maximal **4.000 € pro Person** bei zwei Erwachsenen
- **All Inclusive** und **All Inclusive Plus/Premium/Ultra** werden beide aufgenommen und auf der Seite klar getrennt
- konkrete Angebots- oder Buchungsseite ausschließlich auf **Deutsch oder Englisch**
- Pauschalreise inklusive Flug
- nur etablierte Reiseveranstalter, Buchungsportale und seriöse kuratierte Dealportale; darunter **Secret Escapes, Voyage Privé, Restplatzbörse, 5vorFlug, L'TUR, Urlaubspiraten und Travelzoo**
- Recherche zweimal täglich um **07:15 und 19:15 Uhr** (Europe/Vienna)
- bis zu **18 belastbare Angebote** pro Aktualisierung; gesucht werden bis zu 12 Kandidaten je Abflughafen

Die Werte stehen in [`config/trip.json`](config/trip.json).

## Ablauf ohne API-Key

1. Die geplante Codex-Routine recherchiert aktuelle, konkret belegte Angebote im Web.
2. Sie schreibt die Ergebnisse nach [`data/latest-offers.json`](data/latest-offers.json).
3. `npm run publish` prüft, filtert und rankt die Angebote und erzeugt [`site/index.html`](site/index.html).
4. Wenn ein GitHub-Remote verbunden ist, committet und pusht die Routine die Aktualisierung.
5. GitHub Actions veröffentlicht ausschließlich die fertige statische Seite. Dort wird kein OpenAI-Key benötigt.

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
