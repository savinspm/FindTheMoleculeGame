/**
 * Ranking - Class to handle the game's ranking system
 */
class Ranking {
    /**
     * Constructor
     */
    constructor() {
        // Key for LocalStorage
        this.storageKey = 'molecule_game_rankings';
    }
    
    /**
     * Loads saved rankings
     * @returns {Array} - List of ordered rankings
     */
    loadRankings() {
        try {
            const rankingsData = localStorage.getItem(this.storageKey);
            return rankingsData ? JSON.parse(rankingsData) : [];
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('console.errorLoadingRankings') : 'Error loading rankings:';
            console.error(`${errorMsg}`, error);
            return [];
        }
    }
    
    /**
     * Saves rankings to LocalStorage
     * @param {Array} rankings - List of rankings
     */
    saveRankings(rankings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(rankings));
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('console.errorSavingRankings') : 'Error saving rankings:';
            console.error(`${errorMsg}`, error);
        }
    }
    
    /**
     * Adds a new ranking
     * @param {string} playerName - Player name
     * @param {number} score - Score (hits)
     * @param {number} attempts - Attempts made
     * @param {number} time - Time used (in seconds)
     * @returns {Array} - Updated list of rankings
     */
    addRanking(playerName, score, attempts, time) {
        try {
            // Load existing rankings
            let rankings = this.loadRankings();
            
            // Calcular precisión
            const accuracy = attempts > 0 ? (score / attempts) * 100 : 0;
            
            // Crear nuevo ranking
            const newRanking = {
                name: playerName,
                score: score,
                attempts: attempts,
                accuracy: accuracy,
                time: Math.round(time * 100) / 100, // Redondear a 2 decimales
                date: new Date().toISOString()
            };
            
            // Añadir a la lista
            rankings.push(newRanking);
            
            // Ordenar por precisión (descendente), luego por puntuación (descendente) 
            // y finalmente por tiempo (ascendente)
            rankings.sort((a, b) => {
                if (a.accuracy !== b.accuracy) {
                    return b.accuracy - a.accuracy;
                }
                if (a.score !== b.score) {
                    return b.score - a.score;
                }
                return a.time - b.time;
            });
            
            // Limitar a los 20 mejores rankings
            if (rankings.length > 20) {
                rankings = rankings.slice(0, 20);
            }
            
            // Guardar rankings actualizados
            this.saveRankings(rankings);
            
            return rankings;
        } catch (error) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('console.errorAddingRanking') : 'Error adding ranking:';
            console.error(`${errorMsg}`, error);
            return this.loadRankings();
        }
    }
    
    /**
     * Obtiene los mejores rankings
     * @param {number} limit - Número máximo de rankings a devolver
     * @returns {Array} - Lista de los mejores rankings
     */
    getTopRankings(limit = 10) {
        const rankings = this.loadRankings();
        return rankings.slice(0, limit);
    }
    
    /**
     * Actualiza el contenedor de rankings en el DOM
     * @param {string} containerId - ID del elemento contenedor
     * @param {number} limit - Número máximo de rankings a mostrar
     */
    updateRankingsDisplay(containerId, limit = 10) {
        const container = document.getElementById(containerId);
        if (!container) {
            const lang = window.language;
            const errorMsg = lang ? lang.getText('console.rankingsContainerNotFound') : 'Rankings container not found';
            console.error(`${errorMsg} ${containerId}`);
            return;
        }
        
        // Clear the container
        container.innerHTML = '';
        
        // Get rankings
        const rankings = this.getTopRankings(limit);
        
        if (rankings.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'no-rankings';
            const lang = window.language;
            noData.textContent = lang ? lang.getText('noRankings') : 'No data yet';
            container.appendChild(noData);
            return;
        }
        
        // Crear elementos para cada ranking
        rankings.forEach((ranking, index) => {
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            
            // Add ranking position number
            const positionElement = document.createElement('div');
            positionElement.className = 'ranking-position';
            positionElement.textContent = `#${index + 1}`;
            
            // Create player info container
            const playerInfoElement = document.createElement('div');
            playerInfoElement.className = 'player-info';
            
            const nameElement = document.createElement('div');
            nameElement.className = 'player-name';
            nameElement.textContent = ranking.name;
            
            const statsElement = document.createElement('div');
            statsElement.className = 'player-stats';
            statsElement.textContent = `${ranking.accuracy.toFixed(1)}% (${ranking.score}/${ranking.attempts})`;
            
            playerInfoElement.appendChild(nameElement);
            playerInfoElement.appendChild(statsElement);
            
            rankingItem.appendChild(positionElement);
            rankingItem.appendChild(playerInfoElement);
            container.appendChild(rankingItem);
        });
        
        // Add scroll indicator if there are more rankings available
        const allRankings = this.loadRankings();
        if (allRankings.length > limit) {
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            const lang = window.language;
            const showingText = lang ? lang.getText('console.showingTop') : 'Showing top';
            const ofText = lang ? lang.getText('console.of') : 'of';
            const playersText = lang ? lang.getText('console.players') : 'players';
            scrollIndicator.textContent = `${showingText} ${limit} ${ofText} ${allRankings.length} ${playersText}`;
            container.appendChild(scrollIndicator);
        }
    }
}

// Export the class for use in other files
window.Ranking = Ranking;