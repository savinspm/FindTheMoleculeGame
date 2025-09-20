# FindTheMoleculeGame Dataset Preparation

## About the prepare_molecules.py Script

This script helps prepare the dataset for the FindTheMoleculeGame by selecting molecules and finding similar ones to create a challenging game experience.

### What the Script Does

1. **Selects Target Molecules**: It selects 120 molecules from the preliminaryDB folder, ranging from the smallest to the largest in atom count.

2. **Finds Similar Molecules**: For each target molecule, it finds two similar molecules based on atom count to use as incorrect options in the game.

3. **Creates Progressive Difficulty**: It arranges molecules in ascending order of complexity, so the game starts with simpler molecules and gradually introduces more complex ones.

4. **Generates JSON Dataset**: It creates a molecules.json file with information about each level, including the target molecule and its similar alternatives.

5. **Copies Required Files**: It copies only the selected .mol2 files to the data/DB folder.

### Usage Instructions

1. **Setup Your Source Directory**: 
   - Place all your .mol2 molecule files in a folder called `preliminaryDB` in the project root.

2. **Run the Script**: 
   ```bash
   python prepare_molecules.py
   ```

3. **Check the Output**:
   - The script will create/update `molecule-game-web/data/molecules.json`
   - Selected .mol2 files will be copied to `molecule-game-web/data/DB/`

### Output Format

The molecules.json file will have the following structure:

```json
{
  "levels": [
    {
      "target": {
        "name": "DB00001",
        "file": "DB00001.mol2",
        "atom_count": 15
      },
      "similar": [
        {
          "name": "DB00002",
          "file": "DB00002.mol2",
          "atom_count": 14
        },
        {
          "name": "DB00003",
          "file": "DB00003.mol2",
          "atom_count": 16
        }
      ]
    },
    // More levels...
  ],
  "total": 120
}
```

### Requirements

- Python 3.6 or higher
- A collection of .mol2 files in the preliminaryDB folder

### Customization

You can modify these variables at the beginning of the script:

- `PRELIMINARY_DB_PATH`: Path to your source directory with all .mol2 files
- `TARGET_DB_PATH`: Where to copy the selected .mol2 files
- `JSON_OUTPUT_PATH`: Where to save the JSON dataset
- `NUM_MOLECULES`: Number of target molecules to select
- `SIMILARITY_THRESHOLD`: Maximum difference in atom count (as percentage) for similar molecules

## Game Integration

The script is designed to work with the FindTheMoleculeGame web application. Once you've generated the dataset:

1. The game will automatically use the levels defined in molecules.json
2. It will present the target molecule and two similar options
3. The difficulty will increase progressively as the player scores more points