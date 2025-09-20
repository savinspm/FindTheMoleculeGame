/**
 * Ranking - Clase para manejar el sistema de rankings del juego
 */
class Ranking {
    /**
     * Constructor
     */
    constructor() {
        // Clave para LocalStorage
        this.storageKey = 'molecule_game_rankings';
    }
    
    /**
     * Carga los rankings guardados
     * @returns {Array} - Lista de rankings ordenados
     */
    loadRankings() {
        try {
            const rankingsData = localStorage.getItem(this.storageKey);
            return rankingsData ? JSON.parse(rankingsData) : [];
        } catch (error) {
            console.error('Error al cargar rankings:', error);
            return [];
        }
    }
    
    /**
     * Guarda los rankings en LocalStorage
     * @param {Array} rankings - Lista de rankings
     */
    saveRankings(rankings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(rankings));
        } catch (error) {
            console.error('Error al guardar rankings:', error);
        }
    }
    
    /**
     * Añade un nuevo ranking
     * @param {string} playerName - Nombre del jugador
     * @param {number} score - Puntuación (aciertos)
     * @param {number} attempts - Intentos realizados
     * @param {number} time - Tiempo utilizado (en segundos)
     * @returns {Array} - Lista actualizada de rankings
     */
    addRanking(playerName, score, attempts, time) {
        try {
            // Cargar rankings existentes
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
            console.error('Error al añadir ranking:', error);
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
            console.error(`Contenedor de rankings ${containerId} no encontrado`);
            return;
        }
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Obtener rankings
        const rankings = this.getTopRankings(limit);
        
        if (rankings.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'no-rankings';
            noData.textContent = 'No hay datos todavía';
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
            scrollIndicator.textContent = `Mostrando top ${limit} de ${allRankings.length} jugadores`;
            container.appendChild(scrollIndicator);
        }
    }
}

// Exportar la clase para su uso en otros archivos
window.Ranking = Ranking;