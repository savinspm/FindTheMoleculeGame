/**
 * Main script that initializes the game
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize language system first
        console.log('Initializing language system...');
        window.language = new Language();
        
        // Set up language buttons
        const langEnBtn = document.getElementById('lang-en');
        const langEsBtn = document.getElementById('lang-es');
        
        if (langEnBtn && langEsBtn) {
            langEnBtn.addEventListener('click', () => {
                window.language.setLanguage('en');
                updateLanguageButtons();
            });
            
            langEsBtn.addEventListener('click', () => {
                window.language.setLanguage('es');
                updateLanguageButtons();
            });
        }
        
        function updateLanguageButtons() {
            const currentLang = window.language.getCurrentLanguage();
            if (langEnBtn && langEsBtn) {
                langEnBtn.classList.toggle('active', currentLang === 'en');
                langEsBtn.classList.toggle('active', currentLang === 'es');
            }
        }
        
        // Initialize UI with current language
        window.language.updateUI();
        updateLanguageButtons();
        
        console.log('Initializing "Find the Molecule" game...');
        
        // Initialize 3Dmol.js if available
        if (typeof $3Dmol !== 'undefined') {
            console.log('Initializing 3Dmol.js viewers...');
            try {
                // Configure to use stick style in all visualizations
                // and ensure there's no automatic rotation
                $3Dmol.defaultConfig = {
                    backgroundColor: 'white',
                    style: 'stick',
                    spin: false // Disable any automatic rotation
                };
                
                // Initialize 3Dmol.js viewers automatically
                $3Dmol.autoload();
                
                // Function to adjust sizes
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
                
                // Configure manual rotation for molecules
                const setupManualRotation = () => {
                    if (typeof $3Dmol !== 'undefined' && typeof $3Dmol.viewers !== 'undefined') {
                        // Add manual rotation with mouse/touch for all viewers
                        Object.keys($3Dmol.viewers).forEach(viewerId => {
                            const viewer = $3Dmol.viewers[viewerId];
                            const viewerElement = document.getElementById(viewerId);
                            
                            if (viewer && viewerElement) {
                                let isDragging = false;
                                let previousX, previousY;
                                
                                // Mouse events
                                viewerElement.addEventListener('mousedown', (e) => {
                                    isDragging = true;
                                    previousX = e.clientX;
                                    previousY = e.clientY;
                                    e.preventDefault();
                                });
                                
                                document.addEventListener('mousemove', (e) => {
                                    if (isDragging) {
                                        const deltaX = e.clientX - previousX;
                                        const deltaY = e.clientY - previousY;
                                        
                                        viewer.rotate(deltaY / 5, 'x');
                                        viewer.rotate(deltaX / 5, 'y');
                                        viewer.render();
                                        
                                        previousX = e.clientX;
                                        previousY = e.clientY;
                                        e.preventDefault();
                                    }
                                });
                                
                                document.addEventListener('mouseup', () => {
                                    isDragging = false;
                                });
                                
                                // Touch events for mobile devices
                                viewerElement.addEventListener('touchstart', (e) => {
                                    if (e.touches.length === 1) {
                                        isDragging = true;
                                        previousX = e.touches[0].clientX;
                                        previousY = e.touches[0].clientY;
                                        e.preventDefault();
                                    }
                                });
                                
                                document.addEventListener('touchmove', (e) => {
                                    if (isDragging && e.touches.length === 1) {
                                        const deltaX = e.touches[0].clientX - previousX;
                                        const deltaY = e.touches[0].clientY - previousY;
                                        
                                        viewer.rotate(deltaY / 5, 'x');
                                        viewer.rotate(deltaX / 5, 'y');
                                        viewer.render();
                                        
                                        previousX = e.touches[0].clientX;
                                        previousY = e.touches[0].clientY;
                                        e.preventDefault();
                                    }
                                });
                                
                                document.addEventListener('touchend', () => {
                                    isDragging = false;
                                });
                                
                                console.log(`Manual rotation configured for ${viewerId}`);
                            }
                        });
                    }
                };
                
                // Adjust sizes and configure manual rotation after initialization
                setTimeout(() => {
                    adjustMoleculeSizes();
                    setupManualRotation();
                }, 1000);
                
                // Adjust sizes when window size changes
                window.addEventListener('resize', adjustMoleculeSizes);
            } catch (e) {
                console.warn('Error initializing 3Dmol.js:', e);
            }
        }
        
        // Create game instance and make it globally available
        const game = new MoleculeGame();
        window.game = game; // Make available for language system
        
        // Initialize game (load molecules)
        const initialized = await game.initialize();
        
        if (!initialized) {
            console.error('Error: The game could not be initialized correctly.');
        } else {
            console.log('Game initialized successfully. Ready to play!');
        }
    } catch (error) {
        console.error('Error during game initialization:', error);
        
        // Show error message to user with language support
        const lang = window.language;
        const errorTitle = lang ? lang.getText('error.loadGameTitle') : 'Error loading game';
        const errorDescription = lang ? lang.getText('error.loadGameDescription') : 'An unknown error occurred.';
        const reloadText = lang ? lang.getText('error.reloadText') : 'Please reload the page or try again later.';
        const reloadButton = lang ? lang.getText('error.reloadButton') : 'Reload';
        
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
            <h2>${errorTitle}</h2>
            <p>${error.message || errorDescription}</p>
            <p>${reloadText}</p>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 8px 16px;
                background: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">${reloadButton}</button>
        `;
        document.body.appendChild(errorMessage);
    }
});