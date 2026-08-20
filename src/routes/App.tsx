/**
 * The application shell and router.
 *
 * A path router written here rather than pulled in as a dependency, because the
 * project holds a dependency ceiling and the route set is a dozen static paths.
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import '@platform/tokens/base.css';
import { Landing } from '@landing/Landing';
import { PlannedModuleRoute } from './PlannedModuleRoute';
import { MODULES } from '@platform/modules/registry';
import { routeFor } from './routes';

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

export function App() {
  const path = usePath();

  useEffect(() => {
    const metadata = routeFor(path);
    if (!metadata) return;
    document.title = metadata.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', metadata.description);
  }, [path]);

  if (path === '/') return <Landing />;
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

  return (
    <main className="reading" id="main">
      <h1>Nothing here</h1>
      <p>That address does not match a page.</p>
      <p><a href="/">Go to the Open Sim Lab front page</a></p>
    </main>
  );
}
