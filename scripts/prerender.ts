/**
 * Prerender every indexable route to static HTML
 * (platform/discoverability → Every Indexable Route Is Prerendered Static HTML).
 *
 * A crawler, a browser with JavaScript disabled, and a link preview service all
 * receive meaningful markup without executing the application. No route returns an
 * empty application shell.
 *
 * It also generates the sitemap and the robots file, both asserted against the
 * prerendered route set rather than hand-maintained.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import {
  ROUTES, SITE_ORIGIN, canonicalUrl, formatTitle, indexableRoutes, socialImageUrl,
} from '../src/routes/routes.ts';
import { structuredDataFor } from '../src/platform/docs/structured-data.ts';
import { PUBLIC_CATALOG_ARTIFACTS } from '../src/platform/catalog/public-artifacts.ts';
import { PrerenderedBody } from '../src/routes/Prerendered.tsx';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

/**
 * Whether this build may be indexed by a search engine.
 *
 * OFF unless someone deliberately turns it on, because the default host is a
 * `workers.dev` subdomain while every canonical URL in this build names
 * `opensimlab.com`. A crawler that found the preview would follow those
 * canonicals to a domain that does not serve this yet, which is the worst
 * available outcome for indexing — worse than not being found at all.
 *
 * Set `SITE_INDEXABLE=true` when the custom domain is actually serving, and the
 * robots file, the sitemap reference and the header all come back on together.
 */
const INDEXABLE = process.env.SITE_INDEXABLE === 'true';

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head(route: (typeof ROUTES)[number], styles: string): string {
  const canonical = canonicalUrl(route.path);
  const jsonLd = structuredDataFor(route.structuredData, route.path);
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    `<title>${escape(route.title)}</title>`,
    `<meta name="description" content="${escape(route.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    route.indexable && INDEXABLE ? '' : '<meta name="robots" content="noindex, nofollow" />',
    '<meta name="theme-color" content="#06080B" />',
    '<link rel="manifest" href="/manifest.webmanifest" />',
    '<link rel="icon" href="/icon-192.svg" type="image/svg+xml" />',
    '<link rel="alternate" hreflang="en" href="' + canonical + '" />',
    '<link rel="alternate" hreflang="x-default" href="' + canonical + '" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Open Sim Lab" />',
    `<meta property="og:title" content="${escape(route.title)}" />`,
    `<meta property="og:description" content="${escape(route.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${socialImageUrl(route.path)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escape(route.title)}" />`,
    `<meta name="twitter:description" content="${escape(route.description)}" />`,
    `<meta name="twitter:image" content="${socialImageUrl(route.path)}" />`,
    ...jsonLd.map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`),
    styles,
    '</head>',
    '<body>',
  ].filter(Boolean).join('\n');
}

function sitemap(paths: readonly string[], lastModified: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => [
      '  <url>',
      `    <loc>${canonicalUrl(path)}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');
}

function main(): void {
  if (!existsSync(dist)) {
    process.stderr.write('prerender: no dist/ directory. Run `vite build` first.\n');
    process.exit(1);
  }

  // Read the built shell so the prerendered pages reference the same hashed assets.
  const shell = readFileSync(join(dist, 'index.html'), 'utf8');
  const scripts = [...shell.matchAll(/<script[^>]*><\/script>/g)].map((match) => match[0]).join('\n');
  const styles = [...shell.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map((match) => match[0]).join('\n');
  const preloads = [...shell.matchAll(/<link[^>]*rel="preload"[^>]*>/g)].map((match) => match[0]).join('\n');

  for (const route of ROUTES) {
    // `renderToString`, not `renderToStaticMarkup`: only the former emits the
    // separators React needs to hydrate adjacent text nodes. Static markup
    // hydrates with a text mismatch on any `{value}{' '}<a>` in the tree, which
    // is most of the prose on the landing page.
    const body = renderToString(createElement(PrerenderedBody, { path: route.path }));
    const html = [
      head(route, `${styles}\n${preloads}`),
      `<div id="root" data-prerendered="true">${body}</div>`,
      scripts,
      '</body>',
      '</html>',
      '',
    ].join('\n');

    const target = route.path === '/'
      ? join(dist, 'index.html')
      : join(dist, route.path.replace(/^\//, ''), 'index.html');
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, html, 'utf8');
  }

  // The 404 document. Every route here is real prerendered HTML rather than a
  // single-page application pretending to be many pages, so a wrong address is
  // told it is wrong instead of being served the shell.
  const notFound = [
    head({
      path: '/404',
      title: formatTitle('Page not found'),
      description: 'That address does not match a page on Open Sim Lab.',
      indexable: false,
      structuredData: [],
      heading: 'Nothing here',
    }, `${styles}\n${preloads}`),
    '<div id="root"><div class="document">'
    + '<header class="document__bar"><a class="document__home" href="/">Open Sim Lab</a></header>'
    + '<main class="reading" id="main">'
    + '<h1>Nothing here</h1>'
    + '<p>That address does not match a page. Nothing has been lost — this site is a '
    + 'handful of pages, and they are all listed below.</p>'
    + '<h2>Where you probably wanted to go</h2>'
    + '<ul>'
    + '<li><a href="/anesthesia">The anesthesia simulator</a> — every scenario</li>'
    + '<li><a href="/about">About Open Sim Lab</a> — what it teaches and who it is for</li>'
    + '<li><a href="/validation">The validation report</a> — how closely the patient matches the evidence</li>'
    + '<li><a href="/governance">Clinical governance</a> — who has reviewed what, and what is outstanding</li>'
    + '<li><a href="/limitations">The limitations register</a> — what this deliberately does not model</li>'
    + '<li><a href="/privacy">Privacy</a> — what is stored on your device, which is all of it</li>'
    + '</ul>'
    + '</main>'
    + '<footer class="document__foot"><a href="/">Back to the front page</a>'
    + '<a href="/anesthesia">Open the simulator</a></footer>'
    + '</div></div>',
    scripts,
    '</body>',
    '</html>',
    '',
  ].join('\n');
  writeFileSync(join(dist, '404.html'), notFound, 'utf8');

  // Response headers for the static host. A strict content security policy is
  // the mechanism behind the privacy claim. Turnstile is the sole foreign
  // script/frame and loads only after the report dialog opens.
  const headers = [
    '# Generated by `npm run prerender`. Do not edit.',
    '/*',
    ...(INDEXABLE ? [] : ['  X-Robots-Tag: noindex, nofollow']),
    "  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; "
    + "img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'; "
    + "base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
    '  Referrer-Policy: no-referrer',
    '  X-Content-Type-Options: nosniff',
    '  Cross-Origin-Opener-Policy: same-origin',
    '  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    '',
    '# Hashed assets are immutable; the HTML never is, so an update is seen.',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/sw.js',
    '  Cache-Control: no-cache',
    '',
  ].join('\n');
  writeFileSync(join(dist, '_headers'), headers, 'utf8');

  // CI may provide a reproducible source date. A local/deploy build otherwise
  // uses the day it was produced rather than leaving a stale hard-coded date in
  // every sitemap entry.
  const lastModified = process.env.SOURCE_DATE ?? new Date().toISOString().slice(0, 10);
  const indexable = indexableRoutes().map((route) => route.path);
  writeFileSync(join(dist, 'sitemap.xml'), sitemap(indexable, lastModified), 'utf8');

  const robots = INDEXABLE ? [
    '# Generated by `npm run prerender`. Do not edit.',
    'User-agent: *',
    'Allow: /',
    '# Transient per-learner states are meaningless to a stranger.',
    ...ROUTES.filter((route) => !route.indexable).map((route) => `Disallow: ${route.path}`),
    'Disallow: /anesthesia/session',
    'Disallow: /anesthesia/debrief',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n') : [
    '# Generated by `npm run prerender`. Do not edit.',
    '#',
    '# This build is NOT for indexing. It is served from a preview host while',
    '# every canonical URL in it names the production domain, so indexing it',
    '# would point a crawler at a domain that does not serve this yet.',
    '#',
    '# Rebuild with SITE_INDEXABLE=true once the custom domain is live.',
    'User-agent: *',
    'Disallow: /',
    '',
  ].join('\n');
  writeFileSync(join(dist, 'robots.txt'), robots, 'utf8');

  // Stamp the service worker with a cache version and its precache manifest.
  const swPath = join(dist, 'sw.js');
  if (existsSync(swPath)) {
    // EVERY built asset, not just the ones the shell references.
    //
    // Scanning the shell alone missed the lazily imported route chunks and the
    // solver worker, because by design they are not in the shell. The result was
    // a service worker that could serve the landing page offline and then fail
    // to start a simulation — while the front page said the thing works offline
    // "including every scenario". The runtime cache filled the gap only for a
    // learner who had already opened the simulator before losing the network,
    // which is exactly the learner who did not need it.
    //
    // The whole bundle remains within the enforced 8 MB budget, so
    // there is no reason to be clever about which parts of it to keep.
    const assets = readdirSync(join(dist, 'assets')).map((file) => `/assets/${file}`);
    const fontsDir = join(dist, 'fonts');
    const fonts = existsSync(fontsDir)
      ? readdirSync(fontsDir).map((file) => `/fonts/${file}`)
      : [];
    const icons = readdirSync(dist).filter((file) => file.startsWith('icon-'));
    // Every indexable route, so a briefing opens offline too.
    const documents = ROUTES.filter((route) => route.indexable).map((route) => route.path);
    const precache = [
      '/', '/index.html', '/manifest.webmanifest',
      ...icons.map((icon) => `/${icon}`),
      ...documents.filter((path) => path !== '/'),
      ...new Set(assets),
      ...fonts,
      ...PUBLIC_CATALOG_ARTIFACTS,
    ];
    const documentPaths = new Set(documents);
    const entries = precache.map((url) => {
      const path = url === '/' || url === '/index.html'
        ? join(dist, 'index.html')
        : documentPaths.has(url)
          ? join(dist, url.slice(1), 'index.html')
          : join(dist, url.slice(1));
      return { url, bytes: readFileSync(path) };
    });
    const template = readFileSync(join(root, 'public/sw.js'), 'utf8');
    const version = precacheVersion([...entries, { url: '/sw.js', bytes: Buffer.from(template) }]);
    const integrity = Object.fromEntries(entries.map(({ url, bytes }) => [url, `sha256-${createHash('sha256').update(bytes).digest('base64')}`]));
    const sw = template
      .replace('__CACHE_VERSION__', version)
      .replace('__PRECACHE_INTEGRITY__', JSON.stringify(integrity))
      .replace("'__PRECACHE_MANIFEST__'", precache.map((asset) => JSON.stringify(asset)).join(', '));
    writeFileSync(swPath, sw, 'utf8');
  }

  process.stdout.write(
    `prerender: wrote ${ROUTES.length} routes, ${indexable.length} indexable, plus sitemap and robots\n`
    + (INDEXABLE
      ? 'prerender: SITE_INDEXABLE=true — this build invites indexing.\n'
      : 'prerender: NOT INDEXABLE. robots.txt disallows everything and every page '
        + 'carries noindex. Rebuild with SITE_INDEXABLE=true once the custom domain is live.\n'),
  );
}

export function precacheVersion(
  entries: readonly { readonly url: string; readonly bytes: Uint8Array }[],
): string {
  return createHash('sha256').update(entries
    .map(({ url, bytes }) => `${url}:${Buffer.from(bytes).toString('base64')}`)
    .join('|')).digest('hex');
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();
