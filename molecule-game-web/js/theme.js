/**
 * Theme - applies and persists the chosen "Super-Molecule" color theme.
 * Themes only override CSS custom properties on <body>, so the whole app
 * re-skins for free without touching per-component styles.
 */
class Theme {
    constructor() {
        this.storageKey = 'molecule_game_theme';
        this.themes = ['classic', 'rayo', 'titan', 'noir', 'estrella'];
    }

    load() {
        let saved = 'classic';
        try {
            saved = localStorage.getItem(this.storageKey) || 'classic';
        } catch (error) {
            console.warn('Could not read saved theme:', error);
        }
        this.apply(saved);
        this.bindOptions();
    }

    apply(themeName) {
        if (!this.themes.includes(themeName)) themeName = 'classic';

        this.themes.forEach((name) => {
            document.body.classList.remove(`theme-${name}`);
        });
        if (themeName !== 'classic') {
            document.body.classList.add(`theme-${themeName}`);
        }

        document.querySelectorAll('.theme-option').forEach((button) => {
            button.classList.toggle('active', button.dataset.theme === themeName);
        });

        try {
            localStorage.setItem(this.storageKey, themeName);
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }
    }

    bindOptions() {
        document.querySelectorAll('.theme-option').forEach((button) => {
            button.addEventListener('click', () => this.apply(button.dataset.theme));
        });
    }
}

window.theme = new Theme();
document.addEventListener('DOMContentLoaded', () => window.theme.load());
