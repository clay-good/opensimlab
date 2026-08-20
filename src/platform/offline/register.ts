/**
 * Service worker registration (platform/offline-pwa, platform/discoverability →
 * The service worker never serves stale metadata to a crawler).
 *
 * The worker is NOT registered for a crawler user agent, so a crawler always
 * receives the current build's HTML from the network.
 *
 * If activation fails twice in a row the registration is removed and the
 * application falls back to direct network loading with a diagnostic the learner
 * can report, so a broken worker can always be escaped.
 */

/**
 * Announced when a newer build has finished installing and is waiting.
 *
 * The service worker is deliberately cache-first with EXPLICIT update
 * acceptance, so a new version never interrupts a running session. That is only
 * defensible if something actually offers the update: an event nobody listens to
 * leaves a learner on the build they first cached, forever, reporting defects
 * that were fixed weeks ago.
 */
export const UPDATE_READY_EVENT = 'opensimlab:update-ready';

const FAILURE_KEY = 'opensimlab.service-worker-failures';
const MAX_FAILURES = 2;

/** User agents that identify a crawler. The worker is not registered for these. */
const CRAWLER_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|slackbot|vkshare|w3c_validator|whatsapp|telegrambot|discordbot|twitterbot|googlebot|applebot|duckduckbot|baiduspider|yandex/i;

export function isCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERN.test(userAgent);
}

function failureCount(): number {
  try { return Number(localStorage.getItem(FAILURE_KEY) ?? '0'); } catch { return 0; }
}

function setFailureCount(value: number): void {
  try { localStorage.setItem(FAILURE_KEY, String(value)); } catch { /* nothing to do */ }
}

export interface RegistrationOutcome {
  readonly registered: boolean;
  readonly reason: string;
}

export function registerServiceWorker(): RegistrationOutcome {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { registered: false, reason: 'This browser has no service worker support.' };
  }
  // Never in development.
  //
  // `sw.js` is served from `public/` unprocessed, so in a dev server its
  // CACHE_VERSION is still the literal `__CACHE_VERSION__` placeholder — one
  // cache name that never changes, serving whatever it captured first, forever.
  // The result is a contributor editing a file, reloading, and seeing the build
  // from an hour ago with nothing to indicate why. Any existing registration is
  // torn down too, because the developer who already has one is exactly the
  // person stuck.
  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    void caches.keys().then((names) => {
      for (const name of names) if (name.startsWith('opensimlab-')) void caches.delete(name);
    });
    return {
      registered: false,
      reason: 'Not registered in development, where the cache version is an unreplaced '
        + 'placeholder and would serve a stale build indefinitely.',
    };
  }
  if (isCrawler(navigator.userAgent)) {
    return {
      registered: false,
      reason: 'Not registered for a crawler, so a crawler always receives the current build\'s HTML.',
    };
  }
  if (failureCount() >= MAX_FAILURES) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    return {
      registered: false,
      reason: `The service worker failed to activate ${MAX_FAILURES} times in a row, so it has been `
        + 'unregistered and the application is loading directly from the network. Please report '
        + 'this with your browser and version.',
    };
  }

  void navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((registration) => {
      setFailureCount(0);
      // A version that finished installing BEFORE this page loaded is already
      // waiting, and no `updatefound` will fire for it. Without this check a
      // learner who reloaded once mid-update would sit on the old build with
      // nothing ever offering them the new one.
      if (registration.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new CustomEvent(UPDATE_READY_EVENT));
      }
      // A new version found while a session is running never interrupts it.
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent(UPDATE_READY_EVENT));
          }
        });
      });
    })
    .catch(() => setFailureCount(failureCount() + 1));

  return { registered: true, reason: 'Registered; assets will be served cache-first.' };
}

/** Accept a pending update. Called only when the learner chooses to. */
export async function acceptUpdate(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.waiting?.postMessage({ type: 'skip-waiting' });
  location.reload();
}
