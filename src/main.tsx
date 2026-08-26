/**
 * The application entry point.
 *
 * A static simulator build. Ordinary practice stays local; the reporting
 * package alone may lazy-load Turnstile after the learner opens its dialog.
 */

import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from '@routes/App';
import { registerServiceWorker } from '@platform/offline/register';

const root = document.getElementById('root');
if (!root) throw new Error('The root element is missing from the document.');

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Every indexable route is prerendered, so a crawler and a scripting-disabled
 * browser get real content. On the client, the LANDING route hydrates that markup
 * in place — it is the route with its own 1.2 s budget, and hydrating is what
 * keeps its layout shift at zero.
 *
 * The other routes deliberately render something different from their prerendered
 * markup: the simulator shows the acknowledgement gate, the informational routes
 * render generated tables. Hydrating a deliberate difference is a mismatch, and
 * React is right to complain about it, so those mount fresh instead.
 */
/** Routes whose prerendered markup is the same tree the client renders. */
const HYDRATABLE = new Set(['', '/about', '/for-educators', '/curriculum', '/validation', '/governance', '/limitations', '/privacy', '/cardiology', '/respiratory-medicine', '/pediatrics', '/neurology', '/oncology', '/critical-care']);
const path = window.location.pathname.replace(/\/+$/, '');
if (root.dataset.prerendered === 'true' && HYDRATABLE.has(path)) hydrateRoot(root, tree);
else createRoot(root).render(tree);

registerServiceWorker();
