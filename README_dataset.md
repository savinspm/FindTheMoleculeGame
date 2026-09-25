# FindTheMoleculeGame Dataset Preparation

## `prepare_lbvs_dataset.py` (current pipeline)

This is the script that generates the data the game reads at runtime. It computes **real cheminformatics**, not heuristics: ECFP4 (Morgan, radius 2, 2048-bit) fingerprints and pairwise Tanimoto similarity over the molecule pool in `molecule-game-web/data/DB/*.mol2`, via [RDKit](https://www.rdkit.org/).

It is **build-time only** — the game itself never runs RDKit or Python; it just reads the JSON files this script writes.

### Setup

```bash
python3 -m venv .venv
.venv/bin/pip install rdkit numpy
```

### Run

```bash
.venv/bin/python3 prepare_lbvs_dataset.py
```

### What it does

1. Parses every `molecule-game-web/data/DB/*.mol2` file with RDKit. Files RDKit can't parse, or molecules with fewer than 6 heavy atoms (single ions, tiny fragments — their fingerprints are too sparse to mean anything), are excluded from the pool.
2. Computes ECFP4 fingerprints and the full pairwise Tanimoto similarity matrix over the remaining pool (~340 molecules).
3. For every molecule, precomputes its `neighbors` (closest others by Tanimoto) and `decoys` (low-similarity, size-matched candidates, so "pick the biggest one" is never a shortcut).
4. Builds game levels: for each target molecule, 1 real nearest neighbor + 2 decoys, shuffled, with the correct one flagged `isMatch: true` and its real Tanimoto score attached (shown to the player after a correct guess).

### Output files (under `molecule-game-web/data/`)

| File | Contents |
|---|---|
| `lbvs_dataset.json` | Per-molecule metadata + `neighbors`/`decoys` lists with Tanimoto scores (source data) |
| `molecules.json` | What the game actually reads: levels as `{ target, options: [3 candidates, one flagged isMatch] }` |

### Key tunables (top of the script)

- `MIN_HEAVY_ATOMS` — pool filter (default 6).
- `NEIGHBORS_TOP_K` / `DECOY_POOL_SIZE` / `DECOY_MAX_TANIMOTO` / `DECOY_SIZE_TOLERANCE` — how neighbors/decoys are picked.
- `CANDIDATE_LEVELS` — how many levels to generate.

---

## `prepare_molecules.py` (legacy, superseded)

The original dataset script, kept for reference. It selected molecules and paired them by **atom-count proximity only** (no real chemistry), which is what `prepare_lbvs_dataset.py` replaced. It's no longer used to generate `molecules.json`.

<details>
<summary>Original docs</summary>

### What the Script Did

1. **Selected Target Molecules**: selected molecules from a `preliminaryDB` folder, ranging from the smallest to the largest in atom count.
2. **Found Similar Molecules**: for each target, found two similar molecules based on atom count to use as incorrect options.
3. **Created Progressive Difficulty**: arranged molecules in ascending order of complexity.
4. **Generated JSON Dataset**: wrote `molecule-game-web/data/molecules.json` with the old `{ target, similar: [2] }` schema.
5. **Copied Required Files**: copied only the selected `.mol2` files to `data/DB`.

### Usage

```bash
python prepare_molecules.py
```

Place source `.mol2` files in `preliminaryDB/` at the repo root first.

</details>
