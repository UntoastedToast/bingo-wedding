# Wedding Bingo

Eine interaktive Web-App für ein Bingo-Spiel im Hochzeits-Thema.

## Beschreibung

Diese Web-App ermöglicht Hochzeitsgästen, ein Bingo-Spiel zu spielen. Jeder Tisch (Team) hat eine eigene Bingo-Karte mit verschiedenen Foto-Aufgaben. Sobald ein Team eine Reihe komplettiert (horizontal, vertikal oder diagonal), gewinnt es.

## Features

- 10 verschiedene Bingo-Karten für verschiedene Teams
- Persistente Spielstände durch localStorage
- Responsive Design für Smartphones
- Gewinner-Animation mit Konfetti
- Professionelles, modulares JavaScript-Design

## Technologien

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Konfetti-Animation via [canvas-confetti](https://github.com/catdad/canvas-confetti)

## Installation

1. Repository klonen
2. Einen lokalen Webserver starten
3. Die Anwendung im Browser öffnen

## Verwendung

1. Wähle deinen Tisch/Team aus
2. Fotografiere die angegebenen Aufgaben und markiere sie auf der Bingo-Karte
3. Wenn du eine vollständige Reihe hast: BINGO!

## Struktur

```
bingo-wedding/
├── index.html            # Haupt-HTML-Datei
├── css/
│   └── styles.css        # CSS-Stile
├── js/
│   ├── app.js            # Haupt-Anwendungsdatei
│   ├── bingoGame.js      # Bingo-Spiellogik
│   ├── config.js         # Konfigurationseinstellungen
│   ├── dataService.js    # Datenverwaltung
│   └── uiController.js   # UI-Steuerung
└── json/
    └── tasks.json        # Bingo-Aufgaben
```

## Lizenz

MIT
