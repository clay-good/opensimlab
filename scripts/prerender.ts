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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { ROUTES, SITE_ORIGIN, canonicalUrl, indexableRoutes } from '../src/routes/routes.ts';
import { structuredDataFor } from '../src/platform/docs/structured-data.ts';
import { PrerenderedBody } from '../src/routes/Prerendered.tsx';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head(route: (typeof ROUTES)[number], styles: string): string {
  const canonical = canonicalUrl(route.path);
  const ogName = route.path === '/' ? 'index' : route.path.replace(/^\//, '').replace(/\//g, '-');
  const jsonLd = structuredDataFor(route.structuredData);
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    `<title>${escape(route.title)}</title>`,
    `<meta name="description" content="${escape(route.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    route.indexable ? '' : '<meta name="robots" content="noindex" />',
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
    `<meta property="og:image" content="${SITE_ORIGIN}/og/${ogName}.svg" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escape(route.title)}" />`,
    `<meta name="twitter:description" content="${escape(route.description)}" />`,
    `<meta name="twitter:image" content="${SITE_ORIGIN}/og/${ogName}.svg" />`,
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

  // The build date comes from the environment rather than a clock read, so a
  // rebuild of the same commit produces the same bytes.
  const lastModified = process.env.SOURCE_DATE ?? '2026-08-19';
  const indexable = indexableRoutes().map((route) => route.path);
  writeFileSync(join(dist, 'sitemap.xml'), sitemap(indexable, lastModified), 'utf8');

  const robots = [
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
  ].join('\n');
  writeFileSync(join(dist, 'robots.txt'), robots, 'utf8');

  // Stamp the service worker with a cache version and its precache manifest.
  const swPath = join(dist, 'sw.js');
  if (existsSync(swPath)) {
    const assets = [...shell.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
    const precache = ['/', '/index.html', '/manifest.webmanifest', ...new Set(assets)];
    const version = simpleHash(precache.join('|'));
    const sw = readFileSync(swPath, 'utf8')
      .replace('__CACHE_VERSION__', version)
      .replace("'__PRECACHE_MANIFEST__'", precache.map((asset) => JSON.stringify(asset)).join(', '));
    writeFileSync(swPath, sw, 'utf8');
  }

  process.stdout.write(
    `prerender: wrote ${ROUTES.length} routes, ${indexable.length} indexable, plus sitemap and robots\n`,
  );
}

/** A short stable hash, used as the cache version. */
function simpleHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();
