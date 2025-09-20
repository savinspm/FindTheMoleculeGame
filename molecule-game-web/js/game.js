/**
 * MoleculeGame - Clase principal que maneja la lógica del juego
 */
class MoleculeGame {
    /**
     * Constructor
     */
    constructor() {
        // Estado del juego
        this.playerName = '';
        this.score = 0;
        this.attempts = 0;
        this.startTime = null;
        this.timeLimit = 60; // 60 segundos para todo el juego
        this.gameOver = false;
        this.currentMolecule = null;
        this.options = [];
        this.correctOption = -1;
        
        // Componentes
        this.moleculeParser = new MoleculeParser();
        this.moleculeViewer = new MoleculeViewer();
        this.ranking = new Ranking();
        
        // Referencia a todos los archivos de moléculas disponibles
        this.moleculeFiles = [];
        
        // Referencias a elementos DOM
        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen')
        };
        
        this.elements = {
            welcomeScreen: document.getElementById('welcome-screen'),
            gameScreen: document.getElementById('game-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            playerNameInput: document.getElementById('player-name'),
            playerNameDisplay: document.getElementById('player-name-display'),
            startButton: document.getElementById('start-button'),
            timeLeft: document.getElementById('time-left'),
            scoreDisplay: document.getElementById('score-display'),
            attemptsDisplay: document.getElementById('attempts-display'),
            accuracyDisplay: document.getElementById('accuracy-display'),
            feedbackMessage: document.getElementById('feedback-message'),
            targetMoleculeName: document.getElementById('target-molecule-name'),
            finalStats: document.getElementById('final-stats'),
            playAgainButton: document.getElementById('play-again-button'),
            rankingsContainer: document.getElementById('rankings-container')
        };
        
        // Inicializar listeners de eventos
        this.initEventListeners();
    }
    
    /**
     * Inicializa los listeners de eventos
     */
    initEventListeners() {
        // Validar nombre de jugador y habilitar/deshabilitar botón de inicio
        this.elements.playerNameInput.addEventListener('input', () => {
            const name = this.elements.playerNameInput.value.trim();
            this.elements.startButton.disabled = name.length === 0;
        });
        
        // Iniciar juego al hacer clic en el botón de inicio
        this.elements.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // También iniciar al presionar Enter en el campo de nombre
        this.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.elements.playerNameInput.value.trim().length > 0) {
                this.startGame();
            }
        });
        
        // Botón de jugar de nuevo
        this.elements.playAgainButton.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    /**
     * Inicializa el juego cargando los archivos de moléculas
     */
    async initialize() {
        try {
            this.moleculeFiles = await this.moleculeParser.loadAllMolecules();
            
            if (this.moleculeFiles.length === 0) {
                alert('No se encontraron archivos de moléculas. Por favor, verifica la carpeta data/DB.');
                return false;
            }
            
            console.log(`Se cargaron ${this.moleculeFiles.length} archivos de moléculas.`);
            
            // Actualizar rankings
            this.ranking.updateRankingsDisplay('rankings-container', 10);
            
            return true;
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            alert('Error al cargar las moléculas. Por favor, recarga la página.');
            return false;
        }
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        // Guardar nombre del jugador
        this.playerName = this.elements.playerNameInput.value.trim();
        
        // Asegurarse de que la pantalla de bienvenida esté completamente oculta
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.welcomeScreen.style.visibility = 'hidden';
        this.elements.welcomeScreen.style.opacity = '0';
        
        // Preparar la pantalla del juego
        this.elements.gameScreen.style.display = 'flex';
        this.elements.gameScreen.style.visibility = 'visible';
        this.elements.gameScreen.style.opacity = '1';
        
        // Actualizar información en la pantalla del juego
        this.elements.playerNameDisplay.textContent = `Jugador: ${this.playerName}`;
        this.elements.scoreDisplay.textContent = `Aciertos: ${this.score}`;
        this.elements.attemptsDisplay.textContent = `Intentos: ${this.attempts}`;
        this.elements.accuracyDisplay.textContent = `Precisión: 0%`;
        
        // Cambiar de pantalla usando la función mejorada
        this.showScreen('game');
        
        // Iniciar temporizador
        this.startTime = Date.now();
        this.startTimer();
        
        // Configurar primer nivel
        this.setupNewLevel();
    }
    
    /**
     * Configura un nuevo nivel del juego
     */
    async setupNewLevel() {
        try {
            // Limpiar mensaje de feedback
            this.elements.feedbackMessage.textContent = '';
            this.elements.feedbackMessage.className = '';
            
            // Eliminar clases de estilo de las opciones anteriores y resetear botones
            for (let i = 0; i < 3; i++) {
                const optionElement = document.getElementById(`option-${i}`);
                const selectButton = document.getElementById(`select-${i}`);
                if (optionElement) {
                    optionElement.classList.remove('correct-option', 'incorrect-option');
                }
                if (selectButton) {
                    selectButton.disabled = false;
                }
            }
            
            // Verificar si hay suficientes moléculas
            if (this.moleculeFiles.length < 3) {
                this.elements.feedbackMessage.textContent = 'No hay suficientes moléculas para continuar.';
                this.elements.feedbackMessage.className = 'error';
                return;
            }
            
            // Intentar cargar información del nivel actual desde el archivo JSON
            let similarMolecules = await this.tryLoadSimilarMolecules();
            
            if (similarMolecules) {
                // Si tenemos información del archivo JSON con niveles
                this.currentMolecule = `data/DB/${similarMolecules.target.file}`;
                
                // Extraer el nombre de la molécula objetivo
                if (this.elements.targetMoleculeName) {
                    this.elements.targetMoleculeName.textContent = similarMolecules.target.name;
                }
                
                // Crear opciones con las moléculas similares
                this.options = [
                    this.currentMolecule,
                    `data/DB/${similarMolecules.similar[0].file}`,
                    `data/DB/${similarMolecules.similar[1].file}`
                ];
                
                // Mezclar las opciones
                this.shuffleArray(this.options);
                
                // Encontrar índice de la opción correcta
                this.correctOption = this.options.indexOf(this.currentMolecule);
                
                console.log("Usando nivel con moléculas similares:");
                console.log("Molécula objetivo:", this.currentMolecule);
                console.log("Opciones incorrectas:", this.options[0] === this.currentMolecule ? this.options.slice(1) : 
                    this.options[1] === this.currentMolecule ? [this.options[0], this.options[2]] : this.options.slice(0, 2));
            } else {
                // Método original como respaldo si no tenemos el archivo JSON con niveles
                // Seleccionar molécula objetivo aleatoriamente
                const targetIndex = Math.floor(Math.random() * this.moleculeFiles.length);
                this.currentMolecule = this.moleculeFiles[targetIndex];
                
                // Extraer el nombre de la molécula del archivo
                const moleculeFile = this.currentMolecule.split('/').pop().replace('.mol2', '');
                if (this.elements.targetMoleculeName) {
                    this.elements.targetMoleculeName.textContent = moleculeFile;
                }
                
                // Crear lista de moléculas disponibles excluyendo la objetivo
                let availableOptions = [...this.moleculeFiles];
                availableOptions.splice(targetIndex, 1); // Remover la molécula objetivo
                
                // Mezclar las moléculas disponibles para asegurar diversidad
                this.shuffleArray(availableOptions);
                
                // Tomar las primeras 2 moléculas diferentes para las opciones incorrectas
                const wrong1 = availableOptions[0];
                const wrong2 = availableOptions[1];
                
                // Verificar que son diferentes entre sí
                console.log("Usando selección aleatoria de moléculas:");
                console.log("Molécula objetivo:", this.currentMolecule);
                console.log("Opción incorrecta 1:", wrong1);
                console.log("Opción incorrecta 2:", wrong2);
                
                // Crear y mezclar opciones
                this.options = [this.currentMolecule, wrong1, wrong2];
                this.shuffleArray(this.options);
                
                // Encontrar índice de la opción correcta
                this.correctOption = this.options.indexOf(this.currentMolecule);
            }
            
            console.log("Opción correcta en posición:", this.correctOption);
            
            // Crear visualizadores 3D
            await this.createMoleculeViewers();
            
            // Añadir listeners de clic a los botones de selección
            for (let i = 0; i < 3; i++) {
                const selectButton = document.getElementById(`select-${i}`);
                selectButton.onclick = () => this.checkAnswer(i);
            }
        } catch (error) {
            console.error('Error al configurar nivel:', error);
            this.elements.feedbackMessage.textContent = 'Error al cargar nivel. Intentando de nuevo...';
            this.elements.feedbackMessage.className = 'error';
            
            // Intentar de nuevo tras un breve retraso
            setTimeout(() => this.setupNewLevel(), 2000);
        }
    }
    
    /**
     * Crea los visualizadores de moléculas para el nivel actual
     */
    async createMoleculeViewers() {
        try {
            // Para el enfoque declarativo de 3Dmol.js, configuramos el atributo data-href
            // para cada contenedor de molécula y dejamos que 3Dmol.js haga el resto
            
            // Generar semillas para rotaciones aleatorias pero consistentes
            const baseSeed = Date.now();
            const getRotationParams = (index) => {
                // Usar una semilla diferente para cada molécula pero consistente en la misma sesión
                const seed = baseSeed + (index * 1000);
                const random = () => {
                    const x = Math.sin(seed + index++) * 10000;
                    return x - Math.floor(x);
                };
                
                // Generar valores aleatorios para rotación
                const axes = ['x', 'y', 'z'];
                const axis = axes[Math.floor(random() * 3)];  // Eje aleatorio
                const speed = 0;  // Sin rotación continua
                const rotationX = Math.floor(random() * 360);  // Rotación inicial en X
                const rotationY = Math.floor(random() * 360);  // Rotación inicial en Y
                const rotationZ = Math.floor(random() * 360);  // Rotación inicial en Z
                
                return { axis, speed, rotationX, rotationY, rotationZ };
            };
            
            // Crear visualizador para la molécula objetivo
            const targetElement = document.getElementById('target-molecule');
            targetElement.setAttribute('data-href', this.currentMolecule);
            targetElement.setAttribute('data-style', 'stick');
            
            // No aplicamos atributos de rotación, las rotaciones se aplicarán después mediante el API
            
            // Crear visualizadores para las opciones (sin rotación animada)
            for (let i = 0; i < this.options.length; i++) {
                const optionElement = document.getElementById(`option-${i}`);
                optionElement.setAttribute('data-href', this.options[i]);
                optionElement.setAttribute('data-style', 'stick');
                
                // Asegurarse de que el contenedor de opción y el botón estén visibles
                const buttonContainer = document.querySelector(`#select-${i}`).parentNode;
                if (buttonContainer) {
                    buttonContainer.style.display = 'flex';
                    buttonContainer.style.visibility = 'visible';
                }
            }
            
            // Inicializar o reinicializar los visualizadores 3Dmol.js
            if (typeof $3Dmol !== 'undefined' && typeof $3Dmol.viewers !== 'undefined') {
                // Limpiar los visualizadores existentes
                Object.keys($3Dmol.viewers).forEach(key => {
                    $3Dmol.viewers[key].clear();
                    delete $3Dmol.viewers[key];
                });
            }
            
            // Inicializar todos los visualizadores en la página
            // Este código asume que 3Dmol.ui-min.js está cargado
            if (typeof $3Dmol !== 'undefined') {
                $3Dmol.autoload();
                
                // Después de cargar, asegurarnos que las moléculas no oculten los botones
                // y aplicar rotaciones aleatorias iniciales
                setTimeout(() => {
                    // Ajustar tamaños
                    const options = document.querySelectorAll('.molecule-option');
                    options.forEach(option => {
                        // Asegurarse de que el ancho esté dentro de los límites
                        if (window.innerWidth <= 576) {
                            option.style.width = '70%';
                            option.style.maxWidth = '70%';
                        } else {
                            option.style.width = '75%';
                            option.style.maxWidth = '75%';
                        }
                    });
                    
                    // Aplicar rotaciones aleatorias iniciales usando el mismo sistema que MoleculeViewer
                    if (typeof $3Dmol !== 'undefined' && typeof $3Dmol.viewers !== 'undefined') {
                        
                        // Aplicar rotaciones diferentes a cada visualizador
                        Object.keys($3Dmol.viewers).forEach((viewerId, index) => {
                            const viewer = $3Dmol.viewers[viewerId];
                            if (viewer) {
                                // Crear una semilla única basada en el viewerId y la molécula
                                const viewerIdHash = this.simpleHash(viewerId);
                                const moleculePathHash = this.simpleHash(this.options[index] || this.currentMolecule || 'default');
                                const combinedSeed = viewerIdHash + moleculePathHash * 777 + index * 1234;
                                
                                // Crear generador pseudo-aleatorio determinista (igual que en MoleculeViewer)
                                const randomGen = new PseudoRandom(combinedSeed);
                                
                                // Generar rotaciones aleatorias para cada eje (0-360 grados)
                                const rotationX = randomGen.randomFloat(0, 360);
                                const rotationY = randomGen.randomFloat(0, 360); 
                                const rotationZ = randomGen.randomFloat(0, 360);
                                
                                // Aplicar las rotaciones (similar al ejemplo proporcionado)
                                viewer.rotate(rotationX, 'x');
                                viewer.rotate(rotationY, 'y'); 
                                viewer.rotate(rotationZ, 'z');
                                
                                viewer.render();
                                
                                // Asegurarse de que no hay animación de rotación continua
                                viewer.spin(false);
                                
                                console.log(`Rotación aplicada a ${viewerId}: X=${rotationX.toFixed(1)}°, Y=${rotationY.toFixed(1)}°, Z=${rotationZ.toFixed(1)}°`);
                            }
                        });
                    }
                }, 800);
            } else {
                console.error('3Dmol.js no está disponible');
                // Caer en el método anterior si 3Dmol.js no está disponible
                await this.fallbackCreateViewers();
            }
        } catch (error) {
            console.error('Error al crear visualizadores:', error);
            throw error;
        }
    }
    
    /**
     * Método de respaldo para crear visualizadores cuando 3Dmol.js no está disponible
     */
    async fallbackCreateViewers() {
        try {
            // Usar el método anterior como respaldo
            await this.moleculeViewer.createViewer('target-molecule', this.currentMolecule);
            
            for (let i = 0; i < this.options.length; i++) {
                await this.moleculeViewer.createViewer(`option-${i}`, this.options[i], true);
            }
        } catch (error) {
            console.error('Error en fallbackCreateViewers:', error);
            throw error;
        }
    }
    
    /**
     * Verifica la respuesta seleccionada
     * @param {number} selectedOption - Índice de la opción seleccionada
     */
    checkAnswer(selectedOption) {
        // Incrementar intentos
        this.attempts++;
        this.elements.attemptsDisplay.textContent = `Intentos: ${this.attempts}`;
        
        // Verificar si es correcta
        if (selectedOption === this.correctOption) {
            // Respuesta correcta
            this.score++;
            this.elements.scoreDisplay.textContent = `Aciertos: ${this.score}`;
            this.elements.feedbackMessage.textContent = '¡CORRECTO! ¡Muy bien!';
            this.elements.feedbackMessage.className = 'correct';
            
            // Resaltar la opción correcta
            document.getElementById(`option-${selectedOption}`).classList.add('correct-option');
            document.getElementById(`select-${selectedOption}`).disabled = true;
            
            // Deshabilitar los otros botones
            for (let i = 0; i < 3; i++) {
                if (i !== selectedOption) {
                    document.getElementById(`select-${i}`).disabled = true;
                }
            }
            
            // Hacer scroll al mensaje de feedback si es necesario en pantallas pequeñas
            this.elements.feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Configurar nuevo nivel automáticamente después de un breve retraso
            setTimeout(() => {
                this.setupNewLevel();
            }, 600);
        } else {
            // Respuesta incorrecta
            this.elements.feedbackMessage.textContent = '¡INCORRECTO! Inténtalo de nuevo';
            this.elements.feedbackMessage.className = 'incorrect';
            
            // Resaltar brevemente la opción incorrecta
            const optionElement = document.getElementById(`option-${selectedOption}`);
            optionElement.classList.add('incorrect-option');
            
            // Hacer scroll al mensaje de feedback si es necesario en pantallas pequeñas
            this.elements.feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Deshabilitar temporalmente el botón seleccionado
            document.getElementById(`select-${selectedOption}`).disabled = true;
            
            // Quitar clase y habilitar botón después de un momento
            setTimeout(() => {
                optionElement.classList.remove('incorrect-option');
                document.getElementById(`select-${selectedOption}`).disabled = false;
            }, 800);
        }
        
        // Actualizar precisión
        this.updateAccuracy();
    }
    
    /**
     * Actualiza el indicador de precisión
     */
    updateAccuracy() {
        const accuracy = this.attempts > 0 ? (this.score / this.attempts) * 100 : 0;
        this.elements.accuracyDisplay.textContent = `Precisión: ${accuracy.toFixed(1)}%`;
    }
    
    /**
     * Inicia el temporizador del juego
     */
    startTimer() {
        const timerInterval = setInterval(() => {
            // Si el juego ha terminado, detener el temporizador
            if (this.gameOver) {
                clearInterval(timerInterval);
                return;
            }
            
            // Calcular tiempo restante
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            const remainingTime = Math.max(0, this.timeLimit - elapsedTime);
            
            // Actualizar visualización
            this.elements.timeLeft.textContent = Math.ceil(remainingTime);
            
            // Si se acabó el tiempo, finalizar juego
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                this.endGame();
            }
        }, 200);
    }
    
    /**
     * Finaliza el juego
     */
    endGame() {
        this.gameOver = true;
        
        // Calcular tiempo total de juego
        const totalTime = (Date.now() - this.startTime) / 1000;
        
        // Calcular precisión
        const accuracy = this.attempts > 0 ? (this.score / this.attempts) * 100 : 0;
        
        // Guardar ranking
        this.ranking.addRanking(this.playerName, this.score, this.attempts, totalTime);
        
        // Asegurarse de que la pantalla del juego esté completamente oculta
        this.elements.gameScreen.style.display = 'none';
        this.elements.gameScreen.style.visibility = 'hidden';
        this.elements.gameScreen.style.opacity = '0';
        
        // Preparar la pantalla de fin de juego
        this.elements.gameOverScreen.style.display = 'flex';
        this.elements.gameOverScreen.style.visibility = 'visible';
        this.elements.gameOverScreen.style.opacity = '1';
        
        // Mostrar estadísticas finales
        this.elements.finalStats.innerHTML = `
            <p>Jugador: <strong>${this.playerName}</strong></p>
            <p>Aciertos: <strong>${this.score}</strong></p>
            <p>Intentos: <strong>${this.attempts}</strong></p>
            <p>Precisión: <strong>${accuracy.toFixed(1)}%</strong></p>
            <p>Tiempo total: <strong>${totalTime.toFixed(1)} segundos</strong></p>
        `;
        
        // Cambiar a pantalla de fin de juego
        this.showScreen('gameOver');
        
        // Actualizar rankings
        this.ranking.updateRankingsDisplay('rankings-container', 10);
    }
    
    /**
     * Reinicia el juego
     */
    resetGame() {
        this.score = 0;
        this.attempts = 0;
        this.startTime = null;
        this.gameOver = false;
        this.currentMolecule = null;
        this.options = [];
        this.correctOption = -1;
        
        // Asegurarse de que la pantalla de fin de juego esté completamente oculta
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.gameOverScreen.style.visibility = 'hidden';
        this.elements.gameOverScreen.style.opacity = '0';
        
        // Preparar la pantalla de bienvenida
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.welcomeScreen.style.visibility = 'visible';
        this.elements.welcomeScreen.style.opacity = '1';
        
        // Limpiar campos
        this.elements.playerNameInput.value = '';
        this.elements.startButton.disabled = true;
        
        // Limpiar el mensaje de feedback si existiera
        if (this.elements.feedbackMessage) {
            this.elements.feedbackMessage.textContent = '';
            this.elements.feedbackMessage.className = '';
        }
        
        // Volver a la pantalla de bienvenida
        this.showScreen('welcome');
        
        // Actualizar rankings
        this.ranking.updateRankingsDisplay('rankings-container', 10);
    }
    
    /**
     * Muestra una pantalla específica y oculta las demás
     * @param {string} screenId - Identificador de la pantalla a mostrar ('welcome', 'game' o 'gameOver')
     */
    showScreen(screenId) {
        // Primero, eliminar la clase active de todas las pantallas
        Object.keys(this.screens).forEach(key => {
            this.screens[key].classList.remove('active');
            // Asegurarse de que las pantallas no activas tengan z-index bajo
            this.screens[key].style.zIndex = "1";
        });
        
        // Luego, mostrar solo la pantalla solicitada
        if (this.screens[screenId]) {
            this.screens[screenId].classList.add('active');
            this.screens[screenId].style.zIndex = "10";
            
            // Si estamos mostrando una nueva pantalla, asegurémonos de limpiar cualquier feedback o mensaje anterior
            if (screenId !== 'game' && this.elements.feedbackMessage) {
                this.elements.feedbackMessage.textContent = '';
                this.elements.feedbackMessage.className = '';
            }
        }
    }
    
    /**
     * Intenta cargar un nivel con moléculas similares desde el archivo JSON
     * @returns {Object|null} - Información del nivel o null si no está disponible
     */
    async tryLoadSimilarMolecules() {
        try {
            // Intentar cargar el archivo de niveles
            const response = await fetch('data/molecules.json');
            
            if (response.ok) {
                const data = await response.json();
                
                // Verificar si tenemos la estructura de niveles
                if (data.levels && Array.isArray(data.levels) && data.levels.length > 0) {
                    // Progresión de dificultad - seleccionar nivel basado en la puntuación actual
                    // Los primeros niveles son más fáciles (moléculas más pequeñas)
                    const levelIndex = Math.min(this.score, data.levels.length - 1);
                    return data.levels[levelIndex];
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error al cargar niveles con moléculas similares:', error);
            return null;
        }
    }
    
    /**
     * Mezcla aleatoriamente un array
     * @param {Array} array - Array a mezclar
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Genera un hash simple a partir de un string
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
     * Aplica una rotación alrededor de un eje arbitrario a un modelo 3D
     * @param {Object} model - El modelo 3D de 3Dmol.js
     * @param {number} axisX - Componente X del eje de rotación (normalizado)
     * @param {number} axisY - Componente Y del eje de rotación (normalizado) 
     * @param {number} axisZ - Componente Z del eje de rotación (normalizado)
     * @param {number} angle - Ángulo de rotación en grados
     */
    applyArbitraryAxisRotation(model, axisX, axisY, axisZ, angle) {
        try {
            // Normalizar el vector del eje
            const length = Math.sqrt(axisX*axisX + axisY*axisY + axisZ*axisZ);
            if (length === 0) return;
            
            axisX /= length;
            axisY /= length;
            axisZ /= length;
            
            // Convertir ángulo a radianes
            const angleRad = (angle * Math.PI) / 180;
            const c = Math.cos(angleRad);
            const s = Math.sin(angleRad);
            const t = 1 - c;
            
            // Matriz de rotación de Rodrigues
            const rotMatrix = [
                [t*axisX*axisX + c,          t*axisX*axisY - s*axisZ,    t*axisX*axisZ + s*axisY],
                [t*axisX*axisY + s*axisZ,    t*axisY*axisY + c,          t*axisY*axisZ - s*axisX],
                [t*axisX*axisZ - s*axisY,    t*axisY*axisZ + s*axisX,    t*axisZ*axisZ + c]
            ];
            
            // Obtener los átomos del modelo
            const atoms = model.selectedAtoms({});
            if (atoms.length === 0) return;
            
            // Calcular el centro de masa para rotar alrededor de él
            let centerX = 0, centerY = 0, centerZ = 0;
            for (const atom of atoms) {
                centerX += atom.x;
                centerY += atom.y;
                centerZ += atom.z;
            }
            centerX /= atoms.length;
            centerY /= atoms.length;
            centerZ /= atoms.length;
            
            // Aplicar rotación a cada átomo
            for (const atom of atoms) {
                // Trasladar al origen
                const x = atom.x - centerX;
                const y = atom.y - centerY;
                const z = atom.z - centerZ;
                
                // Aplicar rotación
                const newX = rotMatrix[0][0]*x + rotMatrix[0][1]*y + rotMatrix[0][2]*z;
                const newY = rotMatrix[1][0]*x + rotMatrix[1][1]*y + rotMatrix[1][2]*z;
                const newZ = rotMatrix[2][0]*x + rotMatrix[2][1]*y + rotMatrix[2][2]*z;
                
                // Trasladar de vuelta
                atom.x = newX + centerX;
                atom.y = newY + centerY;
                atom.z = newZ + centerZ;
            }
            
            console.log(`Rotación de eje arbitrario aplicada: (${axisX.toFixed(3)}, ${axisY.toFixed(3)}, ${axisZ.toFixed(3)}) @ ${angle.toFixed(1)}°`);
        } catch (error) {
            console.error('Error aplicando rotación de eje arbitrario:', error);
        }
    }
}

// Exportar la clase para su uso en otros archivos
window.MoleculeGame = MoleculeGame;