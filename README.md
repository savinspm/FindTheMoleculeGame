# Find The Candidate (Web Game)

An educational, time‑attack web game about **Ligand Based Virtual Screening (LBVS)** — the "similar structure → similar activity" principle used to screen drug candidates. You're shown a reference molecule and 3 candidates; only one is really its best chemical match, ranked by real ECFP4/Tanimoto similarity computed offline with RDKit (not a size heuristic). Built with 3Dmol.js and plain JavaScript/HTML/CSS, no build step required to play.

## Highlights
- 3D molecule viewer powered by 3Dmol.js (rotate by click + drag).
- Real chemistry: ECFP4 fingerprints + Tanimoto similarity computed with RDKit — the correct answer is the true nearest neighbor, and a correct pick reveals its real similarity score.
- 2×2 responsive grid: 1 target + 3 options.
- Timer and on‑screen stats (hits, attempts, accuracy).
- Local ranking stored in the browser (LocalStorage).
- Language selector (English/Español).
- Modern, colorful UI designed to be inviting for kids at a science fair.

## Project structure
```
.
├── molecule-game-web/
│   ├── index.html            # Game entry point
│   ├── css/styles.css        # Layout and styles
│   ├── data/
│   │   ├── molecules.json    # Game levels (target + 3 candidates, one real match)
│   │   ├── lbvs_dataset.json # Full neighbor/decoy data behind molecules.json
│   │   └── DB/*.mol2         # Molecule pool (DrugBank-derived)
│   ├── js/
│   │   ├── language.js       # i18n text labels
│   │   ├── molecule-parser.js# Loads/normalizes molecule data
│   │   ├── molecule-viewer.js# Initializes 3Dmol viewers
│   │   ├── game.js           # Game logic/state machine
│   │   └── ranking.js        # LocalStorage ranking logic
│   └── data/DB/*.mol2        # Sample MOL2 files used by the viewer
├── README.md                 # This file
├── README_dataset.md         # Dataset/pipeline notes
└── prepare_lbvs_dataset.py   # RDKit pipeline: fingerprints, Tanimoto, levels
```

## Prerequisites
- A modern browser (Chrome/Edge/Firefox/Safari).
- Serve the site over HTTP (don't open `index.html` with `file://`).
- To regenerate the dataset, Python 3 + RDKit (see `README_dataset.md`) — this is a **build-time only** dependency; the game itself is plain static files.

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
- Install the "Live Server" extension.
- Right‑click `molecule-game-web/index.html` → "Open with Live Server".

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

## Troubleshooting
- Molecules don't show: ensure you're serving over `http://` and the 3Dmol files under `js/` are reachable.
- Ranking doesn't persist: check you're not in a private/incognito window and LocalStorage is enabled.
- Layout issues: see `molecule-game-web/css/styles.css` media queries for small screens.

## License
This project is licensed under the terms described in `LICENSE`.
