# Molecule Rotation Improvements

## Overview

This document describes the improvements made to the molecule rotation system in the "Find the Molecule" game to ensure each molecule has a unique initial rotation while maintaining the existing design and functionality.

## Changes Made

### 1. Enhanced PseudoRandom Class (`molecule-viewer.js`)

- **Improved Algorithm**: Replaced the basic sine-based generator with a Linear Congruential Generator (LCG) for better distribution
- **Additional Methods**: Added `randomInt()` and `randomFloat()` methods for more precise control
- **Reset Functionality**: Added ability to reset the generator to its original seed

### 2. Advanced Rotation System (`molecule-viewer.js`)

- **Deterministic Uniqueness**: Each molecule gets a unique rotation based on:
  - Hash of the molecule file path
  - Hash of the container ID
  - Combined seed using prime number multiplication for better distribution

- **Multi-Stage Rotation**:
  1. **Basic Rotations**: Random rotations around X, Y, and Z axes (0-360°)
  2. **Arbitrary Axis Rotation**: Additional rotation around a randomly generated 3D axis (60-300°)
  3. **Rodrigues Rotation Formula**: Used for mathematically accurate arbitrary axis rotations

### 3. Improved Game Logic (`game.js`)

- **Enhanced Seed Generation**: More sophisticated seed combination using:
  - Current timestamp
  - Viewer ID hash
  - Molecule path hash
  - Index-based differentiation
  - Special offset for correct option to ensure visual distinction

- **Matrix-Based Rotations**: Added `applyArbitraryAxisRotation()` method for precise 3D transformations

## Technical Details

### Rotation Formula

The arbitrary axis rotation uses the Rodrigues rotation formula:

```
R = I + sin(θ)K + (1-cos(θ))K²
```

Where:
- `R` is the rotation matrix
- `θ` is the rotation angle
- `K` is the skew-symmetric matrix of the rotation axis
- `I` is the identity matrix

### Seed Generation

Each molecule's rotation is determined by:

```javascript
const combinedSeed = moleculeHash + containerHash * 777;
```

This ensures:
- **Consistency**: Same molecule in same container always has same rotation
- **Uniqueness**: Different molecules or containers have different rotations
- **Distribution**: Prime number multiplication spreads values evenly

## Benefits

1. **Visual Diversity**: Each molecule appears with a unique orientation
2. **Consistent Gameplay**: Same setup always produces same rotations  
3. **Maintained Functionality**: All interactive features (rotation, zoom) still work
4. **Performance**: Deterministic calculations are fast and efficient
5. **Design Preservation**: All existing styles and layouts remain unchanged

## Debugging Features

Enhanced console logging provides detailed information about:
- Applied rotation angles for each axis
- Arbitrary axis coordinates and angles
- Seeds used for each molecule
- Molecule identification information

## Browser Compatibility

The improvements work with:
- All browsers supporting 3Dmol.js
- Both desktop and mobile devices
- Touch and mouse interactions
- All existing game features

## Future Enhancements

Potential areas for further improvement:
- Animation of rotation changes
- User-selectable rotation presets
- Save/restore rotation states
- Advanced lighting effects based on orientation