/**
 * Language - Class to handle internationalization (Spanish/English)
 * Manages language switching and text translations
 */
class Language {
    /**
     * Constructor
     */
    constructor() {
        // Default language
        this.currentLanguage = 'en';
        
        // Storage key for language preference
        this.storageKey = 'molecule_game_language';
        
        // Load saved language preference
        this.loadLanguagePreference();
        
        // Translation dictionary
        this.translations = {
            en: {
                // Welcome screen
                welcomeTitle: 'FIND THE MOLECULE!',
                welcomeSubtitle: 'Hello! Welcome to the molecule game',
                instructions1: 'You have to find the correct molecule',
                instructions2: 'You have 1 minute to get as many right as possible!',
                instructions3: 'Enter your name and press the button to start',
                nameLabel: 'Your name:',
                namePlaceholder: 'Enter your name',
                startButton: 'START!',
                ranking: 'RANKING',
                noRankings: 'No data yet',
                language: 'Language',
                
                // Game screen
                findMolecule: 'Find:',
                playerLabel: 'Player:',
                scoreLabel: 'Hits:',
                attemptsLabel: 'Attempts:',
                accuracyLabel: 'Accuracy:',
                timeLabel: 'Time:',
                rotateHint: '↻ Click and drag to rotate',
                
                // Feedback messages
                correct: 'Correct!',
                incorrect: 'Incorrect. Try again!',
                timeUp: 'Time\'s up!',
                loadingLevel: 'Loading level...',
                errorLoading: 'Error loading level. Trying again...',
                
                // Game over screen
                gameOverTitle: 'GAME OVER!',
                finalStats: 'Final Statistics:',
                playAgainButton: 'Play Again',
                totalTimeLabel: 'Total time:',
                secondsLabel: 'seconds',
                
                // Console messages
                console: {
                    moleculeLoaded: 'Loading molecule from:',
                    rotationApplied: 'Rotation applied to',
                    complexMolecule: 'Complex molecule detected',
                    atomsApplyingAdjustments: 'atoms. Applying additional adjustments.',
                    atomDetected: 'Atom:',
                    doubleBondDetected: 'Double bond detected between',
                    tripleBondDetected: 'Triple bond detected between',
                    errorDetectingBonds: 'Error detecting multiple bonds:',
                    fallbackMolecule: '3Dmol.js not available. Using simplified visualization.',
                    simplifiedView: 'Simplified view',
                    rotateHint: 'Click to rotate',
                    errorCreatingViewer: 'Error creating viewer for',
                    containerNotFound: 'Container not found',
                    errorLoadingMolecule: 'Error loading molecule from',
                    correctOptionAt: 'Correct option at position:',
                    errorSettingUpLevel: 'Error setting up level:',
                    showingTop: 'Showing top',
                    of: 'of',
                    players: 'players',
                    loadingMolecule: 'Loading molecule from',
                    viewer3DCreated: '3D viewer created successfully for container',
                    moleculeLoaded: 'Molecule loaded successfully',
                    rotatingMolecule: 'Rotating molecule with angles',
                    zoomingViewer: 'Zooming viewer to fit',
                    moleculesLoaded: 'molecule files loaded.',
                    usingSimilarMolecules: 'Using level with similar molecules:',
                    targetMolecule: 'Target molecule:',
                    incorrectOptions: 'Incorrect options:',
                    usingRandomSelection: 'Using random selection of molecules:',
                    incorrectOption1: 'Incorrect option 1:',
                    incorrectOption2: 'Incorrect option 2:',
                    correctOptionAt: 'Correct option at position:',
                    errorSettingUpLevel: 'Error setting up level:',
                    errorLoadingSimilarMolecules: 'Error loading levels with similar molecules:',
                    arbitraryAxisRotation: 'Arbitrary axis rotation applied:',
                    errorLoadingRankings: 'Error loading rankings:',
                    errorSavingRankings: 'Error saving rankings:',
                    errorAddingRanking: 'Error adding ranking:',
                    rankingsContainerNotFound: 'Rankings container not found'
                },
                error: {
                    loadFile: 'Error loading file',
                    network: 'Network error',
                    loadMolecule: 'Error loading molecule from',
                    detectBonds: 'Error detecting multiple bonds',
                    noMolecules: 'No molecule files found. Please check the data/DB folder.',
                    initializeGame: 'Error initializing game:',
                    reloadPage: 'Error loading molecules. Please reload the page.',
                    notEnoughMolecules: 'Not enough molecules to continue.',
                    loadingLevel: 'Error loading level. Trying again...',
                    loadGameTitle: 'Error loading game',
                    loadGameDescription: 'An unknown error occurred.',
                    reloadText: 'Please reload the page or try again later.',
                    reloadButton: 'Reload',
                    applyingRotation: 'Error applying arbitrary axis rotation:'
                },
                game: {
                    player: 'Player',
                    hits: 'Hits',
                    attempts: 'Attempts',
                    accuracy: 'Accuracy'
                }
            },
            es: {
                // Welcome screen
                welcomeTitle: '¡ENCUENTRA LA MOLÉCULA!',
                welcomeSubtitle: '¡Hola! Bienvenido al juego de moléculas',
                instructions1: 'Tienes que encontrar la molécula correcta',
                instructions2: '¡Tienes 1 minuto para acertar todas las posibles!',
                instructions3: 'Escribe tu nombre y presiona el botón para empezar',
                nameLabel: 'Tu nombre:',
                namePlaceholder: 'Ingresa tu nombre',
                startButton: '¡COMENZAR!',
                ranking: 'RANKING',
                noRankings: 'No hay datos todavía',
                language: 'Idioma',
                
                // Game screen
                findMolecule: 'Encuentra:',
                playerLabel: 'Jugador:',
                scoreLabel: 'Aciertos:',
                attemptsLabel: 'Intentos:',
                accuracyLabel: 'Precisión:',
                timeLabel: 'Tiempo:',
                rotateHint: '↻ Haz clic y arrastra para girar',
                
                // Feedback messages
                correct: '¡Correcto!',
                incorrect: 'Incorrecto. ¡Inténtalo de nuevo!',
                timeUp: '¡Se acabó el tiempo!',
                loadingLevel: 'Cargando nivel...',
                errorLoading: 'Error al cargar nivel. Intentando de nuevo...',
                
                // Game over screen
                gameOverTitle: '¡JUEGO TERMINADO!',
                finalStats: 'Estadísticas Finales:',
                playAgainButton: 'Jugar de nuevo',
                totalTimeLabel: 'Tiempo total:',
                secondsLabel: 'segundos',
                
                // Console messages
                console: {
                    moleculeLoaded: 'Cargando molécula desde:',
                    rotationApplied: 'Rotación aplicada a',
                    complexMolecule: 'Molécula compleja detectada',
                    atomsApplyingAdjustments: 'átomos. Aplicando ajustes adicionales.',
                    atomDetected: 'Átomo:',
                    doubleBondDetected: 'Enlace doble detectado entre',
                    tripleBondDetected: 'Enlace triple detectado entre',
                    errorDetectingBonds: 'Error al detectar enlaces múltiples:',
                    fallbackMolecule: '3Dmol.js no está disponible. Se utilizará visualización simplificada.',
                    simplifiedView: 'Vista simplificada',
                    rotateHint: 'Haz clic para rotar',
                    errorCreatingViewer: 'Error al crear el visor para',
                    containerNotFound: 'Contenedor no encontrado',
                    errorLoadingMolecule: 'Error al cargar la molécula desde',
                    correctOptionAt: 'Opción correcta en posición:',
                    errorSettingUpLevel: 'Error al configurar nivel:',
                    showingTop: 'Mostrando top',
                    of: 'de',
                    players: 'jugadores',
                    loadingMolecule: 'Cargando molécula desde',
                    viewer3DCreated: 'Visor 3D creado exitosamente para contenedor',
                    moleculeLoaded: 'Molécula cargada exitosamente',
                    rotatingMolecule: 'Rotando molécula con ángulos',
                    zoomingViewer: 'Ajustando zoom del visor para encajar',
                    moleculesLoaded: 'archivos de moléculas cargados.',
                    usingSimilarMolecules: 'Usando nivel con moléculas similares:',
                    targetMolecule: 'Molécula objetivo:',
                    incorrectOptions: 'Opciones incorrectas:',
                    usingRandomSelection: 'Usando selección aleatoria de moléculas:',
                    incorrectOption1: 'Opción incorrecta 1:',
                    incorrectOption2: 'Opción incorrecta 2:',
                    correctOptionAt: 'Opción correcta en posición:',
                    errorSettingUpLevel: 'Error al configurar nivel:',
                    errorLoadingSimilarMolecules: 'Error al cargar niveles con moléculas similares:',
                    arbitraryAxisRotation: 'Rotación de eje arbitrario aplicada:',
                    errorLoadingRankings: 'Error al cargar rankings:',
                    errorSavingRankings: 'Error al guardar rankings:',
                    errorAddingRanking: 'Error al añadir ranking:',
                    rankingsContainerNotFound: 'Contenedor de rankings no encontrado'
                },
                error: {
                    loadFile: 'Error al cargar archivo',
                    network: 'Error de red',
                    loadMolecule: 'Error al cargar la molécula desde',
                    detectBonds: 'Error al detectar enlaces múltiples',
                    noMolecules: 'No se encontraron archivos de moléculas. Por favor, verifica la carpeta data/DB.',
                    initializeGame: 'Error al inicializar el juego:',
                    reloadPage: 'Error al cargar las moléculas. Por favor, recarga la página.',
                    notEnoughMolecules: 'No hay suficientes moléculas para continuar.',
                    loadingLevel: 'Error al cargar nivel. Intentando de nuevo...',
                    loadGameTitle: 'Error al cargar el juego',
                    loadGameDescription: 'Ocurrió un error desconocido.',
                    reloadText: 'Por favor, recarga la página o inténtalo más tarde.',
                    reloadButton: 'Recargar',
                    applyingRotation: 'Error aplicando rotación de eje arbitrario:'
                },
                game: {
                    player: 'Jugador',
                    hits: 'Aciertos',
                    attempts: 'Intentos',
                    accuracy: 'Precisión'
                }
            }
        };
    }
    
    /**
     * Load language preference from localStorage
     */
    loadLanguagePreference() {
        try {
            const savedLanguage = localStorage.getItem(this.storageKey);
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
                this.currentLanguage = savedLanguage;
            }
        } catch (error) {
            console.error('Error loading language preference:', error);
        }
    }
    
    /**
     * Save language preference to localStorage
     */
    saveLanguagePreference() {
        try {
            localStorage.setItem(this.storageKey, this.currentLanguage);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    }
    
    /**
     * Set current language
     * @param {string} language - Language code ('en' or 'es')
     */
    setLanguage(language) {
        if (language !== 'en' && language !== 'es') {
            console.error('Invalid language code. Use "en" or "es"');
            return;
        }
        
        this.currentLanguage = language;
        this.saveLanguagePreference();
        this.updateUI();
    }
    
    /**
     * Get current language
     * @returns {string} - Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Get translated text
     * @param {string} key - Translation key
     * @param {object} params - Optional parameters for string interpolation
     * @returns {string} - Translated text
     */
    getText(key, params = {}) {
        const keys = key.split('.');
        let text = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (text && typeof text === 'object' && k in text) {
                text = text[k];
            } else {
                console.warn(`Translation key not found: ${key} for language: ${this.currentLanguage}`);
                return key;
            }
        }
        
        // Simple parameter replacement
        if (typeof text === 'string' && Object.keys(params).length > 0) {
            Object.keys(params).forEach(param => {
                text = text.replace(`{${param}}`, params[param]);
            });
        }
        
        return text || key;
    }
    
    /**
     * Update UI elements with current language
     */
    updateUI() {
        // Update page title
        this.updateElementText('#page-title', this.getText('welcomeTitle'));
        
        // Update welcome screen
        this.updateElementText('#welcome-title', this.getText('welcomeTitle'));
        this.updateElementText('#welcome-subtitle', this.getText('welcomeSubtitle'));
        this.updateElementText('#instructions-1', this.getText('instructions1'));
        this.updateElementText('#instructions-2', this.getText('instructions2'));
        this.updateElementText('#instructions-3', this.getText('instructions3'));
        this.updateElementText('#name-label', this.getText('nameLabel'));
        this.updateElementAttribute('#player-name', 'placeholder', this.getText('namePlaceholder'));
        this.updateElementText('#start-button', this.getText('startButton'));
        this.updateElementText('#ranking-title', this.getText('ranking'));
        
        // Update game screen
        this.updateElementText('#find-label', this.getText('findMolecule') + ' ');
        
        // Update game over screen
        this.updateElementText('#game-over-title', this.getText('gameOverTitle'));
        this.updateElementText('#play-again-button', this.getText('playAgainButton'));
        
        // Update timer label - preserve the time-left element
        const timeElement = document.getElementById('timer-label');
        if (timeElement) {
            const timeLeft = document.getElementById('time-left');
            const timeValue = timeLeft ? timeLeft.textContent : '60';
            timeElement.innerHTML = `${this.getText('timeLabel')} <span id="time-left">${timeValue}</span>s`;
            
            // Notify the game to update its DOM references after language change
            if (window.game && window.game.updateDOMReferences) {
                window.game.updateDOMReferences();
            }
        }
        
        // Update rotate hints for all molecule viewers
        const viewers = document.querySelectorAll('.viewer_3Dmoljs');
        viewers.forEach(viewer => {
            const rotateHint = this.getText('rotateHint');
            viewer.setAttribute('data-rotate-hint', rotateHint);
        });
        
        // Update language buttons
        this.updateLanguageButtons();
    }
    
    /**
     * Update language buttons state
     */
    updateLanguageButtons() {
        const langEnBtn = document.getElementById('lang-en');
        const langEsBtn = document.getElementById('lang-es');
        
        if (langEnBtn && langEsBtn) {
            langEnBtn.classList.toggle('active', this.currentLanguage === 'en');
            langEsBtn.classList.toggle('active', this.currentLanguage === 'es');
        }
    }
    
    /**
     * Update text content of an element
     * @param {string} selector - CSS selector
     * @param {string} text - New text content
     */
    updateElementText(selector, text) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }
    
    /**
     * Update attribute of an element
     * @param {string} selector - CSS selector
     * @param {string} attribute - Attribute name
     * @param {string} value - New attribute value
     */
    updateElementAttribute(selector, attribute, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.setAttribute(attribute, value);
        }
    }
    
    /**
     * Update language button states
     */
    updateLanguageButtons() {
        const enButton = document.getElementById('lang-en');
        const esButton = document.getElementById('lang-es');
        
        if (enButton && esButton) {
            // Remove active class from both
            enButton.classList.remove('active');
            esButton.classList.remove('active');
            
            // Add active class to current language
            if (this.currentLanguage === 'en') {
                enButton.classList.add('active');
            } else {
                esButton.classList.add('active');
            }
        }
    }
    
    /**
     * Initialize language system
     */
    init() {
        // Update UI with current language
        this.updateUI();
        
        // Add event listeners for language buttons
        const enButton = document.getElementById('lang-en');
        const esButton = document.getElementById('lang-es');
        
        if (enButton) {
            enButton.addEventListener('click', () => this.setLanguage('en'));
        }
        
        if (esButton) {
            esButton.addEventListener('click', () => this.setLanguage('es'));
        }
    }
}

// Export the class for use in other files
window.Language = Language;