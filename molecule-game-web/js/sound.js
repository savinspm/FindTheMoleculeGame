/**
 * SoundFX - tiny sound effects synthesized with the Web Audio API.
 * No audio files: everything here is generated in code, so it works fully
 * offline and adds zero network/asset weight.
 */
class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    _ensureContext() {
        if (!this.enabled) return null;
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                this.enabled = false;
                return null;
            }
            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    _tone(freq, startOffset, duration, type = 'sine', peakGain = 0.2) {
        const ctx = this._ensureContext();
        if (!ctx) return;
        const start = ctx.currentTime + startOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.05);
    }

    playCorrect() {
        this._tone(523.25, 0, 0.14, 'triangle', 0.22); // C5
        this._tone(659.25, 0.09, 0.14, 'triangle', 0.22); // E5
        this._tone(783.99, 0.18, 0.26, 'triangle', 0.24); // G5
    }

    playIncorrect() {
        this._tone(220, 0, 0.16, 'sawtooth', 0.15);
        this._tone(174.61, 0.12, 0.28, 'sawtooth', 0.15);
    }

    playStart() {
        this._tone(392, 0, 0.1, 'square', 0.12);
        this._tone(523.25, 0.1, 0.18, 'square', 0.12);
    }

    playGameOver() {
        this._tone(523.25, 0, 0.16, 'triangle', 0.2);
        this._tone(392, 0.15, 0.16, 'triangle', 0.2);
        this._tone(329.63, 0.3, 0.35, 'triangle', 0.22);
    }
}

window.soundFX = new SoundFX();
