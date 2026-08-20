/**
 * The offer to take a newer build (platform/offline-pwa → Cache-First Service
 * Worker With Explicit Updates).
 *
 * The worker never swaps the application out from under a running session. The
 * consequence is that somebody has to ASK, and until this existed nobody did:
 * the event was dispatched and nothing listened, so a returning learner stayed
 * on the build they first cached and would report defects already fixed.
 *
 * It is a quiet, dismissible strip rather than a modal, because a learner in the
 * middle of an induction is not to be interrupted for this.
 */

import { useEffect, useState } from 'react';
import { Button } from '@platform/ui';
import { UPDATE_READY_EVENT, acceptUpdate } from './register';

export function UpdateNotice() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener(UPDATE_READY_EVENT, onReady);
    return () => window.removeEventListener(UPDATE_READY_EVENT, onReady);
  }, []);

  if (!ready || dismissed) return null;

  return (
    <div className="update-notice" role="status">
      <span>A newer version is ready.</span>
      <Button compact variant="primary" onClick={() => { void acceptUpdate(); }}>
        Reload to update
      </Button>
      <Button compact variant="ghost" onClick={() => setDismissed(true)}>Not now</Button>
    </div>
  );
}
