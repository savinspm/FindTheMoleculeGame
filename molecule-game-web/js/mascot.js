/**
 * Mascot - toggles the game mascot's mood classes, auto-reverting to idle.
 */
class Mascot {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.revertTimeout = null;
    }

    _react(className, duration) {
        if (!this.element) return;
        clearTimeout(this.revertTimeout);
        this.element.classList.remove('happy', 'sad');
        // Force reflow so the animation restarts if the same mood repeats quickly.
        void this.element.offsetWidth;
        this.element.classList.add(className);
        this.revertTimeout = setTimeout(() => {
            this.element.classList.remove(className);
        }, duration);
    }

    reactHappy() {
        this._react('happy', 700);
    }

    reactSad() {
        this._react('sad', 600);
    }

    reactIdle() {
        clearTimeout(this.revertTimeout);
        if (this.element) this.element.classList.remove('happy', 'sad');
    }
}

window.mascot = new Mascot('game-mascot');
