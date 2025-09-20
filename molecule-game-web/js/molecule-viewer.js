/**
 * PseudoRandom Class - Generates pseudorandom numbers with a seed
 * to ensure consistency between executions with the same seed
 */
class PseudoRandom {
    /**
     * Constructor
     * @param {number} seed - Seed for the generator
     */
    constructor(seed) {
        this.seed = seed || 1;
        this.originalSeed = this.seed;
    }
    
    /**
     * Generates a pseudorandom number between 0 and 1
     * @returns {number} - Pseudorandom number
     */
    random() {
        // Improved Linear Congruential Generator (LCG) algorithm
        // Using constants that provide better distribution
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    
    /**
     * Resets the generator with the original seed
     */
    reset() {
        this.seed = this.originalSeed;
    }
    
    /**
     * Generates a random integer in a range
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (exclusive)
     * @returns {number} - Random integer
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    }
    
    /**
     * Generates a random decimal in a range
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random decimal
     */
    randomFloat(min, max) {
        return this.random() * (max - min) + min;
    }
}

/**
 * MoleculeViewer - Class for handling 3D molecule visualization
 * Uses the 3Dmol.js library to render molecules
 */
class MoleculeViewer {
    /**
     * Constructor
     */
    constructor() {
        // Cache for already loaded molecules
        this.moleculesCache = {};
        
        // Colors for atoms
        this.atomColors = {
            'H': 0xF0F0F0, // Hydrogen - almost white
            'C': 0x808080, // Carbon - gray
            'N': 0x0000FF, // Nitrogen - blue
            'O': 0xFF0000, // Oxygen - red
            'S': 0xFFFF00, // Sulfur - yellow
            'P': 0xFF8000, // Phosphorus - orange
            'F': 0x00FF00, // Fluorine - green
            'Cl': 0x00C800, // Chlorine - dark green
            'Br': 0xA52A2A, // Bromine - brown
            'I': 0x800080  // Iodine - purple
        };
        
        // Check if 3Dmol.js is available
        this.is3DMolAvailable = typeof $3Dmol !== 'undefined';
        if (!this.is3DMolAvailable) {
            const lang = window.language;
            const message = lang ? lang.getText('console.fallbackMolecule') : '3Dmol.js not available. Using simplified visualization.';
            console.warn(message);
        }
    }
    
    /**
     * Extracts the base name of the molecule file
     * @param {string} moleculePath - Path to the molecule file
     * @returns {string} - Molecule name without the extension
     */
    getMoleculeName(moleculePath) {
        // Get only the base filename without the extension
        const parts = moleculePath.split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace('.mol2', '');
    }
    
    /**
     * Creates a molecule viewer in the specified container
     * @param {string} containerId - ID of the container for the viewer
     * @param {string} moleculePath - Path to the molecule file to load
     * @param {boolean} isOption - Indicates if it's a selectable option
     * @returns {Promise<Object>} - Promise that resolves with the configured viewer
     */
    async createViewer(containerId, moleculePath, isOption = false) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                const lang = window.language;
                const message = lang ? lang.getText('console.containerNotFound') : 'Container not found';
                console.error(`${message} ${containerId}`);
                return null;
            }
            
            // Clear the container
            container.innerHTML = '';
            
            // Get the molecule name (for internal use only, we won't display it)
            const moleculeName = this.getMoleculeName(moleculePath);
            
            // Create element for 3D visualization
            const viewerElement = document.createElement('div');
            viewerElement.style.width = '100%';
            viewerElement.style.height = '100%';
            viewerElement.style.position = 'relative';
            viewerElement.className = 'viewer_3Dmoljs';
            
            // Set the rotate hint as a data attribute for CSS
            const lang = window.language;
            const rotateHint = lang ? lang.getText('rotateHint') : '↻ Click and drag to rotate';
            viewerElement.setAttribute('data-rotate-hint', rotateHint);
            
            container.appendChild(viewerElement);
            
            // If 3Dmol.js is not available, show a simplified visualization
            if (!this.is3DMolAvailable) {
                return this.createSimplifiedView(viewerElement, moleculeName);
            }
            
            try {
                // Load the molecule if not already in cache
                let moleculeData = this.moleculesCache[moleculePath];
                if (!moleculeData) {
                    moleculeData = await this.loadMoleculeFile(moleculePath);
                    this.moleculesCache[moleculePath] = moleculeData;
                }
                
                // Create the 3D viewer with optimized configuration to avoid overlaps
                const config = { 
                    backgroundColor: 'white',
                    antialias: true,
                    outline: true, // Add outline for better visualization
                    disableFog: true, // Disable fog for greater clarity
                    maxDistance: -1, // Avoid distance limitations
                    cartoonQuality: 2, // Improve rendering quality
                    nearSurface: 0.5, // Improve near surface visualization
                    farSurface: 0.8 // Improve far surface visualization
                };
                const viewer = $3Dmol.createViewer(viewerElement, config);
                
                // Add the molecule to the viewer
                const model = viewer.addModel(moleculeData, "mol2");
                
                // Make atoms clickable for better interaction and info display
                model.setClickable({}, true, function(atom){ 
                    const lang = window.language;
                    const message = lang ? lang.getText('console.atomDetected') : 'Atom:';
                    console.log(message, atom.elem, atom.serial);
                });
                
                // Check if the molecule has multiple bonds (double or triple)
                this.detectAndEnhanceMultipleBonds(model);
                
                // Apply separation factor to atoms to avoid overlaps
                model.setClickable({}, true, function(atom){ 
                    const lang = window.language;
                    const message = lang ? lang.getText('console.atomDetected') : 'Atom:';
                    console.log(message, atom.elem, atom.serial);
                });
                
                // Determine if it's a complex molecule (more than 30 atoms)
                const atomCount = model.selectedAtoms({}).length;
                if (atomCount > 30) {
                    // For complex molecules apply additional adjustments while maintaining good visualization
                    viewer.setStyle({}, { 
                        stick: { 
                            radius: 0.12,     // Slightly thinner but visible sticks
                            opacity: 0.85,    // Slightly more transparent to avoid visual saturation
                            smoothness: 5     // Less smoothing for better performance
                        }
                    });
                    viewer.setStyle({elem: 'H'}, { 
                        sphere: { 
                            radius: 0.15,     // Smaller hydrogens
                            opacity: 0.85     // Transparency to improve visibility
                        } 
                    });
                    const lang = window.language;
                    const complexMessage = lang ? lang.getText('console.complexMolecule') : 'Complex molecule detected';
                    const atomsMessage = lang ? lang.getText('console.atomsApplyingAdjustments') : 'atoms. Applying additional adjustments.';
                    console.log(`${complexMessage} (${atomCount} ${atomsMessage}`);
                }
                
                // RANDOM ROTATION SYSTEM
                // ===============================
                // Applies random rotations to each molecule so they all have different orientations
                // Each molecule will have the same initial rotation (deterministic) but will be different from the others
                
                // Create a unique seed based on the molecule path and container
                const moleculeHash = this.simpleHash(moleculePath);
                const containerHash = this.simpleHash(containerId);
                const combinedSeed = moleculeHash + containerHash * 777; // Prime factor for better distribution
                
                // Create deterministic pseudo-random generator
                const randomGen = new PseudoRandom(combinedSeed);
                
                // Generate random rotations for each axis (0-360 degrees)
                const rotationX = randomGen.randomFloat(0, 360);
                const rotationY = randomGen.randomFloat(0, 360); 
                const rotationZ = randomGen.randomFloat(0, 360);
                
                // Apply rotations before rendering (similar to the provided example)
                viewer.rotate(rotationX, 'x');
                viewer.rotate(rotationY, 'y'); 
                viewer.rotate(rotationZ, 'z');
                
                const lang = window.language;
                const rotationMessage = lang ? lang.getText('console.rotationApplied') : 'Rotation applied to';
                console.log(`${rotationMessage} ${containerId}: X=${rotationX.toFixed(1)}°, Y=${rotationY.toFixed(1)}°, Z=${rotationZ.toFixed(1)}°`);
                
                // Configure improved visualization styles for better atom and bond visualization
                
                // Apply stick-and-ball visualization for all atoms (hybrid style)
                viewer.setStyle({}, { 
                    stick: { 
                        radius: 0.15, // Bond radius (sticks)
                        opacity: 0.9, // Slight transparency for better visualization
                        color: 'grey', // Base color for bonds
                        smoothness: 10 // Greater smoothness for bonds
                    },
                    sphere: { 
                        scale: 0.3, // Global scale for spheres
                        opacity: 0.9 // Slight transparency for better visualization
                    }
                });
                
                // Specific configuration by atom type
                viewer.setStyle({elem: 'C'}, { sphere: { color: this.atomColors['C'], radius: 0.35 } });
                viewer.setStyle({elem: 'O'}, { sphere: { color: this.atomColors['O'], radius: 0.35 } });
                viewer.setStyle({elem: 'N'}, { sphere: { color: this.atomColors['N'], radius: 0.35 } });
                viewer.setStyle({elem: 'S'}, { sphere: { color: this.atomColors['S'], radius: 0.4 } });
                viewer.setStyle({elem: 'P'}, { sphere: { color: this.atomColors['P'], radius: 0.4 } });
                viewer.setStyle({elem: 'H'}, { sphere: { color: this.atomColors['H'], radius: 0.18 } });
                
                // Adjust the view with a higher zoom factor for better visualization
                viewer.zoomTo();
                viewer.zoom(1.2); // Increase zoom so molecules appear larger
                viewer.render();
                
                // Enable mouse rotation
                let isDragging = false;
                let previousX, previousY;
                
                viewerElement.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    previousX = e.clientX;
                    previousY = e.clientY;
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        const deltaX = e.clientX - previousX;
                        const deltaY = e.clientY - previousY;
                        
                        viewer.rotate(deltaX / 5, 'y');
                        viewer.rotate(deltaY / 5, 'x');
                        viewer.render();
                        
                        previousX = e.clientX;
                        previousY = e.clientY;
                    }
                });
                
                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });
                
                // Handle wheel events for zoom
                viewerElement.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -1 : 1;
                    viewer.zoom(delta);
                    viewer.render();
                });
                
                return {
                    viewer: viewer,
                    model: model,
                    element: viewerElement,
                    moleculeName: moleculeName
                };
                
            } catch (error) {
                const lang = window.language;
                const errorMessage = lang ? lang.getText('console.errorCreatingViewer') : 'Error creating viewer for';
                console.error(`${errorMessage} ${moleculePath}:`, error);
                return this.createSimplifiedView(viewerElement, moleculeName);
            }
        } catch (error) {
            const lang = window.language;
            const errorMessage = lang ? lang.getText('console.errorCreatingViewer') : 'General error creating viewer for';
            console.error(`${errorMessage} ${moleculePath}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a simplified 2D view when 3Dmol.js is not available
     * @param {HTMLElement} container - Container element
     * @param {string} moleculePath - Path to the molecule file
     * @param {number} [seed] - Seed for consistent generation
     * @returns {Object} - Simplified view information
     */
    createSimplifiedView(container, moleculePath, seed = null) {
        // Extract the molecule name from the path
        const moleculeName = this.getMoleculeName(moleculePath);
        
        // Clear the container
        container.innerHTML = '';
        
        // Create a canvas to draw a simple representation
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        // Add rotation message inside the container
        const rotateHint = document.createElement('div');
        rotateHint.className = 'molecule-rotate-hint';
        const language = window.language;
        rotateHint.textContent = language ? language.getText('console.rotateHint') : 'Click to rotate';
        container.appendChild(rotateHint);
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a symbolic molecular representation
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw some connected atoms in hexagon form (benzene)
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        const atomRadius = radius * 0.15;
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#666';
        
        // Create a pattern based on the molecule name so each one is distinct
        const hash = seed !== null ? seed : this.simpleHash(moleculeName);
        const numAtoms = 4 + (hash % 4); // Between 4 and 7 atoms
        
        const atoms = [];
        for (let i = 0; i < numAtoms; i++) {
            const angle = (i / numAtoms) * 2 * Math.PI;
            atoms.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                type: ['C', 'N', 'O', 'S', 'P'][Math.abs((hash + i) % 5)]
            });
        }
        
        // Connect atoms with lines
        for (let i = 0; i < atoms.length; i++) {
            const atom1 = atoms[i];
            const atom2 = atoms[(i + 1) % atoms.length];
            ctx.beginPath();
            ctx.moveTo(atom1.x, atom1.y);
            ctx.lineTo(atom2.x, atom2.y);
            ctx.stroke();
            
            // Additional connections based on hash
            if ((hash + i) % 4 === 0 && atoms.length > 4) {
                const atom3 = atoms[(i + 2) % atoms.length];
                ctx.beginPath();
                ctx.moveTo(atom1.x, atom1.y);
                ctx.lineTo(atom3.x, atom3.y);
                ctx.stroke();
            }
        }
        
        // Draw the atoms
        for (const atom of atoms) {
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, atomRadius, 0, 2 * Math.PI);
            
            // Get atom color
            const atomColor = this.getAtomColor(atom.type);
            ctx.fillStyle = atomColor;
            ctx.fill();
            ctx.stroke();
            
            // Add atom symbol
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(atom.type, atom.x, atom.y);
        }
        
        // Add simplified view text
        ctx.fillStyle = '#d00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const language2 = window.language;
        const simplifiedText = language2 ? language2.getText('console.simplifiedView') : 'Simplified view';
        ctx.fillText(simplifiedText, centerX, canvas.height - 5);
        
        return {
            element: container,
            moleculeName: moleculeName,
            isSimplified: true
        };
    }
    
    /**
     * Generates a simple hash from a string (maintained for compatibility with createSimplifiedView)
     * @param {string} str - String to convert to hash
     * @returns {number} - Numeric hash
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    /**
     * Gets the color for an atom type
     * @param {string} atomType - Atom symbol
     * @returns {string} - Color in CSS format
     */
    getAtomColor(atomType) {
        // Convert the hexadecimal color to CSS format
        const hexColor = this.atomColors[atomType] || this.atomColors['C'];
        return '#' + hexColor.toString(16).padStart(6, '0');
    }
    
    /**
     * Loads the molecule file
     * @param {string} moleculePath - Path to the molecule file
     * @returns {Promise<string>} - Promise that resolves with the file content
     */
    async loadMoleculeFile(moleculePath) {
        try {
            // Ensure the path is correct
            let adjustedPath = moleculePath;
            if (!adjustedPath.startsWith('data/')) {
                adjustedPath = 'data/' + adjustedPath;
            }
            
            const lang = window.language;
            const loadingMsg = lang ? lang.getText('console.loadingMolecule') : 'Loading molecule from';
            console.log(`${loadingMsg}: ${adjustedPath}`);
            
            const response = await fetch(adjustedPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('error.loadMolecule') : 'Error loading molecule from';
            console.error(`${errorMsg} ${moleculePath}:`, error);
            // Return a simple molecular structure as fallback
            return this.generateFallbackMolecule();
        }
    }
    
    /**
     * Generates a simple molecular structure as fallback
     * @returns {string} - Text in mol2 format for a simple molecule
     */
    generateFallbackMolecule() {
        // Create a simple molecule (methane)
        return `@<TRIPOS>MOLECULE
FALLBACK
5 4
SMALL
USER_CHARGES

@<TRIPOS>ATOM
1 C1 0.000 0.000 0.000 C.3 1 FALLBACK 0.000
2 H1 0.000 0.000 1.089 H 1 FALLBACK 0.000
3 H2 1.026 0.000 -0.363 H 1 FALLBACK 0.000
4 H3 -0.513 -0.889 -0.363 H 1 FALLBACK 0.000
5 H4 -0.513 0.889 -0.363 H 1 FALLBACK 0.000
@<TRIPOS>BOND
1 1 2 1
2 1 3 1
3 1 4 1
4 1 5 1
`;
    }
    
    /**
     * Detects and enhances the visualization of multiple bonds (double, triple)
     * @param {Object} model - The molecule model
     */
    detectAndEnhanceMultipleBonds(model) {
        try {
            // Get all bonds from the model
            const bonds = model.getBonds();
            if (!bonds || bonds.length === 0) return;
            
            const lang = window.language;
            
            // Check and enhance the visualization of multiple bonds
            for (let i = 0; i < bonds.length; i++) {
                const bond = bonds[i];
                
                // If it's a multiple bond (order > 1)
                if (bond.order > 1) {
                    // Get the atoms connected by this bond
                    const atom1 = model.selectedAtoms({serial: bond.atom1.serial})[0];
                    const atom2 = model.selectedAtoms({serial: bond.atom2.serial})[0];
                    
                    if (atom1 && atom2) {
                        // For double bonds, create a special visual style
                        if (bond.order === 2) {
                            const doubleBondMsg = lang ? lang.getText('console.doubleBondDetected') : 'Double bond detected between';
                            console.log(`${doubleBondMsg} ${atom1.elem}${atom1.serial} y ${atom2.elem}${atom2.serial}`);
                            
                            // Make double bonds wider and with a slightly different color
                            model.addBond({
                                start: {x: atom1.x, y: atom1.y, z: atom1.z},
                                end: {x: atom2.x, y: atom2.y, z: atom2.z},
                                radius: 0.18,  // A bit wider
                                color: '#707070'  // Darker gray
                            });
                        }
                        // For triple bonds, create an even more distinctive visual style
                        else if (bond.order === 3) {
                            const tripleBondMsg = lang ? lang.getText('console.tripleBondDetected') : 'Triple bond detected between';
                            console.log(`${tripleBondMsg} ${atom1.elem}${atom1.serial} y ${atom2.elem}${atom2.serial}`);
                            
                            // Make triple bonds even wider and with another color
                            model.addBond({
                                start: {x: atom1.x, y: atom1.y, z: atom1.z},
                                end: {x: atom2.x, y: atom2.y, z: atom2.z},
                                radius: 0.22,  // Wider
                                color: '#606060'  // Darker gray
                            });
                        }
                    }
                }
            }
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('error.detectBonds') : 'Error detecting multiple bonds';
            console.error(`${errorMsg}:`, error);
        }
}
}

// Export the class for use in other files
window.MoleculeViewer = MoleculeViewer;
window.PseudoRandom = PseudoRandom;