/**
 * Script principal que inicializa el juego
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Inicializando juego "Encuentra la Molécula"...');
        
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