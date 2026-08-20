/**
 * The application shell and router.
 *
 * A path router written here rather than pulled in as a dependency, because the
 * project holds a dependency ceiling and the route set is a dozen static paths.
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import '@platform/tokens/base.css';
import { Landing } from '@landing/Landing';
import { About } from '@landing/About';
import { PlannedModuleRoute } from './PlannedModuleRoute';
import { MODULES } from '@platform/modules/registry';
import { routeFor } from './routes';
import { UpdateNotice } from '@platform/offline/UpdateNotice';

/**
 * The simulator, the gallery and the harness are loaded on demand. The landing
 * route is budgeted separately and must never pull the simulator bundle in, so
 * these three are behind a dynamic import rather than a static one.
 */
const AnesthesiaRoute = lazy(async () => ({ default: (await import('./AnesthesiaRoute')).AnesthesiaRoute }));
const GalleryRoute = lazy(async () => ({ default: (await import('./GalleryRoute')).GalleryRoute }));
const FrameBudgetRoute = lazy(async () => ({ default: (await import('./FrameBudgetRoute')).FrameBudgetRoute }));
// The informational routes read the validation report and the governance records,
// which reach the pharmacology models. They load on demand for the same reason.
const DocumentRoute = lazy(async () => ({ default: (await import('./DocumentRoute')).DocumentRoute }));

function Loading() {
  return <div className="loading-state" role="status" aria-live="polite">Loading…</div>;
}

function usePath(): string {
  const [path, setPath] = useState(() => (typeof location === 'undefined' ? '/' : location.pathname));
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path.replace(/\/+$/, '') || '/';
}

/**
 * The shell. The update offer rides above the router rather than inside each
 * branch, because a learner may be anywhere when a new build lands.
 */
export function App() {
  return (
    <>
      <UpdateNotice />
      <CurrentRoute />
    </>
  );
}

function CurrentRoute() {
  const path = usePath();

  useEffect(() => {
    const metadata = routeFor(path);
    if (!metadata) return;
    document.title = metadata.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', metadata.description);
  }, [path]);

  if (path === '/') return <Landing />;
  if (path === '/about') return <About />;
  if (path === '/anesthesia' || path.startsWith('/anesthesia/')) {
    return <Suspense fallback={<Loading />}><AnesthesiaRoute path={path} /></Suspense>;
  }
  if (path === '/gallery') return <Suspense fallback={<Loading />}><GalleryRoute /></Suspense>;
  if (path === '/frame-budget') return <Suspense fallback={<Loading />}><FrameBudgetRoute /></Suspense>;
  if (['/validation', '/governance', '/limitations', '/privacy'].includes(path)) {
    return <Suspense fallback={<Loading />}><DocumentRoute path={path} /></Suspense>;
  }

  const planned = MODULES.find((module) => `/${module.route}` === path && module.status === 'planned');
  if (planned) return <PlannedModuleRoute module={planned} />;

  // The client-side not-found view. It has to match the prerendered 404
  // document, because this is the one a visitor actually sees once the script
  // has run — the static one is what a crawler and a scripting-disabled browser
  // get, and the two saying different things would be its own small lie.
  return (
    <div className="document">
      <header className="document__bar">
        <a className="document__home" href="/">Open Sim Lab</a>
      </header>
      <main className="reading" id="main">
        <h1>Nothing here</h1>
        <p>
          That address does not match a page. Nothing has been lost — this site is a handful of
          pages, and they are all listed below.
        </p>
        <h2>Where you probably wanted to go</h2>
        <ul>
          <li><a href="/anesthesia">The anesthesia simulator</a> — every scenario</li>
          <li><a href="/about">About Open Sim Lab</a> — what it teaches and who it is for</li>
          <li><a href="/validation">The validation report</a> — how closely the patient matches the evidence</li>
          <li><a href="/governance">Clinical governance</a> — who has reviewed what, and what is outstanding</li>
          <li><a href="/limitations">The limitations register</a> — what this deliberately does not model</li>
          <li><a href="/privacy">Privacy</a> — what is stored on your device, which is all of it</li>
        </ul>
      </main>
      <footer className="document__foot">
        <a href="/">Back to the front page</a>
        <a href="/anesthesia">Open the simulator</a>
      </footer>
    </div>
  );
}
