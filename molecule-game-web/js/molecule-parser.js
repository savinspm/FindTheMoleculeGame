/**
 * MoleculeParser - Clase para cargar y analizar archivos de moléculas
 */
class MoleculeParser {
    /**
     * Constructor
     */
    constructor() {
        this.moleculeCache = {};
    }
    
    /**
     * Carga todos los archivos de moléculas disponibles
     * @returns {Promise<string[]>} - Promesa que resuelve con la lista de rutas de archivos
     */
    async loadAllMolecules() {
        try {
            // Intentar cargar el archivo de índice que contiene la lista de moléculas disponibles
            const response = await fetch('data/molecules.json');
            
            if (response.ok) {
                // Si existe el archivo de índice, usarlo
                const data = await response.json();
                
                // Verificar si estamos usando la estructura nueva o la antigua
                if (data.levels && Array.isArray(data.levels)) {
                    // Estructura nueva: extraer todas las moléculas objetivo
                    console.log("Usando formato nuevo de datos con niveles");
                    
                    // Ordenar niveles por tamaño de molécula (de menor a mayor)
                    const sortedLevels = [...data.levels].sort((a, b) => 
                        a.target.atom_count - b.target.atom_count
                    );
                    
                    // Extraer solo las rutas de los archivos objetivo
                    const targetMolecules = sortedLevels.map(level => 
                        `data/DB/${level.target.file}`
                    );
                    
                    console.log(`Cargadas ${targetMolecules.length} moléculas objetivo`);
                    return targetMolecules;
                } else if (data.molecules && Array.isArray(data.molecules)) {
                    // Estructura antigua: lista simple de moléculas
                    console.log("Usando formato antiguo de datos");
                    return data.molecules || [];
                } else {
                    console.warn('Formato de molecules.json no reconocido');
                    return this.generateMoleculesList();
                }
            } else {
                // Si no existe, intentar escanear la carpeta DB (esto funcionará solo en entornos de desarrollo específicos)
                console.warn('No se encontró el archivo molecules.json. Intentando escanear la carpeta DB...');
                return await this.scanMoleculesFolder();
            }
        } catch (error) {
            console.error('Error al cargar las moléculas:', error);
            
            // Cargar una lista de moléculas de muestra como respaldo
            return this.generateMoleculesList();
        }
    }
    
    /**
     * Intenta escanear la carpeta de moléculas para encontrar archivos .mol2
     * Esto solo funcionará en ciertos entornos de desarrollo o con un servidor backend
     * @returns {Promise<string[]>} - Lista de rutas de archivos
     */
    async scanMoleculesFolder() {
        try {
            // Esta implementación asume que hay un endpoint en el servidor que devuelve la lista de archivos
            // En un escenario real, necesitarías implementar este endpoint
            const response = await fetch('api/scan-molecules');
            if (response.ok) {
                const data = await response.json();
                return data.files || [];
            }
        } catch (error) {
            console.error('Error al escanear la carpeta de moléculas:', error);
        }
        
        // Si no funciona, usar la lista de moléculas de respaldo
        return this.generateMoleculesList();
    }
    
    /**
     * Genera una lista de moléculas de respaldo en caso de error
     * @returns {string[]} - Lista de rutas de archivos de moléculas de ejemplo
     */
    generateMoleculesList() {
        // Devolvemos una lista corta de archivos de ejemplo que sabemos que existen
        const molecules = [
            "data/DB/DB00014.mol2", 
            "data/DB/DB00035.mol2", 
            "DB/DB00050.mol2",
            "data/DB/DB00091.mol2",
            "DB/DB00093.mol2"
        ];
        console.log(`Usando ${molecules.length} moléculas de respaldo`);
        return molecules;
    }
    
    /**
     * Verifica si un archivo mol2 existe
     * @param {string} filePath - Ruta al archivo
     * @returns {Promise<boolean>} - Promesa que resuelve con true si el archivo existe
     */
    async checkFileExists(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn(`Error al verificar si existe el archivo ${filePath}:`, error);
            return false;
        }
    }
    
    /**
     * Carga un archivo mol2 y extrae su información
     * @param {string} filePath - Ruta al archivo mol2
     * @returns {Promise<Object>} - Promesa que resuelve con la información de la molécula
     */
    async loadMoleculeInfo(filePath) {
        // Si ya está en caché, devolverlo
        if (this.moleculeCache[filePath]) {
            return this.moleculeCache[filePath];
        }
        
        try {
            // Cargar el contenido del archivo
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Error al cargar ${filePath}: ${response.status}`);
            }
            
            const content = await response.text();
            
            // Analizar el contenido para obtener información básica
            const lines = content.split('\n');
            
            // Obtener el nombre de la molécula (primera línea después de @<TRIPOS>MOLECULE)
            let moleculeName = '';
            let inMoleculeSection = false;
            
            for (const line of lines) {
                if (line.trim() === '@<TRIPOS>MOLECULE') {
                    inMoleculeSection = true;
                    continue;
                }
                
                if (inMoleculeSection) {
                    moleculeName = line.trim();
                    break;
                }
            }
            
            // Si no se encontró un nombre, usar el nombre del archivo
            if (!moleculeName) {
                const parts = filePath.split('/');
                moleculeName = parts[parts.length - 1].replace('.mol2', '');
            }
            
            // Contar átomos y enlaces
            let atomCount = 0;
            let bondCount = 0;
            
            // Buscar la línea que contiene el recuento de átomos y enlaces
            for (let i = 0; i < lines.length; i++) {
                if (inMoleculeSection && i > 0 && lines[i-1].trim() === moleculeName) {
                    const counts = lines[i].trim().split(/\s+/);
                    if (counts.length >= 2) {
                        atomCount = parseInt(counts[0], 10) || 0;
                        bondCount = parseInt(counts[1], 10) || 0;
                    }
                    break;
                }
            }
            
            // Crear objeto de información
            const info = {
                name: moleculeName,
                filePath: filePath,
                atomCount: atomCount,
                bondCount: bondCount,
                content: content
            };
            
            // Guardar en caché
            this.moleculeCache[filePath] = info;
            
            return info;
        } catch (error) {
            console.error(`Error al analizar la molécula ${filePath}:`, error);
            
            // Devolver información básica como respaldo
            const parts = filePath.split('/');
            const fileName = parts[parts.length - 1];
            const nameWithoutExt = fileName.replace('.mol2', '');
            
            return {
                name: nameWithoutExt,
                filePath: filePath,
                atomCount: 0,
                bondCount: 0,
                content: '',
                isFallback: true
            };
        }
    }
}

// Exportar la clase para su uso en otros archivos
window.MoleculeParser = MoleculeParser;