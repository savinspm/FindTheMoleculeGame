/**
 * Tiny confetti burst, no canvas/library: a handful of absolutely
 * positioned divs animated with the Web Animations API, self-removing.
 */
function spawnConfetti(originElement, count = 18) {
    const colors = ['#FF6FB5', '#FFC94D', '#16B8F3', '#27C281', '#8B3DFF', '#FF9640'];
    const rect = originElement.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        const size = 6 + Math.random() * 6;
        piece.style.position = 'absolute';
        piece.style.left = `${originX}px`;
        piece.style.top = `${originY}px`;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * 0.6}px`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = '2px';
        piece.style.willChange = 'transform, opacity';
        container.appendChild(piece);

        const angle = (Math.random() * Math.PI) - Math.PI / 2 - Math.PI / 2; // upward spread
        const distance = 60 + Math.random() * 90;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 40;
        const rotation = (Math.random() - 0.5) * 720;
        const duration = 700 + Math.random() * 400;

        const anim = piece.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy - 20}px) rotate(${rotation * 0.5}deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx * 1.3}px, ${dy + 140}px) rotate(${rotation}deg)`, opacity: 0 }
        ], { duration, easing: 'cubic-bezier(0.25, 0.6, 0.4, 1)' });

        anim.onfinish = () => piece.remove();
    }

    setTimeout(() => container.remove(), 1400);
}
