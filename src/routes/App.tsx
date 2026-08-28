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
import {
  ROOT_ROUTE, canonicalUrl, formatTitle, socialImageUrl, type RouteMetadata,
} from './site-metadata';
import { SiteBar } from '@platform/ui';
import { UpdateNotice, UpdateProvider } from '@platform/offline/UpdateNotice';
import { ErrorBoundary } from '@platform/ui/ErrorBoundary';

/**
 * The simulator, the gallery and the harness are loaded on demand. The landing
 * route is budgeted separately and must never pull the simulator bundle in, so
 * these three are behind a dynamic import rather than a static one.
 */
const AnesthesiaRoute = lazy(async () => ({ default: (await import('./modules/anesthesia')).AnesthesiaRoute }));
const EmergencyMedicineRoute = lazy(async () => ({ default: (await import('./modules/emergency-medicine')).EmergencyMedicineRoute }));
const CriticalCareRoute = lazy(async () => ({ default: (await import('./modules/critical-care')).CriticalCareRoute }));
const CardiologyRoute = lazy(async () => ({ default: (await import('./modules/cardiology')).CardiologyRoute }));
const RespiratoryMedicineRoute = lazy(async () => ({ default: (await import('./modules/respiratory-medicine')).RespiratoryMedicineRoute }));
const PediatricsRoute = lazy(async () => ({ default: (await import('./modules/pediatrics')).PediatricsRoute }));
const NeurologyRoute = lazy(async () => ({ default: (await import('./modules/neurology')).NeurologyRoute }));
const ToxicologyRoute = lazy(async () => ({ default: (await import('./modules/toxicology')).ToxicologyRoute }));
const ObstetricsRoute = lazy(async () => ({ default: (await import('./modules/obstetrics')).ObstetricsRoute }));
const NeonatologyRoute = lazy(async () => ({ default: (await import('./modules/neonatology')).NeonatologyRoute }));
const EndocrineMetabolicRoute = lazy(async () => ({ default: (await import('./modules/endocrine-metabolic')).EndocrineMetabolicRoute }));
const RenalElectrolyteRoute = lazy(async () => ({ default: (await import('./modules/renal-electrolyte')).RenalElectrolyteRoute }));
const InfectiousDiseaseRoute = lazy(async () => ({ default: (await import('./modules/infectious-disease')).InfectiousDiseaseRoute }));
const GalleryRoute = lazy(async () => ({ default: (await import('./GalleryRoute')).GalleryRoute }));
const FrameBudgetRoute = lazy(async () => ({ default: (await import('./FrameBudgetRoute')).FrameBudgetRoute }));
// The informational routes read the validation report and the governance records,
// which reach the pharmacology models. They load on demand for the same reason.
const DocumentRoute = lazy(async () => ({ default: (await import('./DocumentRoute')).DocumentRoute }));
// The educator surfaces. Loaded on demand: most visitors are learners.
const EducatorsRoute = lazy(async () => ({ default: (await import('./EducatorsRoute')).EducatorsRoute }));
const CurriculumRoute = lazy(async () => ({ default: (await import('./CurriculumRoute')).CurriculumRoute }));
const ReviewRoute = lazy(async () => ({ default: (await import('./ReviewRoute')).ReviewRoute }));
const ContentReviewRoute = lazy(async () => ({ default: (await import('./ContentReviewRoute')).ContentReviewRoute }));

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

function setHeadAttribute(
  selector: string,
  tagName: 'link' | 'meta',
  attribute: 'content' | 'href',
  value: string,
  identifyingAttributes: Readonly<Record<string, string>>,
) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement(tagName);
    for (const [name, identifyingValue] of Object.entries(identifyingAttributes)) {
      element.setAttribute(name, identifyingValue);
    }
    document.head.append(element);
  }
  element.setAttribute(attribute, value);
}

/** Keep client-side navigation as truthful as the route's prerendered head. */
export function updateDocumentMetadata(metadata: RouteMetadata) {
  const canonical = canonicalUrl(metadata.path);
  const image = socialImageUrl(metadata.path);
  document.title = metadata.title;
  setHeadAttribute('meta[name="description"]', 'meta', 'content', metadata.description, { name: 'description' });
  setHeadAttribute('link[rel="canonical"]', 'link', 'href', canonical, { rel: 'canonical' });
  setHeadAttribute('link[rel="alternate"][hreflang="en"]', 'link', 'href', canonical, {
    rel: 'alternate', hreflang: 'en',
  });
  setHeadAttribute('link[rel="alternate"][hreflang="x-default"]', 'link', 'href', canonical, {
    rel: 'alternate', hreflang: 'x-default',
  });
  const openGraph: readonly (readonly [string, string])[] = [
    ['og:title', metadata.title], ['og:description', metadata.description],
    ['og:url', canonical], ['og:image', image],
  ];
  for (const [property, value] of openGraph) {
    setHeadAttribute(`meta[property="${property}"]`, 'meta', 'content', value, { property });
  }
  const twitter: readonly (readonly [string, string])[] = [
    ['twitter:title', metadata.title], ['twitter:description', metadata.description],
    ['twitter:image', image],
  ];
  for (const [name, value] of twitter) {
    setHeadAttribute(`meta[name="${name}"]`, 'meta', 'content', value, { name });
  }
}

/**
 * The shell retains update availability across routes and the optional session
 * menu. Its in-flow page offer is hidden while the cockpit supplies that menu.
 */
export function App() {
  return (
    <UpdateProvider>
      <UpdateNotice />
      {/* Two boundaries, not one. A crash inside the simulator leaves the rest
          of the site reachable, and a crash anywhere still leaves a page. */}
      <ErrorBoundary surface="page">
        <CurrentRoute />
      </ErrorBoundary>
    </UpdateProvider>
  );
}

function CurrentRoute() {
  const path = usePath();

  useEffect(() => {
    // An unknown path gets the not-found title rather than keeping whatever the
    // previous page set. A tab reading "Routine induction" over a page that says
    // there is no such scenario is a small lie, and this site's whole argument
    // is that it does not tell those. The strings match the prerendered 404.
    if (path === '/') {
      updateDocumentMetadata(ROOT_ROUTE);
      return undefined;
    }
    let active = true;
    void import('./routes').then(({ routeFor }) => {
      if (!active) return;
      const metadata = routeFor(path) ?? {
        path: '/404',
        title: formatTitle('Page not found'),
        description: 'That address does not match a page on Open Sim Lab.',
        indexable: false,
        structuredData: [],
        heading: 'Nothing here',
      };
      updateDocumentMetadata(metadata);
    });
    return () => { active = false; };
  }, [path]);

  if (path === '/') return <Landing />;
  if (path === '/about') return <About />;
  if (path === '/anesthesia' || path.startsWith('/anesthesia/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><AnesthesiaRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/emergency-medicine' || path.startsWith('/emergency-medicine/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><EmergencyMedicineRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/critical-care' || path.startsWith('/critical-care/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><CriticalCareRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/cardiology' || path.startsWith('/cardiology/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><CardiologyRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/respiratory-medicine' || path.startsWith('/respiratory-medicine/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><RespiratoryMedicineRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/pediatrics' || path.startsWith('/pediatrics/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><PediatricsRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/neonatology' || path.startsWith('/neonatology/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><NeonatologyRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/endocrine-metabolic' || path.startsWith('/endocrine-metabolic/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><EndocrineMetabolicRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/neurology' || path.startsWith('/neurology/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><NeurologyRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/renal-electrolyte' || path.startsWith('/renal-electrolyte/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><RenalElectrolyteRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/infectious-disease' || path.startsWith('/infectious-disease/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><InfectiousDiseaseRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/toxicology' || path.startsWith('/toxicology/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><ToxicologyRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/obstetrics' || path.startsWith('/obstetrics/')) {
    return (
      <ErrorBoundary surface="simulator">
        <Suspense fallback={<Loading />}><ObstetricsRoute path={path} /></Suspense>
      </ErrorBoundary>
    );
  }
  if (path === '/for-educators') return <Suspense fallback={<Loading />}><EducatorsRoute /></Suspense>;
  if (path === '/curriculum') return <Suspense fallback={<Loading />}><CurriculumRoute /></Suspense>;
  if (path === '/review') return <Suspense fallback={<Loading />}><ReviewRoute /></Suspense>;
  if (path === '/content-review') return <Suspense fallback={<Loading />}><ContentReviewRoute /></Suspense>;
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
      <SiteBar />
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
