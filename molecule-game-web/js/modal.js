/**
 * How-to-play modal: opens on demand instead of cluttering the welcome
 * screen, so the hero (title + mascot + START) reads at a glance.
 */
document.addEventListener('DOMContentLoaded', () => {
    const openButton = document.getElementById('how-to-play-button');
    const overlay = document.getElementById('how-to-play-modal');
    if (!openButton || !overlay) return;

    const closeButton = document.getElementById('how-to-play-close');
    const gotItButton = document.getElementById('how-to-play-got-it');

    const open = () => {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    };

    const close = () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    };

    openButton.addEventListener('click', open);
    if (closeButton) closeButton.addEventListener('click', close);
    if (gotItButton) gotItButton.addEventListener('click', close);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('open')) close();
    });
});
