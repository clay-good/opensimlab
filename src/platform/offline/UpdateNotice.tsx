/**
 * The offer to take a newer build (platform/offline-pwa → Cache-First Service
 * Worker With Explicit Updates).
 *
 * The worker never swaps the application out from under a running session. The
 * consequence is that somebody has to ASK, and until this existed nobody did:
 * the event was dispatched and nothing listened, so a returning learner stayed
 * on the build they first cached and would report defects already fixed.
 *
 * Outside practice it is a dismissible in-flow notice. During practice, the
 * existing More options gateway offers it without covering or moving controls.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@platform/ui';
import { UPDATE_READY_EVENT, UPDATE_FAILED_EVENT, acceptUpdate } from './register';

interface UpdateState {
  readonly ready: boolean;
  readonly dismissed: boolean;
  readonly failed: boolean;
  readonly accept: () => void;
  readonly dismiss: () => void;
}

const UpdateContext = createContext<UpdateState | null>(null);

/** Keep readiness and failure when the learner opens or closes More options. */
export function UpdateProvider({ children }: { readonly children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const onReady = () => { setReady(true); setFailed(false); };
    const onFailed = () => { setReady(true); setFailed(true); };
    window.addEventListener(UPDATE_READY_EVENT, onReady);
    window.addEventListener(UPDATE_FAILED_EVENT, onFailed);
    // Registration can announce an already waiting update before this effect
    // subscribes. Reconcile after subscribing without erasing a newer failure.
    if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        if (active && registration?.waiting && navigator.serviceWorker.controller) setReady(true);
      }).catch(() => {});
    }
    return () => {
      active = false;
      window.removeEventListener(UPDATE_READY_EVENT, onReady);
      window.removeEventListener(UPDATE_FAILED_EVENT, onFailed);
    };
  }, []);

  return (
    <UpdateContext.Provider value={{ ready, dismissed, failed,
      accept: () => { setFailed(false); void acceptUpdate(); },
      dismiss: () => setDismissed(true) }}>
      {children}
    </UpdateContext.Provider>
  );
}

/** Dismissing the nudge never removes the update from More options. */
export function useUpdateAvailable(): boolean {
  const update = useContext(UpdateContext);
  return Boolean(update?.ready && !update.dismissed);
}

export function UpdateNotice({ surface = 'page' }: { readonly surface?: 'page' | 'session' }) {
  const update = useContext(UpdateContext);
  if (!update?.ready || (surface === 'page' && update.dismissed)) return null;

  return (
    <div className={`update-notice update-notice--${surface}`}>
      <div className="update-notice__message">
        <p role="status">{update.failed ? 'Update could not be prepared. Your session is unchanged. Try again later.' : 'A newer version is ready.'}</p>
        {surface === 'session' && <p>Reloading ends this session and clears its unsaved progress.</p>}
      </div>
      <Button compact={surface === 'page'} variant="primary" onClick={update.accept}>
        Reload to update
      </Button>
      {surface === 'page' && <Button compact variant="ghost" onClick={update.dismiss}>Not now</Button>}
    </div>
  );
}
