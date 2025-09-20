#!/usr/bin/env python3
"""
Molecule Game Dataset Preparation Script

This script:
1. Reads .mol2 files from the preliminaryDB folder
2. Extracts molecule information including atom count
3. Selects 120 molecules with a good distribution of sizes
4. Finds two similar molecules for each target molecule
5. Organizes molecules in ascending order of complexity
6. Creates a JSON dataset for the game
7. Copies selected .mol2 files to the data/DB folder
"""

import os
import sys
import json
import shutil
import re
from collections import defaultdict
import random
import math

# Configuration
PRELIMINARY_DB_PATH = (
    "molecule-game-web/data/preliminaryDB"  # Source directory with all mol2 files
)
TARGET_DB_PATH = "molecule-game-web/data/DB"  # Target directory for selected mol2 files
JSON_OUTPUT_PATH = "molecule-game-web/data/molecules.json"  # JSON dataset for the game
NUM_MOLECULES = 120  # Number of target molecules to select
SIMILARITY_THRESHOLD = 0.2  # Maximum difference in atom count (as a percentage) for similar molecules

def parse_mol2_file(file_path):
    """
    Parse a .mol2 file and extract relevant information.
    Returns a dictionary with molecule information.
    """
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Extract molecule name
        name_match = re.search(r'@<TRIPOS>MOLECULE\s+(\S+)', content)
        name = name_match.group(1) if name_match else os.path.basename(file_path).replace('.mol2', '')
        
        # Extract atom count
        atom_count_match = re.search(r'@<TRIPOS>MOLECULE\s+\S+\s+(\d+)', content)
        atom_count = int(atom_count_match.group(1)) if atom_count_match else 0
        
        # Count specific atom types
        c_atoms = len(re.findall(r'\s+C\.\d+\s+', content))
        o_atoms = len(re.findall(r'\s+O\.\d+\s+', content))
        n_atoms = len(re.findall(r'\s+N\.\d+\s+', content))
        h_atoms = len(re.findall(r'\s+H\s+', content))
        
        return {
            'file_path': file_path,
            'name': name,
            'atom_count': atom_count,
            'c_atoms': c_atoms,
            'o_atoms': o_atoms,
            'n_atoms': n_atoms,
            'h_atoms': h_atoms,
            'file_name': os.path.basename(file_path)
        }
    except Exception as e:
        print(f"Error parsing {file_path}: {str(e)}")
        return None

def collect_molecule_data(db_path, min_atoms=5):
    """
    Collect information about all molecules in the database.
    Returns a list of molecule data dictionaries.
    
    Args:
        db_path: Path to the directory containing .mol2 files
        min_atoms: Minimum number of atoms required (default: 5)
    """
    molecules = []
    
    if not os.path.exists(db_path):
        print(f"Error: The directory '{db_path}' does not exist.")
        return molecules
    
    mol2_files = [f for f in os.listdir(db_path) if f.endswith('.mol2')]
    
    if not mol2_files:
        print(f"Error: No .mol2 files found in '{db_path}'.")
        return molecules
    
    print(f"Found {len(mol2_files)} .mol2 files in '{db_path}'.")
    
    for file_name in mol2_files:
        file_path = os.path.join(db_path, file_name)
        molecule_data = parse_mol2_file(file_path)
        if molecule_data and molecule_data['atom_count'] >= min_atoms:
            molecules.append(molecule_data)
    
    print(f"Found {len(molecules)} molecules with at least {min_atoms} atoms.")
    return molecules

def select_representative_molecules(molecules, num_to_select=10, min_atoms=5):
    """
    Select a diverse set of representative molecules based on atom count.
    
    Args:
        molecules: List of molecule data dictionaries
        num_to_select: Number of representative molecules to select
        min_atoms: Minimum number of atoms required in any selected molecule
    """
    # Filter molecules to ensure minimum atom count
    molecules = [m for m in molecules if m['atom_count'] >= min_atoms]
    
    if not molecules:
        print(f"Error: No molecules found with at least {min_atoms} atoms.")
        return []
    
    # Sort molecules by atom count
    molecules.sort(key=lambda x: x['atom_count'])
    
    # Create bins of molecules with similar atom counts
    bins = {}
    for molecule in molecules:
        atom_count = molecule['atom_count']
        if atom_count not in bins:
            bins[atom_count] = []
        bins[atom_count].append(molecule)
    
    # Select one molecule from each bin, prioritizing bins with different atom counts
    selected_molecules = []
    used_file_paths = set()
    
    # Get sorted unique atom counts
    atom_counts = sorted(bins.keys())
    
    print(f"Atom count distribution: {', '.join([f'{count}: {len(bins[count])}' for count in atom_counts])}")
    
    # Try to select num_to_select molecules
    while len(selected_molecules) < num_to_select and atom_counts:
        # Start from the smallest molecule and move upward
        for atom_count in atom_counts[:]:
            if not bins[atom_count]:  # If this bin is empty, remove it
                atom_counts.remove(atom_count)
                continue
                
            # Get a molecule from this bin
            molecule = bins[atom_count].pop(0)
            file_path = molecule['file_path']
            
            if file_path not in used_file_paths:
                selected_molecules.append(molecule)
                used_file_paths.add(file_path)
                
                # If we have enough molecules, break
                if len(selected_molecules) >= num_to_select:
                    break
        
        # If we've gone through all atom counts and still need more molecules,
        # break to avoid an infinite loop
        if not any(bins.values()):
            break
    
    print(f"Selected {len(selected_molecules)} representative molecules, starting with {min_atoms} atoms.")
    return selected_molecules

def find_similar_molecules(target, all_molecules, similarity_threshold, exclude=None):
    """
    Find molecules similar to the target molecule based on atom count.
    Returns a list of similar molecules.
    
    Args:
        target: The target molecule dictionary
        all_molecules: List of all molecule dictionaries
        similarity_threshold: Maximum percentage difference in atom count
        exclude: List of file paths to exclude
    """
    if exclude is None:
        exclude = []
    
    target_atom_count = target['atom_count']
    max_diff = target_atom_count * similarity_threshold
    
    # Filter molecules within the similarity threshold
    similar_candidates = [
        mol for mol in all_molecules
        if (abs(mol['atom_count'] - target_atom_count) <= max_diff) and
           (mol['file_path'] != target['file_path']) and
           (mol['file_path'] not in exclude)
    ]
    
    # If not enough similar molecules, gradually increase the threshold
    if len(similar_candidates) < 2:
        threshold_multiplier = 1.5
        while len(similar_candidates) < 2 and threshold_multiplier <= 5:
            new_max_diff = target_atom_count * similarity_threshold * threshold_multiplier
            similar_candidates = [
                mol for mol in all_molecules
                if (abs(mol['atom_count'] - target_atom_count) <= new_max_diff) and
                   (mol['file_path'] != target['file_path']) and
                   (mol['file_path'] not in exclude)
            ]
            threshold_multiplier += 0.5
    
    # If still not enough, just take the closest ones by atom count
    if len(similar_candidates) < 2:
        candidates = [
            mol for mol in all_molecules
            if (mol['file_path'] != target['file_path']) and
               (mol['file_path'] not in exclude)
        ]
        candidates.sort(key=lambda x: abs(x['atom_count'] - target_atom_count))
        similar_candidates = candidates[:2]
    
    # Select the most similar molecules
    similar_candidates.sort(key=lambda x: abs(x['atom_count'] - target_atom_count))
    return similar_candidates[:2]

def prepare_game_dataset(molecules, min_atoms=5):
    """
    Prepare the dataset for the game, including similar molecules for each target.
    Returns a list of game levels, each with a target and similar molecules.
    
    Args:
        molecules: List of all molecule dictionaries
        min_atoms: Minimum number of atoms required in any selected molecule
    """
    game_levels = []
    used_molecules_paths = set()  # Store only file paths
    
    # Filter molecules by minimum atom count
    molecules = [m for m in molecules if m['atom_count'] >= min_atoms]
    
    # Sort molecules by atom count for progressive difficulty
    sorted_molecules = sorted(molecules, key=lambda x: x['atom_count'])
    
    for target_mol in sorted_molecules:
        # Skip if this molecule is already used in another level
        if target_mol['file_path'] in used_molecules_paths:
            continue
        
        # Find similar molecules that haven't been used yet
        similar_mols = find_similar_molecules(
            target_mol,
            molecules,
            SIMILARITY_THRESHOLD,
            exclude=list(used_molecules_paths)  # Pass list of file paths
        )
        
        # If we couldn't find enough similar molecules, skip this target
        if len(similar_mols) < 2:
            continue
        
        # Add all these molecules to the used set
        used_molecules_paths.add(target_mol['file_path'])
        for mol in similar_mols:
            used_molecules_paths.add(mol['file_path'])
        
        # Create a game level
        level = {
            'target': {
                'name': target_mol['name'],
                'file': target_mol['file_name'],
                'atom_count': target_mol['atom_count']
            },
            'similar': [
                {
                    'name': mol['name'],
                    'file': mol['file_name'],
                    'atom_count': mol['atom_count']
                } for mol in similar_mols
            ]
        }
        
        game_levels.append(level)
        
        # If we have enough levels, stop
        if len(game_levels) >= NUM_MOLECULES:
            break
    
    return game_levels

def copy_selected_molecules(selected_molecules, target_path):
    """
    Copy selected molecule files to the target directory.
    """
    if not os.path.exists(target_path):
        os.makedirs(target_path)
    
    for mol in selected_molecules:
        source_path = mol['file_path']
        target_file = os.path.join(target_path, os.path.basename(source_path))
        shutil.copy(source_path, target_file)
        print(f"Copied: {os.path.basename(source_path)}")
    
    print(f"\nCopied {len(selected_molecules)} molecule files to '{target_path}'")

def main():
    """Main function to prepare the molecule dataset."""
    print("Starting molecule dataset preparation...")
    
    # Get min_atoms parameter from command line if provided
    min_atoms = 5  # Default minimum 5 atoms
    if len(sys.argv) > 1:
        try:
            min_atoms = int(sys.argv[1])
            print(f"Using minimum atom count: {min_atoms}")
        except ValueError:
            print(f"Invalid min_atoms value: '{sys.argv[1]}'. Using default: 5 atoms.")
    else:
        print(f"No min_atoms specified. Using default: {min_atoms} atoms.")
    
    # Collect molecule data from preliminary database
    print(f"\nCollecting molecule data from '{PRELIMINARY_DB_PATH}' with min {min_atoms} atoms...")
    all_molecules = collect_molecule_data(PRELIMINARY_DB_PATH, min_atoms=min_atoms)
    
    if not all_molecules:
        print("Error: No valid molecules found in the preliminary database.")
        return False
    
    print(f"Found {len(all_molecules)} valid molecules.")
    
    # Select representative molecules
    print(f"\nSelecting {NUM_MOLECULES} representative molecules with at least {min_atoms} atoms...")
    selected_molecules = select_representative_molecules(all_molecules, NUM_MOLECULES, min_atoms=min_atoms)
    print(f"Selected {len(selected_molecules)} representative molecules.")
    
    # Prepare game dataset with similar molecules
    print("\nPreparing game dataset with similar molecules...")
    game_levels = prepare_game_dataset(all_molecules, min_atoms=min_atoms)
    print(f"Created {len(game_levels)} game levels.")
    
    # Collect all molecules that need to be copied
    molecules_to_copy_paths = set()  # Set of file paths to copy
    for level in game_levels:
        target_file = level['target']['file']
        for mol in all_molecules:
            if os.path.basename(mol['file_path']) == target_file:
                molecules_to_copy_paths.add(mol['file_path'])
                break
        
        for similar in level['similar']:
            similar_file = similar['file']
            for mol in all_molecules:
                if os.path.basename(mol['file_path']) == similar_file:
                    molecules_to_copy_paths.add(mol['file_path'])
                    break
    
    # Convert back to list of molecule objects for copying
    molecules_to_copy = [mol for mol in all_molecules if mol['file_path'] in molecules_to_copy_paths]
    
    # Write dataset to JSON file
    try:
        json_dir = os.path.dirname(JSON_OUTPUT_PATH)
        if not os.path.exists(json_dir):
            os.makedirs(json_dir)
            
        with open(JSON_OUTPUT_PATH, 'w') as f:
            json.dump({
                'levels': game_levels,
                'total': len(game_levels)
            }, f, indent=2)
        print(f"\nSaved game dataset to '{JSON_OUTPUT_PATH}'")
    except Exception as e:
        print(f"Error saving JSON file: {str(e)}")
        return False
    
    # Copy molecules to target directory
    print(f"\nCopying selected molecules to '{TARGET_DB_PATH}'...")
    try:
        copy_selected_molecules(molecules_to_copy, TARGET_DB_PATH)
    except Exception as e:
        print(f"Error copying molecule files: {str(e)}")
        return False
    
    print("\nMolecule dataset preparation completed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
