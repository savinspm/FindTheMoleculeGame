/**
 * MoleculeGame - Main class that handles the game logic
 */
class MoleculeGame {
    /**
     * Constructor
     */
    constructor() {
        // Game state
        this.playerName = '';
        this.score = 0;
        this.attempts = 0;
        this.startTime = null;
        this.timeLimit = 60; // 60 seconds countdown display
        this.gameOver = false;
        this.currentMolecule = null;
        this.options = [];
        this.correctOption = -1;
        this.lastLoggedTime = null; // For debug logging
        
        // Components
        this.moleculeParser = new MoleculeParser();
        this.moleculeViewer = new MoleculeViewer();
        this.ranking = new Ranking();
        
        // Reference to all available molecule files
        this.moleculeFiles = [];
        
        // DOM element references
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
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    /**
     * Initializes event listeners
     */
    initEventListeners() {
        // Validate player name and enable/disable start button
        this.elements.playerNameInput.addEventListener('input', () => {
            const name = this.elements.playerNameInput.value.trim();
            this.elements.startButton.disabled = name.length === 0;
        });
        
        // Start game when clicking the start button
        this.elements.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Also start when pressing Enter in the name field
        this.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.elements.playerNameInput.value.trim().length > 0) {
                this.startGame();
            }
        });
        
        // Play again button
        this.elements.playAgainButton.addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    /**
     * Initializes the game by loading molecule files
     */
    async initialize() {
        try {
            this.moleculeFiles = await this.moleculeParser.loadAllMolecules();
            
            if (this.moleculeFiles.length === 0) {
                const lang = window.language;
                const noMoleculesMsg = lang ? lang.getText('error.noMolecules') : 'No molecule files found. Please check the data/DB folder.';
                alert(noMoleculesMsg);
                return false;
            }
            
            const lang = window.language;
            const loadedMsg = lang ? lang.getText('console.moleculesLoaded') : 'molecule files loaded.';
            console.log(`${this.moleculeFiles.length} ${loadedMsg}`);
            
            // Update rankings
            this.ranking.updateRankingsDisplay('rankings-container', 10);
            
            return true;
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('error.initializeGame') : 'Error initializing game:';
            console.error(`${errorMsg}`, error);
            const reloadMsg = lang ? lang.getText('error.reloadPage') : 'Error loading molecules. Please reload the page.';
            alert(reloadMsg);
            return false;
        }
    }
    
    /**
     * Starts the game
     */
    startGame() {
        // Save player name
        this.playerName = this.elements.playerNameInput.value.trim();
        
        // Ensure the welcome screen is completely hidden
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.welcomeScreen.style.visibility = 'hidden';
        this.elements.welcomeScreen.style.opacity = '0';
        
        // Prepare the game screen
        this.elements.gameScreen.style.display = 'flex';
        this.elements.gameScreen.style.visibility = 'visible';
        this.elements.gameScreen.style.opacity = '1';
        
        // Update information on the game screen
        const lang = window.language;
        const playerLabel = lang ? lang.getText('playerLabel') : 'Player:';
        const hitsLabel = lang ? lang.getText('scoreLabel') : 'Hits:';
        const attemptsLabel = lang ? lang.getText('attemptsLabel') : 'Attempts:';
        const accuracyLabel = lang ? lang.getText('accuracyLabel') : 'Accuracy:';
        
        this.elements.playerNameDisplay.textContent = `${playerLabel} ${this.playerName}`;
        this.elements.scoreDisplay.textContent = `${hitsLabel} ${this.score}`;
        this.elements.attemptsDisplay.textContent = `${attemptsLabel} ${this.attempts}`;
        this.elements.accuracyDisplay.textContent = `${accuracyLabel} 0%`;
        
        // Switch screen using the improved function
        this.showScreen('game');
        
        // Reset and start countdown timer
        const timeLeftElement = document.getElementById('time-left');
        if (timeLeftElement) {
            timeLeftElement.textContent = '60';
        }
        this.startTime = Date.now();
        this.startTimer();
        
        // Set up first level
        this.setupNewLevel();
    }
    
    /**
     * Sets up a new game level
     */
    async setupNewLevel() {
        try {
            // Clear feedback message
            this.elements.feedbackMessage.textContent = '';
            this.elements.feedbackMessage.className = '';
            
            // Remove style classes from previous options and reset buttons
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
            
            // Check if there are enough molecules
            if (this.moleculeFiles.length < 3) {
                const lang = window.language;
                const notEnoughMsg = lang ? lang.getText('error.notEnoughMolecules') : 'Not enough molecules to continue.';
                this.elements.feedbackMessage.textContent = notEnoughMsg;
                this.elements.feedbackMessage.className = 'error';
                return;
            }
            
            // Try to load current level information from JSON file
            let similarMolecules = await this.tryLoadSimilarMolecules();
            
            if (similarMolecules) {
                // If we have information from the JSON file with levels
                this.currentMolecule = `data/DB/${similarMolecules.target.file}`;
                
                // Extract target molecule name
                if (this.elements.targetMoleculeName) {
                    this.elements.targetMoleculeName.textContent = similarMolecules.target.name;
                }
                
                // Create options with similar molecules
                this.options = [
                    this.currentMolecule,
                    `data/DB/${similarMolecules.similar[0].file}`,
                    `data/DB/${similarMolecules.similar[1].file}`
                ];
                
                // Shuffle the options
                this.shuffleArray(this.options);
                
                // Find index of the correct option
                this.correctOption = this.options.indexOf(this.currentMolecule);
                
                const lang = window.language;
                const usingLevelMsg = lang ? lang.getText('console.usingSimilarMolecules') : 'Using level with similar molecules:';
                const targetMoleculeMsg = lang ? lang.getText('console.targetMolecule') : 'Target molecule:';
                const incorrectOptionsMsg = lang ? lang.getText('console.incorrectOptions') : 'Incorrect options:';
                
                console.log(usingLevelMsg);
                console.log(`${targetMoleculeMsg}`, this.currentMolecule);
                console.log(`${incorrectOptionsMsg}`, this.options[0] === this.currentMolecule ? this.options.slice(1) : 
                    this.options[1] === this.currentMolecule ? [this.options[0], this.options[2]] : this.options.slice(0, 2));
            } else {
                // Original method as fallback if we don't have the JSON file with levels
                // Select target molecule randomly
                const targetIndex = Math.floor(Math.random() * this.moleculeFiles.length);
                this.currentMolecule = this.moleculeFiles[targetIndex];
                
                // Extract molecule name from file
                const moleculeFile = this.currentMolecule.split('/').pop().replace('.mol2', '');
                if (this.elements.targetMoleculeName) {
                    this.elements.targetMoleculeName.textContent = moleculeFile;
                }
                
                // Create list of available molecules excluding the target
                let availableOptions = [...this.moleculeFiles];
                availableOptions.splice(targetIndex, 1); // Remove target molecule
                
                // Shuffle available molecules to ensure diversity
                this.shuffleArray(availableOptions);
                
                // Take the first 2 different molecules for incorrect options
                const wrong1 = availableOptions[0];
                const wrong2 = availableOptions[1];
                
                // Verify they are different from each other
                const lang = window.language;
                const usingRandomMsg = lang ? lang.getText('console.usingRandomSelection') : 'Using random selection of molecules:';
                const targetMoleculeMsg = lang ? lang.getText('console.targetMolecule') : 'Target molecule:';
                const incorrectOption1Msg = lang ? lang.getText('console.incorrectOption1') : 'Incorrect option 1:';
                const incorrectOption2Msg = lang ? lang.getText('console.incorrectOption2') : 'Incorrect option 2:';
                
                console.log(usingRandomMsg);
                console.log(`${targetMoleculeMsg}`, this.currentMolecule);
                console.log(`${incorrectOption1Msg}`, wrong1);
                console.log(`${incorrectOption2Msg}`, wrong2);
                
                // Create and shuffle options
                this.options = [this.currentMolecule, wrong1, wrong2];
                this.shuffleArray(this.options);
                
                // Find index of the correct option
                this.correctOption = this.options.indexOf(this.currentMolecule);
            }
            
            const lang = window.language;
            const correctOptionMsg = lang ? lang.getText('console.correctOptionAt') : 'Correct option at position:';
            console.log(`${correctOptionMsg}`, this.correctOption);
            
            // Create 3D viewers
            await this.createMoleculeViewers();
            
            // Add click listeners to selection buttons
            for (let i = 0; i < 3; i++) {
                const selectButton = document.getElementById(`select-${i}`);
                selectButton.onclick = () => this.checkAnswer(i);
            }
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('console.errorSettingUpLevel') : 'Error setting up level:';
            console.error(`${errorMsg}`, error);
            const retryMsg = lang ? lang.getText('error.loadingLevel') : 'Error loading level. Trying again...';
            this.elements.feedbackMessage.textContent = retryMsg;
            this.elements.feedbackMessage.className = 'error';
            
            // Try again after a brief delay
            setTimeout(() => this.setupNewLevel(), 2000);
        }
    }
    
    /**
     * Creates molecule viewers for the current level
     */
    async createMoleculeViewers() {
        try {
            // For the declarative 3Dmol.js approach, we set the data-href attribute
            // for each molecule container and let 3Dmol.js do the rest
            
            // Generate seeds for random but consistent rotations
            const baseSeed = Date.now();
            const getRotationParams = (index) => {
                // Use a different seed for each molecule but consistent in the same session
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
     * Checks the selected answer
     * @param {number} selectedOption - Index of the selected option
     */
    checkAnswer(selectedOption) {
        // Increment attempts
        this.attempts++;
        const lang = window.language;
        const attemptsLabel = lang ? lang.getText('attemptsLabel') : 'Attempts:';
        this.elements.attemptsDisplay.textContent = `${attemptsLabel} ${this.attempts}`;
        
        // Check if it's correct
        if (selectedOption === this.correctOption) {
            // Correct answer
            this.score++;
            const hitsLabel = lang ? lang.getText('scoreLabel') : 'Hits:';
            this.elements.scoreDisplay.textContent = `${hitsLabel} ${this.score}`;
            const correctMsg = lang ? lang.getText('correct') : 'CORRECT! Well done!';
            this.elements.feedbackMessage.textContent = correctMsg;
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
            // Incorrect answer
            const lang = window.language;
            const incorrectMsg = lang ? lang.getText('incorrect') : 'INCORRECT! Try again';
            this.elements.feedbackMessage.textContent = incorrectMsg;
            this.elements.feedbackMessage.className = 'incorrect';
            
            // Briefly highlight the incorrect option
            const optionElement = document.getElementById(`option-${selectedOption}`);
            optionElement.classList.add('incorrect-option');
            
            // Scroll to feedback message if necessary on small screens
            this.elements.feedbackMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Temporarily disable the selected button
            document.getElementById(`select-${selectedOption}`).disabled = true;
            
            // Remove class and enable button after a moment
            setTimeout(() => {
                optionElement.classList.remove('incorrect-option');
                document.getElementById(`select-${selectedOption}`).disabled = false;
            }, 800);
        }
        
        // Update accuracy
        this.updateAccuracy();
    }
    
    /**
     * Updates the accuracy indicator
     */
    updateAccuracy() {
        const accuracy = this.attempts > 0 ? (this.score / this.attempts) * 100 : 0;
        const lang = window.language;
        const accuracyLabel = lang ? lang.getText('accuracyLabel') : 'Accuracy:';
        this.elements.accuracyDisplay.textContent = `${accuracyLabel} ${accuracy.toFixed(1)}%`;
    }
    
    /**
     * Starts the game timer - countdown from 60 to 0, game ends when reaching 0
     */
    startTimer() {
        console.log('Timer started at:', new Date().toLocaleTimeString());
        const timerInterval = setInterval(() => {
            // If the game is over, stop the timer
            if (this.gameOver) {
                clearInterval(timerInterval);
                return;
            }
            
            // Calculate elapsed time
            const elapsedTime = (Date.now() - this.startTime) / 1000;
            
            // Calculate remaining time
            const remainingTime = Math.max(0, this.timeLimit - elapsedTime);
            
            // Update display - get element reference dynamically to handle language changes
            const timeLeftElement = document.getElementById('time-left');
            if (timeLeftElement) {
                timeLeftElement.textContent = Math.ceil(remainingTime);
            }
            
            // Debug log every 5 seconds
            if (Math.ceil(remainingTime) % 5 === 0 && Math.ceil(remainingTime) !== this.lastLoggedTime) {
                console.log('Timer update:', Math.ceil(remainingTime), 'seconds remaining');
                this.lastLoggedTime = Math.ceil(remainingTime);
            }
            
            // If time is up, end game
            if (remainingTime <= 0) {
                console.log('Time up! Ending game...');
                // Show time's up message
                const lang = window.language;
                const timeUpMsg = lang ? lang.getText('timeUp') : "Time's up!";
                this.elements.feedbackMessage.textContent = timeUpMsg;
                this.elements.feedbackMessage.className = 'incorrect';
                
                clearInterval(timerInterval);
                // Small delay to show the message before ending
                setTimeout(() => {
                    this.endGame();
                }, 1000);
            }
        }, 200);
    }
    
    /**
     * Ends the game
     */
    endGame() {
        this.gameOver = true;
        
        // Calculate total game time
        const totalTime = (Date.now() - this.startTime) / 1000;
        
        // Calculate accuracy
        const accuracy = this.attempts > 0 ? (this.score / this.attempts) * 100 : 0;
        
        // Save ranking
        this.ranking.addRanking(this.playerName, this.score, this.attempts, totalTime);
        
        // Ensure the game screen is completely hidden
        this.elements.gameScreen.style.display = 'none';
        this.elements.gameScreen.style.visibility = 'hidden';
        this.elements.gameScreen.style.opacity = '0';
        
        // Prepare the game over screen
        this.elements.gameOverScreen.style.display = 'flex';
        this.elements.gameOverScreen.style.visibility = 'visible';
        this.elements.gameOverScreen.style.opacity = '1';
        
        // Show final statistics with language support
        const lang = window.language;
        const playerLabel = lang ? lang.getText('playerLabel') : 'Player:';
        const hitsLabel = lang ? lang.getText('scoreLabel') : 'Hits:';
        const attemptsLabel = lang ? lang.getText('attemptsLabel') : 'Attempts:';
        const accuracyLabel = lang ? lang.getText('accuracyLabel') : 'Accuracy:';
        const totalTimeLabel = lang ? lang.getText('totalTimeLabel') : 'Total time:';
        const secondsLabel = lang ? lang.getText('secondsLabel') : 'seconds';
        
        this.elements.finalStats.innerHTML = `
            <p>${playerLabel} <strong>${this.playerName}</strong></p>
            <p>${hitsLabel} <strong>${this.score}</strong></p>
            <p>${attemptsLabel} <strong>${this.attempts}</strong></p>
            <p>${accuracyLabel} <strong>${accuracy.toFixed(1)}%</strong></p>
            <p>${totalTimeLabel} <strong>${totalTime.toFixed(1)} ${secondsLabel}</strong></p>
        `;
        
        // Switch to game over screen
        this.showScreen('gameOver');
        
        // Update rankings
        this.ranking.updateRankingsDisplay('rankings-container', 10);
    }
    
    /**
     * Resets the game
     */
    resetGame() {
        this.score = 0;
        this.attempts = 0;
        this.startTime = null;
        this.gameOver = false;
        this.currentMolecule = null;
        this.options = [];
        this.correctOption = -1;
        
        // Ensure the game over screen is completely hidden
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.gameOverScreen.style.visibility = 'hidden';
        this.elements.gameOverScreen.style.opacity = '0';
        
        // Prepare the welcome screen
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.welcomeScreen.style.visibility = 'visible';
        this.elements.welcomeScreen.style.opacity = '1';
        
        // Clear fields
        this.elements.playerNameInput.value = '';
        this.elements.startButton.disabled = true;
        
        // Reset timer display to countdown start
        const timeLeftElement = document.getElementById('time-left');
        if (timeLeftElement) {
            timeLeftElement.textContent = '60';
        }
        
        // Clear feedback message if it exists
        if (this.elements.feedbackMessage) {
            this.elements.feedbackMessage.textContent = '';
            this.elements.feedbackMessage.className = '';
        }
        
        // Return to welcome screen
        this.showScreen('welcome');
        
        // Update rankings
        this.ranking.updateRankingsDisplay('rankings-container', 10);
    }
    
    /**
     * Shows a specific screen and hides the others
     * @param {string} screenId - Screen identifier to show ('welcome', 'game' or 'gameOver')
     */
    showScreen(screenId) {
        // First, remove the active class from all screens
        Object.keys(this.screens).forEach(key => {
            this.screens[key].classList.remove('active');
            // Ensure inactive screens have low z-index
            this.screens[key].style.zIndex = "1";
        });
        
        // Then, show only the requested screen
        if (this.screens[screenId]) {
            this.screens[screenId].classList.add('active');
            this.screens[screenId].style.zIndex = "10";
            
            // If we're showing a new screen, make sure to clear any previous feedback or messages
            if (screenId !== 'game' && this.elements.feedbackMessage) {
                this.elements.feedbackMessage.textContent = '';
                this.elements.feedbackMessage.className = '';
            }
        }
    }
    
    /**
     * Tries to load a level with similar molecules from the JSON file
     * @returns {Object|null} - Level information or null if not available
     */
    async tryLoadSimilarMolecules() {
        try {
            // Try to load the levels file
            const response = await fetch('data/molecules.json');
            
            if (response.ok) {
                const data = await response.json();
                
                // Check if we have the levels structure
                if (data.levels && Array.isArray(data.levels) && data.levels.length > 0) {
                    // Difficulty progression - select level based on current score
                    // First levels are easier (smaller molecules)
                    const levelIndex = Math.min(this.score, data.levels.length - 1);
                    return data.levels[levelIndex];
                }
            }
            
            return null;
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('console.errorLoadingSimilarMolecules') : 'Error loading levels with similar molecules:';
            console.error(`${errorMsg}`, error);
            return null;
        }
    }
    
    /**
     * Randomly shuffles an array
     * @param {Array} array - Array to shuffle
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Generates a simple hash from a string
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
     * Applies a rotation around an arbitrary axis to a 3D model
     * @param {Object} model - The 3Dmol.js 3D model
     * @param {number} axisX - X component of the rotation axis (normalized)
     * @param {number} axisY - Y component of the rotation axis (normalized) 
     * @param {number} axisZ - Z component of the rotation axis (normalized)
     * @param {number} angle - Rotation angle in degrees
     */
    applyArbitraryAxisRotation(model, axisX, axisY, axisZ, angle) {
        try {
            // Normalize the axis vector
            const length = Math.sqrt(axisX*axisX + axisY*axisY + axisZ*axisZ);
            if (length === 0) return;
            
            axisX /= length;
            axisY /= length;
            axisZ /= length;
            
            // Convert angle to radians
            const angleRad = (angle * Math.PI) / 180;
            const c = Math.cos(angleRad);
            const s = Math.sin(angleRad);
            const t = 1 - c;
            
            // Rodrigues rotation matrix
            const rotMatrix = [
                [t*axisX*axisX + c,          t*axisX*axisY - s*axisZ,    t*axisX*axisZ + s*axisY],
                [t*axisX*axisY + s*axisZ,    t*axisY*axisY + c,          t*axisY*axisZ - s*axisX],
                [t*axisX*axisZ - s*axisY,    t*axisY*axisZ + s*axisX,    t*axisZ*axisZ + c]
            ];
            
            // Get model atoms
            const atoms = model.selectedAtoms({});
            if (atoms.length === 0) return;
            
            // Calculate center of mass to rotate around it
            let centerX = 0, centerY = 0, centerZ = 0;
            for (const atom of atoms) {
                centerX += atom.x;
                centerY += atom.y;
                centerZ += atom.z;
            }
            centerX /= atoms.length;
            centerY /= atoms.length;
            centerZ /= atoms.length;
            
            // Apply rotation to each atom
            for (const atom of atoms) {
                // Translate to origin
                const x = atom.x - centerX;
                const y = atom.y - centerY;
                const z = atom.z - centerZ;
                
                // Apply rotation
                const newX = rotMatrix[0][0]*x + rotMatrix[0][1]*y + rotMatrix[0][2]*z;
                const newY = rotMatrix[1][0]*x + rotMatrix[1][1]*y + rotMatrix[1][2]*z;
                const newZ = rotMatrix[2][0]*x + rotMatrix[2][1]*y + rotMatrix[2][2]*z;
                
                // Translate back
                atom.x = newX + centerX;
                atom.y = newY + centerY;
                atom.z = newZ + centerZ;
            }
            
            const lang = window.language;
            const rotationMsg = lang ? lang.getText('console.arbitraryAxisRotation') : 'Arbitrary axis rotation applied:';
            console.log(`${rotationMsg} (${axisX.toFixed(3)}, ${axisY.toFixed(3)}, ${axisZ.toFixed(3)}) @ ${angle.toFixed(1)}°`);
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('error.applyingRotation') : 'Error applying arbitrary axis rotation:';
            console.error(`${errorMsg}`, error);
        }
    }
    
    /**
     * Updates DOM references after language change recreates elements
     */
    updateDOMReferences() {
        // Update the timeLeft reference since it gets recreated when language changes
        this.elements.timeLeft = document.getElementById('time-left');
    }
}

// Export the class for use in other files
window.MoleculeGame = MoleculeGame;