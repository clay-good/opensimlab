/**
 * Pseudo-locale layout check (interface-translation-first-wave → en-XA/en-XB).
 *
 * Starts the development server, where `?pseudo=` applies a test locale, and
 * loads pages that use externalised strings at a 320 px phone width. Under
 * en-XA (every string about 40% longer) and en-XB (right to left), the page
 * must not scroll horizontally, no element in the site bar or footer may cross
 * the viewport edge, and no raw `{placeholder}` may reach the screen. A real
 * browser is used because jsdom has no layout engine to measure any of this.
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 5299;
const PAGES = ['/governance', '/translation-status', '/verification-queue', '/privacy',
  '/validation', '/limitations', '/corrections', '/review-status',
  '/for-educators', '/curriculum', '/review',
  '/facilitator/anesthesia/scenario/persistent-vf-cardiac-arrest'];
const LOCALES = ['en-XA', 'en-XB'] as const;

/** Poll every 250 ms, up to `attempts` times, until the server answers. */
async function waitForServer(url: string, attempts: number): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`development server did not start at ${url}`);
}

async function main(): Promise<void> {
  // Its own process group, so stopping it also stops the vite process npx starts.
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  const failures: string[] = [];
  try {
    await waitForServer(`http://localhost:${PORT}/`, 240);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
    for (const locale of LOCALES) {
      for (const path of PAGES) {
        await page.goto(`http://localhost:${PORT}${path}?pseudo=${locale}`, { waitUntil: 'networkidle' });
        await page.locator('main h1').first().waitFor();
        const result = await page.evaluate((expectRtl) => {
          const browse = document.querySelector('details.document__browse');
          if (browse instanceof HTMLDetailsElement) browse.open = true;
          const overflowing = [...document.querySelectorAll('.document__bar *, .document__foot *')]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return box.width > 0 && (box.right > window.innerWidth + 1 || box.left < -1);
            })
            .map((element) => `${element.tagName.toLowerCase()} "${(element.textContent ?? '').trim().slice(0, 40)}"`);
          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            overflowing,
            rawPlaceholder: /\{[a-z][\w-]*\}/i.test(document.body.innerText),
            dirOk: (document.documentElement.dir === 'rtl') === expectRtl,
            stretched: (document.querySelector('.document__browse-toggle')?.textContent ?? '').startsWith('['),
          };
        }, locale === 'en-XB');
        const where = `${locale} ${path}`;
        if (result.scrollWidth > result.innerWidth) failures.push(`${where}: page scrolls sideways (${result.scrollWidth} > ${result.innerWidth})`);
        for (const element of result.overflowing) failures.push(`${where}: ${element} crosses the viewport edge`);
        if (result.rawPlaceholder) failures.push(`${where}: a raw {placeholder} reached the screen`);
        if (!result.dirOk) failures.push(`${where}: text direction was not applied`);
        if (locale === 'en-XA' && !result.stretched) failures.push(`${where}: the pseudo-locale was not applied`);
      }
    }
    await browser.close();
  } finally {
    try { if (server.pid !== undefined) process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
  }
  if (failures.length > 0) {
    process.stderr.write(`pseudo-layout: ${failures.length} problem(s)\n${failures.map((failure) => `  - ${failure}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`pseudo-layout: ${PAGES.length} pages clean under ${LOCALES.join(' and ')} at 320 px\n`);
}

void main();
