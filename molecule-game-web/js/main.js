/**
 * Script principal que inicializa el juego
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Inicializando juego "Encuentra la Molécula"...');
        
        // Inicializar 3Dmol.js si está disponible
        if (typeof $3Dmol !== 'undefined') {
            console.log('Inicializando visualizadores 3Dmol.js...');
            try {
                // Configurar para usar estilo stick en todas las visualizaciones
                $3Dmol.defaultConfig = {
                    backgroundColor: 'white',
                    style: 'stick'
                };
                
                // Inicializar los visualizadores 3Dmol.js automáticamente
                $3Dmol.autoload();
                
                // Función para ajustar tamaños
                const adjustMoleculeSizes = () => {
                    const options = document.querySelectorAll('.molecule-option');
                    options.forEach(option => {
                        if (window.innerWidth <= 576) {
                            option.style.width = '70%';
                            option.style.maxWidth = '70%';
                        } else {
                            option.style.width = '75%';
                            option.style.maxWidth = '75%';
                        }
                    });
                };
                
                // Ajustar tamaños al inicializar
                setTimeout(adjustMoleculeSizes, 500);
                
                // Ajustar tamaños cuando cambie el tamaño de la ventana
                window.addEventListener('resize', adjustMoleculeSizes);
            } catch (e) {
                console.warn('Error inicializando 3Dmol.js:', e);
            }
        }
        
        // Crear instancia del juego
        const game = new MoleculeGame();
        
        // Inicializar juego (cargar moléculas)
        const initialized = await game.initialize();
        
        if (!initialized) {
            console.error('Error: El juego no pudo inicializarse correctamente.');
        } else {
            console.log('Juego inicializado con éxito. ¡Listo para jugar!');
        }
    } catch (error) {
        console.error('Error durante la inicialización del juego:', error);
        
        // Mostrar mensaje de error al usuario
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(220, 20, 60, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: sans-serif;
            text-align: center;
            z-index: 1000;
            max-width: 80%;
        `;
        errorMessage.innerHTML = `
            <h2>Error al cargar el juego</h2>
            <p>${error.message || 'Ocurrió un error desconocido.'}</p>
            <p>Por favor, recarga la página o inténtalo más tarde.</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 8px 16px;
                background: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">Recargar</button>
        `;
        document.body.appendChild(errorMessage);
    }
});