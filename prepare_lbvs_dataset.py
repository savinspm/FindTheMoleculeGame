#!/usr/bin/env python3
"""
LBVS dataset preparation.

Computes real cheminformatics data (ECFP4 fingerprints, Tanimoto similarity)
from the existing molecule-game-web/data/DB/*.mol2 pool, and writes the JSON
files "Encuentra el Candidato" reads at runtime:

- data/lbvs_dataset.json  molecule metadata + per-molecule neighbors/decoys
- data/molecules.json     game levels (target + 3 options, 1 real neighbor + 2 decoys)

Run inside the project venv:
    .venv/bin/python3 prepare_lbvs_dataset.py
"""

import glob
import json
import os
import random
from datetime import datetime, timezone

import numpy as np
from rdkit import Chem, RDLogger
from rdkit.Chem import rdFingerprintGenerator
from rdkit.DataStructs import TanimotoSimilarity

RDLogger.DisableLog("rdApp.*")

DB_PATH = "molecule-game-web/data/DB"
OUT_DIR = "molecule-game-web/data"

FP_RADIUS = 2
FP_BITS = 2048

NEIGHBORS_TOP_K = 10
DECOY_POOL_SIZE = 15
DECOY_MAX_TANIMOTO = 0.12
DECOY_SIZE_TOLERANCE = 0.25  # +/- 25% heavy-atom count

CANDIDATE_LEVELS = 150
RANDOM_SEED = 42

# Molecules below this many heavy atoms (single ions, tiny fragments like Zn2+, K+...)
# produce near-empty, meaningless fingerprints and are excluded from the whole pool.
MIN_HEAVY_ATOMS = 6


def load_molecules():
    files = sorted(glob.glob(os.path.join(DB_PATH, "*.mol2")))
    mols = {}
    failed, too_small = [], []
    for path in files:
        mol_id = os.path.splitext(os.path.basename(path))[0]
        mol = Chem.MolFromMol2File(path, sanitize=True)
        if mol is None:
            failed.append(mol_id)
            continue
        if mol.GetNumHeavyAtoms() < MIN_HEAVY_ATOMS:
            too_small.append(mol_id)
            continue
        mols[mol_id] = mol
    print(f"Parsed {len(mols)} / {len(files)} molecules "
          f"({len(failed)} failed, {len(too_small)} below {MIN_HEAVY_ATOMS} heavy atoms).")
    if failed:
        print("Excluded (failed to parse):", ", ".join(failed))
    if too_small:
        print("Excluded (too small for meaningful fingerprints):", ", ".join(too_small))
    return mols


def compute_fingerprints(mols):
    gen = rdFingerprintGenerator.GetMorganGenerator(radius=FP_RADIUS, fpSize=FP_BITS)
    return {mol_id: gen.GetFingerprint(mol) for mol_id, mol in mols.items()}


def compute_similarity_matrix(ids, fps):
    n = len(ids)
    sim = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        for j in range(i + 1, n):
            s = TanimotoSimilarity(fps[ids[i]], fps[ids[j]])
            sim[i, j] = s
            sim[j, i] = s
    return sim


def build_neighbors_and_decoys(ids, sim, heavy_atoms, rng):
    id_index = {mid: i for i, mid in enumerate(ids)}
    neighbors, decoys = {}, {}

    for mid in ids:
        i = id_index[mid]
        ranked = sorted(
            ((ids[j], float(sim[i, j])) for j in range(len(ids)) if j != i),
            key=lambda pair: -pair[1],
        )
        neighbors[mid] = [{"id": oid, "tanimoto": round(s, 4)} for oid, s in ranked[:NEIGHBORS_TOP_K]]

        target_ha = heavy_atoms[mid]
        low, high = target_ha * (1 - DECOY_SIZE_TOLERANCE), target_ha * (1 + DECOY_SIZE_TOLERANCE)
        pool = [oid for oid, s in ranked if s <= DECOY_MAX_TANIMOTO and low <= heavy_atoms[oid] <= high]
        if len(pool) < DECOY_POOL_SIZE:
            pool = [oid for oid, s in ranked if s <= DECOY_MAX_TANIMOTO]
        pool = pool[:]
        rng.shuffle(pool)
        decoys[mid] = pool[:DECOY_POOL_SIZE]

    return neighbors, decoys


def build_lbvs_dataset(ids, heavy_atoms, neighbors, decoys):
    molecules = [
        {"id": mid, "file": f"{mid}.mol2", "name": mid, "heavy_atoms": heavy_atoms[mid]}
        for mid in ids
    ]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "fingerprint": {"type": "Morgan/ECFP4", "radius": FP_RADIUS, "nBits": FP_BITS},
        "molecules": molecules,
        "neighbors": neighbors,
        "decoys": decoys,
    }


def build_candidate_levels(ids, heavy_atoms, neighbors, decoys, rng):
    """Levels for 'Encuentra el Candidato': target + 3 options (1 real neighbor, 2 decoys)."""
    sorted_ids = sorted(ids, key=lambda mid: heavy_atoms[mid])
    used_targets = set()
    levels = []

    for mid in sorted_ids:
        if mid in used_targets:
            continue

        neighbor_candidates = [n for n in neighbors[mid] if n["tanimoto"] < 0.999]
        decoy_candidates = list(decoys[mid])
        rng.shuffle(decoy_candidates)

        if len(neighbor_candidates) < 1 or len(decoy_candidates) < 2:
            continue

        neighbor_choice = neighbor_candidates[0]
        decoy_choices = decoy_candidates[:2]

        options = [
            {
                "name": neighbor_choice["id"],
                "file": f"{neighbor_choice['id']}.mol2",
                "atom_count": heavy_atoms[neighbor_choice["id"]],
                "tanimoto": neighbor_choice["tanimoto"],
                "isMatch": True,
            }
        ] + [
            {
                "name": did,
                "file": f"{did}.mol2",
                "atom_count": heavy_atoms[did],
                "tanimoto": round(next((n["tanimoto"] for n in neighbors[mid] if n["id"] == did), 0.0), 4),
                "isMatch": False,
            }
            for did in decoy_choices
        ]

        levels.append({
            "target": {"name": mid, "file": f"{mid}.mol2", "atom_count": heavy_atoms[mid]},
            "options": options,
        })
        used_targets.add(mid)

        if len(levels) >= CANDIDATE_LEVELS:
            break

    return {"levels": levels, "total": len(levels)}


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {path} ({os.path.getsize(path) / 1024:.1f} KB)")


def main():
    rng = random.Random(RANDOM_SEED)

    mols = load_molecules()
    ids = sorted(mols.keys())
    heavy_atoms = {mid: mol.GetNumHeavyAtoms() for mid, mol in mols.items()}

    print("Computing ECFP4 fingerprints...")
    fps = compute_fingerprints(mols)

    print("Computing pairwise Tanimoto similarity matrix...")
    sim = compute_similarity_matrix(ids, fps)

    print("Building neighbor / decoy lists...")
    neighbors, decoys = build_neighbors_and_decoys(ids, sim, heavy_atoms, rng)

    lbvs_dataset = build_lbvs_dataset(ids, heavy_atoms, neighbors, decoys)
    candidate_levels = build_candidate_levels(ids, heavy_atoms, neighbors, decoys, rng)

    write_json(os.path.join(OUT_DIR, "lbvs_dataset.json"), lbvs_dataset)
    write_json(os.path.join(OUT_DIR, "molecules.json"), candidate_levels)

    print(f"\nDone. {len(ids)} molecules, {candidate_levels['total']} candidate levels.")


if __name__ == "__main__":
    main()
