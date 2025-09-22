# Find The Molecule (Web Game)

An educational, time‑attack web game where you must find the correct 3D molecule among multiple options. Built with 3Dmol.js and plain JavaScript/HTML/CSS.

## Highlights
- 3D molecule viewer powered by 3Dmol.js (rotate by click + drag).
- 2×2 responsive grid: 1 target + 3 options.
- Timer and on‑screen stats (hits, attempts, accuracy).
- Local ranking stored in the browser (LocalStorage).
- Language selector (English/Español).

## Project structure
```
.
├── molecule-game-web/
│   ├── index.html            # Game entry point
│   ├── css/styles.css        # Layout and styles
│   ├── data/molecules.json   # Molecules metadata used by the game
│   ├── js/
│   │   ├── language.js       # i18n text labels
│   │   ├── molecule-parser.js# Loads/normalizes molecule data
│   │   ├── molecule-viewer.js# Initializes 3Dmol viewers
│   │   ├── game.js           # Game logic/state machine
│   │   ├── ranking.js        # LocalStorage ranking logic
│   │   └── dev-tools.js      # (optional) helper to seed rankings
│   └── data/DB/*.mol2        # Sample MOL2 files used by the viewer
├── README.md                 # This file
├── README_dataset.md         # Dataset/building notes
└── prepare_molecules.py      # Dataset preparation helper
```

## Prerequisites
- A modern browser (Chrome/Edge/Firefox/Safari).
- Serve the site over HTTP (don’t open `index.html` with `file://`).

## Quick start (Python)
From the repo root:

```bash
cd molecule-game-web
python3 -m http.server 8000
```

Then open:

```
http://localhost:8000/
```

## Quick start (VS Code Live Server)
- Install the “Live Server” extension.
- Right‑click `molecule-game-web/index.html` → “Open with Live Server”.

## Quick start (Node.js)
If you prefer Node.js and have npm:

```bash
npx serve molecule-game-web -l 8000
# or
npx http-server molecule-game-web -p 8000 -c-1
```

## Ranking details
- Storage: Browser LocalStorage under the key `molecule_game_rankings`.
- Order: by hits (desc), accuracy ratio (desc), time (asc).
- View/clear via DevTools console:

```js
JSON.parse(localStorage.getItem('molecule_game_rankings') || '[]')
localStorage.removeItem('molecule_game_rankings')
```

### Seed the ranking with random data (optional)
For quick demos, a helper exposes `seedRankings(count = 10, clear = false)`:

```js
// In the browser console, after loading the page
seedRankings(15, true) // 15 random players, clearing previous data
```

If you don’t see it, ensure `js/dev-tools.js` is included at the end of `index.html`.

## Troubleshooting
- Molecules don’t show: ensure you’re serving over `http://` and the 3Dmol CDN is reachable.
- Ranking doesn’t persist: check you’re not in a private/incognito window and LocalStorage is enabled.
- Layout issues: see `molecule-game-web/css/styles.css` media queries for small screens.

## License
This project is licensed under the terms described in `LICENSE`.