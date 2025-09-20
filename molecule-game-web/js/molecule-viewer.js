/**
 * Clase PseudoRandom - Genera números pseudoaleatorios con una semilla
 * para asegurar consistencia entre ejecuciones con la misma semilla
 */
class PseudoRandom {
    /**
     * Constructor
     * @param {number} seed - Semilla para el generador
     */
    constructor(seed) {
        this.seed = seed || 1;
    }
    
    /**
     * Genera un número pseudoaleatorio entre 0 y 1
     * @returns {number} - Número pseudoaleatorio
     */
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}

/**
 * MoleculeViewer - Clase para manejar la visualización de moléculas 3D
 * Utiliza la biblioteca 3Dmol.js para renderizar moléculas
 */
class MoleculeViewer {
    /**
     * Constructor
     */
    constructor() {
        // Caché para las moléculas ya cargadas
        this.moleculesCache = {};
        
        // Colores para los átomos
        this.atomColors = {
            'H': 0xF0F0F0, // Hidrógeno - casi blanco
            'C': 0x808080, // Carbono - gris
            'N': 0x0000FF, // Nitrógeno - azul
            'O': 0xFF0000, // Oxígeno - rojo
            'S': 0xFFFF00, // Azufre - amarillo
            'P': 0xFF8000, // Fósforo - naranja
            'F': 0x00FF00, // Flúor - verde
            'Cl': 0x00C800, // Cloro - verde oscuro
            'Br': 0xA52A2A, // Bromo - marrón
            'I': 0x800080  // Yodo - púrpura
        };
        
        // Verificar si 3Dmol.js está disponible
        this.is3DMolAvailable = typeof $3Dmol !== 'undefined';
        if (!this.is3DMolAvailable) {
            console.warn('3Dmol.js no está disponible. Se utilizará visualización simplificada.');
        }
    }
    
    /**
     * Extrae el nombre base del archivo de molécula
     * @param {string} moleculePath - Ruta al archivo de la molécula
     * @returns {string} - Nombre de la molécula sin la extensión
     */
    getMoleculeName(moleculePath) {
        // Obtener solo el nombre base del archivo sin la extensión
        const parts = moleculePath.split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace('.mol2', '');
    }
    
    /**
     * Crea un visor de moléculas en el contenedor especificado
     * @param {string} containerId - ID del contenedor para el visor
     * @param {string} moleculePath - Ruta al archivo de la molécula a cargar
     * @param {boolean} isOption - Indica si es una opción seleccionable
     * @returns {Promise<Object>} - Promesa que resuelve con el visor configurado
     */
    async createViewer(containerId, moleculePath, isOption = false) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Contenedor ${containerId} no encontrado`);
                return null;
            }
            
            // Limpiar el contenedor
            container.innerHTML = '';
            
            // Obtener el nombre de la molécula (solo para uso interno, ya no lo mostraremos)
            const moleculeName = this.getMoleculeName(moleculePath);
            
            // Crear elemento para la visualización 3D
            const viewerElement = document.createElement('div');
            viewerElement.style.width = '100%';
            viewerElement.style.height = '100%';
            viewerElement.style.position = 'relative';
            container.appendChild(viewerElement);
            
            // Crear elemento de sugerencia para rotar dentro del visor
            const rotateHint = document.createElement('div');
            rotateHint.className = 'molecule-rotate-hint';
            rotateHint.textContent = 'Haz clic para rotar';
            viewerElement.appendChild(rotateHint);
            
            // Si 3Dmol.js no está disponible, mostrar una visualización simplificada
            if (!this.is3DMolAvailable) {
                return this.createSimplifiedView(viewerElement, moleculeName);
            }
            
            try {
                // Cargar la molécula si aún no está en caché
                let moleculeData = this.moleculesCache[moleculePath];
                if (!moleculeData) {
                    moleculeData = await this.loadMoleculeFile(moleculePath);
                    this.moleculesCache[moleculePath] = moleculeData;
                }
                
                // Crear el visor 3D con configuración optimizada para evitar superposiciones
                const config = { 
                    backgroundColor: 'white',
                    antialias: true,
                    outline: true, // Agregar contorno para mejor visualización
                    disableFog: true, // Desactivar niebla para mayor claridad
                    maxDistance: -1, // Evita limitaciones de distancia
                    cartoonQuality: 2, // Mejora la calidad de representación
                    nearSurface: 0.5, // Mejora la visualización de superficies cercanas
                    farSurface: 0.8 // Mejora la visualización de superficies lejanas
                };
                const viewer = $3Dmol.createViewer(viewerElement, config);
                
                // Añadir la molécula al visor
                const model = viewer.addModel(moleculeData, "mol2");
                
                // Hacer átomos clickables para mejorar interacción y mostrar info
                model.setClickable({}, true, function(atom){ 
                    console.log("Átomo:", atom.elem, atom.serial);
                });
                
                // Verificar si la molécula tiene enlaces múltiples (dobles o triples)
                this.detectAndEnhanceMultipleBonds(model);
                
                // Aplicar un factor de separación a los átomos para evitar superposiciones
                model.setClickable({}, true, function(atom){ 
                    console.log("Átomo:", atom.elem, atom.serial);
                });
                
                // Determinar si es una molécula compleja (más de 30 átomos)
                const atomCount = model.selectedAtoms({}).length;
                if (atomCount > 30) {
                    // Para moléculas complejas aplicar ajustes adicionales manteniendo buena visualización
                    viewer.setStyle({}, { 
                        stick: { 
                            radius: 0.12,     // Sticks algo más delgados pero visibles
                            opacity: 0.85,    // Un poco más transparente para evitar saturación visual
                            smoothness: 5     // Menos suavizado para mejor rendimiento
                        }
                    });
                    viewer.setStyle({elem: 'H'}, { 
                        sphere: { 
                            radius: 0.15,     // Hidrógenos más pequeños
                            opacity: 0.85     // Transparencia para mejorar visibilidad
                        } 
                    });
                    console.log(`Molécula compleja detectada (${atomCount} átomos). Aplicando ajustes adicionales.`);
                }
                
                // Aplicar rotación verdaderamente aleatoria usando un eje y ángulo aleatorios
                // Esto garantiza que cada molécula tenga una pose única
                
                // Generar rotación basada en el containerId para diferenciar las moléculas target de las opciones
                const isTarget = !containerId.includes('option');
                
                // Si es la molécula target, usamos una rotación estándar para mejor visualización
                if (isTarget) {
                    console.log("Molécula target: rotación estándar para mejor visualización");
                    
                    // Rotación básica para una buena vista general
                    viewer.rotate(45, 'x');
                    viewer.rotate(45, 'y');
                    viewer.rotate(15, 'z');
                } 
                // Si es una opción, usamos una rotación completamente aleatoria
                else {
                    console.log("Molécula opción: rotación aleatoria");
                    
                    // Usar el ID del contenedor como semilla para una rotación pseudo-aleatoria
                    // pero determinista para cada opción, esto garantiza que cada molécula
                    // tenga siempre una rotación diferente pero consistente
                    const optionNumber = parseInt(containerId.replace('option-', ''));
                    const seedBase = this.simpleHash(moleculePath);
                    const seed = seedBase + optionNumber * 1000; // Usar número de opción como parte de la semilla
                    
                    // Crear un generador pseudo-aleatorio determinista basado en la semilla
                    const randomGen = new PseudoRandom(seed);
                    
                    // Crear un vector unitario aleatorio en 3D (eje de rotación)
                    const phi = randomGen.random() * 2 * Math.PI;
                    const costheta = randomGen.random() * 2 - 1;
                    const theta = Math.acos(costheta);
                    
                    const x = Math.sin(theta) * Math.cos(phi);
                    const y = Math.sin(theta) * Math.sin(phi);
                    const z = Math.cos(theta);
                    
                    // Ángulo de rotación aleatorio (30-330 grados para garantizar una diferencia significativa)
                    const angle = 30 + randomGen.random() * 300;
                    
                    console.log(`Molécula ${containerId}: rotación con eje (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) y ángulo ${angle.toFixed(2)}°`);
                    
                    // Aplicar rotación aleatoria al modelo utilizando un eje arbitrario
                    this.rotateAroundArbitraryAxis(viewer, model, x, y, z, angle);
                    
                    // Añadir rotaciones adicionales para variabilidad
                    const randomRotationX = Math.random() * 180;
                    const randomRotationY = Math.random() * 180;
                    const randomRotationZ = Math.random() * 180;
                    
                    viewer.rotate(randomRotationX, 'x');
                    viewer.rotate(randomRotationY, 'y');
                    viewer.rotate(randomRotationZ, 'z');
                }
                
                // Configurar estilos de visualización mejorados para mejor visualización de átomos y enlaces
                
                // Aplicar visualización stick-and-ball para todos los átomos (estilo híbrido)
                viewer.setStyle({}, { 
                    stick: { 
                        radius: 0.15, // Radio de los enlaces (sticks)
                        opacity: 0.9, // Ligera transparencia para mejor visualización
                        color: 'grey', // Color base para los enlaces
                        smoothness: 10 // Mayor suavidad para los enlaces
                    },
                    sphere: { 
                        scale: 0.3, // Escala global para las esferas
                        opacity: 0.9 // Ligera transparencia para mejor visualización
                    }
                });
                
                // Configuración específica por tipo de átomo
                viewer.setStyle({elem: 'C'}, { sphere: { color: this.atomColors['C'], radius: 0.35 } });
                viewer.setStyle({elem: 'O'}, { sphere: { color: this.atomColors['O'], radius: 0.35 } });
                viewer.setStyle({elem: 'N'}, { sphere: { color: this.atomColors['N'], radius: 0.35 } });
                viewer.setStyle({elem: 'S'}, { sphere: { color: this.atomColors['S'], radius: 0.4 } });
                viewer.setStyle({elem: 'P'}, { sphere: { color: this.atomColors['P'], radius: 0.4 } });
                viewer.setStyle({elem: 'H'}, { sphere: { color: this.atomColors['H'], radius: 0.18 } });
                
                // Ajustar la vista con un factor de zoom más alto para una mejor visualización
                viewer.zoomTo();
                viewer.zoom(1.2); // Aumentar el zoom para que las moléculas se vean más grandes
                viewer.render();
                
                // Habilitar la rotación con el ratón
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
                
                // Manejar eventos de rueda para zoom
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
                console.error(`Error al crear el visor para ${moleculePath}:`, error);
                return this.createSimplifiedView(viewerElement, moleculeName);
            }
        } catch (error) {
            console.error(`Error general al crear el visor para ${moleculePath}:`, error);
            return null;
        }
    }
    
    /**
     * Crea una vista simplificada 2D cuando 3Dmol.js no está disponible
     * @param {HTMLElement} container - Elemento contenedor
     * @param {string} moleculePath - Ruta al archivo de la molécula
     * @param {number} [seed] - Semilla para generación consistente
     * @returns {Object} - Información de la vista simplificada
     */
    createSimplifiedView(container, moleculePath, seed = null) {
        // Extraer el nombre de la molécula de la ruta
        const moleculeName = this.getMoleculeName(moleculePath);
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Crear un canvas para dibujar una representación simple
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        // Añadir el mensaje de rotación dentro del contenedor
        const rotateHint = document.createElement('div');
        rotateHint.className = 'molecule-rotate-hint';
        rotateHint.textContent = 'Haz clic para rotar';
        container.appendChild(rotateHint);
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar una representación molecular simbólica
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Dibujar algunos átomos conectados en forma de hexágono (benceno)
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        const atomRadius = radius * 0.15;
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#666';
        
        // Crear un patrón basado en el nombre de la molécula para que cada una sea distinta
        const hash = seed !== null ? seed : this.simpleHash(moleculeName);
        const numAtoms = 4 + (hash % 4); // Entre 4 y 7 átomos
        
        const atoms = [];
        for (let i = 0; i < numAtoms; i++) {
            const angle = (i / numAtoms) * 2 * Math.PI;
            atoms.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                type: ['C', 'N', 'O', 'S', 'P'][Math.abs((hash + i) % 5)]
            });
        }
        
        // Conectar los átomos con líneas
        for (let i = 0; i < atoms.length; i++) {
            const atom1 = atoms[i];
            const atom2 = atoms[(i + 1) % atoms.length];
            ctx.beginPath();
            ctx.moveTo(atom1.x, atom1.y);
            ctx.lineTo(atom2.x, atom2.y);
            ctx.stroke();
            
            // Conexiones adicionales basadas en el hash
            if ((hash + i) % 4 === 0 && atoms.length > 4) {
                const atom3 = atoms[(i + 2) % atoms.length];
                ctx.beginPath();
                ctx.moveTo(atom1.x, atom1.y);
                ctx.lineTo(atom3.x, atom3.y);
                ctx.stroke();
            }
        }
        
        // Dibujar los átomos
        for (const atom of atoms) {
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, atomRadius, 0, 2 * Math.PI);
            
            // Obtener color del átomo
            const atomColor = this.getAtomColor(atom.type);
            ctx.fillStyle = atomColor;
            ctx.fill();
            ctx.stroke();
            
            // Agregar símbolo del átomo
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(atom.type, atom.x, atom.y);
        }
        
        // Agregar texto de vista simplificada
        ctx.fillStyle = '#d00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Vista simplificada', centerX, canvas.height - 5);
        
        return {
            element: container,
            moleculeName: moleculeName,
            isSimplified: true
        };
    }
    
    /**
     * Genera un hash simple a partir de un string (mantenido para compatibilidad con createSimplifiedView)
     * @param {string} str - String a convertir en hash
     * @returns {number} - Hash numérico
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a entero de 32 bits
        }
        return Math.abs(hash);
    }
    
    /**
     * Obtiene el color para un tipo de átomo
     * @param {string} atomType - Símbolo del átomo
     * @returns {string} - Color en formato CSS
     */
    getAtomColor(atomType) {
        // Convertir el color hexadecimal a formato CSS
        const hexColor = this.atomColors[atomType] || this.atomColors['C'];
        return '#' + hexColor.toString(16).padStart(6, '0');
    }
    
    /**
     * Carga el archivo de la molécula
     * @param {string} moleculePath - Ruta al archivo de la molécula
     * @returns {Promise<string>} - Promesa que resuelve con el contenido del archivo
     */
    async loadMoleculeFile(moleculePath) {
        try {
            // Asegurarnos de que la ruta esté correcta
            let adjustedPath = moleculePath;
            if (!adjustedPath.startsWith('data/')) {
                adjustedPath = 'data/' + adjustedPath;
            }
            
            console.log(`Cargando molécula desde: ${adjustedPath}`);
            
            const response = await fetch(adjustedPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error al cargar la molécula desde ${moleculePath}:`, error);
            // Devolver una estructura molecular simple como respaldo
            return this.generateFallbackMolecule();
        }
    }
    
    /**
     * Genera una estructura molecular simple como respaldo
     * @returns {string} - Texto en formato mol2 para una molécula simple
     */
    generateFallbackMolecule() {
        // Crear una molécula simple (metano)
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
     * Detecta y mejora la visualización de enlaces múltiples (dobles, triples)
     * @param {Object} model - El modelo de la molécula
     */
    detectAndEnhanceMultipleBonds(model) {
        try {
            // Obtener todos los enlaces (bonds) del modelo
            const bonds = model.getBonds();
            if (!bonds || bonds.length === 0) return;
            
            // Verificar y mejorar la visualización de enlaces múltiples
            for (let i = 0; i < bonds.length; i++) {
                const bond = bonds[i];
                
                // Si es un enlace múltiple (orden > 1)
                if (bond.order > 1) {
                    // Obtener los átomos conectados por este enlace
                    const atom1 = model.selectedAtoms({serial: bond.atom1.serial})[0];
                    const atom2 = model.selectedAtoms({serial: bond.atom2.serial})[0];
                    
                    if (atom1 && atom2) {
                        // Para enlaces dobles, crear un estilo visual especial
                        if (bond.order === 2) {
                            console.log(`Enlace doble detectado entre ${atom1.elem}${atom1.serial} y ${atom2.elem}${atom2.serial}`);
                            
                            // Los enlaces dobles los hacemos más anchos y con un color ligeramente diferente
                            model.addBond({
                                start: {x: atom1.x, y: atom1.y, z: atom1.z},
                                end: {x: atom2.x, y: atom2.y, z: atom2.z},
                                radius: 0.18,  // Un poco más ancho
                                color: '#707070'  // Gris más oscuro
                            });
                        }
                        // Para enlaces triples, crear un estilo visual aún más distintivo
                        else if (bond.order === 3) {
                            console.log(`Enlace triple detectado entre ${atom1.elem}${atom1.serial} y ${atom2.elem}${atom2.serial}`);
                            
                            // Los enlaces triples los hacemos aún más anchos y con otro color
                            model.addBond({
                                start: {x: atom1.x, y: atom1.y, z: atom1.z},
                                end: {x: atom2.x, y: atom2.y, z: atom2.z},
                                radius: 0.22,  // Más ancho
                                color: '#606060'  // Gris más oscuro
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error al detectar enlaces múltiples:", error);
        }
    }
    
    /**
     * Rota la molécula alrededor de un eje arbitrario definido por el vector (x,y,z)
     * @param {Object} viewer - El objeto visor 3Dmol
     * @param {Object} model - El modelo de la molécula
     * @param {number} x - Componente X del vector de rotación
     * @param {number} y - Componente Y del vector de rotación
     * @param {number} z - Componente Z del vector de rotación
     * @param {number} angle - Ángulo de rotación en grados
     */
    rotateAroundArbitraryAxis(viewer, model, x, y, z, angle) {
        try {
            // Normalizar el vector para asegurar que sea un vector unitario
            const length = Math.sqrt(x*x + y*y + z*z);
            if (length === 0) return; // Evitar división por cero
            
            x /= length;
            y /= length;
            z /= length;
            
            // Calcular el centro geométrico de la molécula para rotar alrededor de él
            const atoms = model.selectedAtoms({});
            if (atoms.length === 0) return;
            
            let cx = 0, cy = 0, cz = 0;
            for (let i = 0; i < atoms.length; i++) {
                cx += atoms[i].x;
                cy += atoms[i].y;
                cz += atoms[i].z;
            }
            cx /= atoms.length;
            cy /= atoms.length;
            cz /= atoms.length;
            
            // Primero trasladamos el modelo al origen
            model.translate(-cx, -cy, -cz);
            
            // Convertir ángulo a radianes
            const angleRad = (angle * Math.PI) / 180;
            const c = Math.cos(angleRad);
            const s = Math.sin(angleRad);
            const t = 1 - c;
            
            // Matriz de rotación alrededor de un eje arbitrario
            // https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
            const r11 = t*x*x + c;
            const r12 = t*x*y - s*z;
            const r13 = t*x*z + s*y;
            
            const r21 = t*x*y + s*z;
            const r22 = t*y*y + c;
            const r23 = t*y*z - s*x;
            
            const r31 = t*x*z - s*y;
            const r32 = t*y*z + s*x;
            const r33 = t*z*z + c;
            
            // Aplicar rotación a cada átomo
            for (let i = 0; i < atoms.length; i++) {
                const atom = atoms[i];
                
                // Coordenadas actuales
                const ax = atom.x;
                const ay = atom.y;
                const az = atom.z;
                
                // Aplicar rotación
                atom.x = r11*ax + r12*ay + r13*az;
                atom.y = r21*ax + r22*ay + r23*az;
                atom.z = r31*ax + r32*ay + r33*az;
            }
            
            // Devolver el modelo a su posición original
            model.translate(cx, cy, cz);
            
            // Actualizar el modelo
            viewer.render();
            
            console.log(`Rotación aplicada alrededor del eje (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) con ángulo ${angle.toFixed(1)}°`);
            
        } catch (error) {
            console.error("Error al aplicar rotación arbitraria:", error);
        }
    }
}

// Exportar la clase para su uso en otros archivos
window.MoleculeViewer = MoleculeViewer;