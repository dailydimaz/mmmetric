import { createRoot } from 'react-dom/client';
import { OverlayApp } from './OverlayApp';

declare global {
    interface Window {
        _mmOverlayActive: boolean;
    }
}

// Initialize the overlay
const initOverlay = () => {
    // Check if already initialized
    if (window._mmOverlayActive) return;
    window._mmOverlayActive = true;

    // Create container
    const container = document.createElement('div');
    container.id = 'mmmetric-overlay-root';
    document.body.appendChild(container);

    // Mount React app
    const root = createRoot(container);
    root.render(<OverlayApp />);
};

// Check for auto-init via URL param
const params = new URLSearchParams(window.location.search);
if (params.get('mm_overlay') === 'true' || params.get('mm_tracking_id')) {
    initOverlay();
}

// Expose init function
(window as any).mmmetricOverlay = { init: initOverlay };
