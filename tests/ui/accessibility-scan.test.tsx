/**
 * @vitest-environment jsdom
 *
 * The automated accessibility scan (platform/accessibility → Automated checks
 * gate the build).
 *
 * It renders every primary view and asserts zero serious or critical violations
 * against the rules that can be checked without a real layout engine: accessible
 * names, roles, labelled controls, heading order, unique landmarks, and the
 * focus behaviour the requirements name.
 *
 * The rules are implemented here rather than pulled in as a dependency, because
 * the project holds a dependency ceiling and the rule set it needs is small.
 * They are deliberately strict: a missing accessible name is a serious violation.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { PrerenderedBody } from '@routes/Prerendered';
import { GalleryRoute } from '@routes/GalleryRoute';
import { ROUTES } from '@routes/routes';

export type Impact = 'minor' | 'moderate' | 'serious' | 'critical';

export interface Violation {
  readonly rule: string;
  readonly impact: Impact;
  readonly element: string;
  readonly message: string;
}

const describeElement = (element: Element): string =>
  `<${element.tagName.toLowerCase()}${element.id ? ` id="${element.id}"` : ''}${
    element.className ? ` class="${String(element.className).slice(0, 40)}"` : ''}>`;

/** Whether an element has an accessible name from any of the permitted sources. */
function hasAccessibleName(element: Element): boolean {
  if (element.getAttribute('aria-label')?.trim()) return true;
  if (element.getAttribute('aria-labelledby')?.trim()) return true;
  if (element.getAttribute('title')?.trim()) return true;
  if ((element.textContent ?? '').trim().length > 0) return true;
  if (element.tagName === 'INPUT') {
    const id = element.getAttribute('id');
    if (id && element.ownerDocument.querySelector(`label[for="${id}"]`)) return true;
    if (element.closest('label')) return true;
  }
  if (element.tagName === 'IMG') return element.getAttribute('alt') !== null;
  return false;
}

export function scan(html: string): Violation[] {
  const parser = new DOMParser();
  const document_ = parser.parseFromString(`<!doctype html><html lang="en"><body>${html}</body></html>`, 'text/html');
  const violations: Violation[] = [];
  const add = (rule: string, impact: Impact, element: Element, message: string) =>
    violations.push({ rule, impact, element: describeElement(element), message });

  // Every interactive control must have an accessible name.
  for (const element of document_.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="switch"], [role="tab"], [role="spinbutton"]')) {
    if (!hasAccessibleName(element)) {
      add('control-has-name', 'critical', element, 'An interactive control has no accessible name.');
    }
  }

  // Images and canvases need a text alternative.
  for (const element of document_.querySelectorAll('img')) {
    if (element.getAttribute('alt') === null) {
      add('image-alt', 'critical', element, 'An image has no alt attribute.');
    }
  }
  for (const element of document_.querySelectorAll('canvas')) {
    const hidden = element.getAttribute('aria-hidden') === 'true';
    if (!hidden && !element.getAttribute('aria-label') && !element.getAttribute('role')) {
      add('canvas-alt', 'serious', element, 'A canvas has neither a role nor an accessible name nor aria-hidden.');
    }
  }

  // Heading order must not skip a level.
  const headings = [...document_.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (previousLevel !== 0 && level > previousLevel + 1) {
      add('heading-order', 'moderate', heading, `Heading jumps from h${previousLevel} to h${level}.`);
    }
    previousLevel = level;
  }

  // Exactly one h1, and at most one main landmark.
  const h1s = document_.querySelectorAll('h1');
  if (h1s.length > 1) add('single-h1', 'moderate', h1s[1]!, 'More than one h1 on the page.');
  const mains = document_.querySelectorAll('main, [role="main"]');
  if (mains.length > 1) add('single-main', 'serious', mains[1]!, 'More than one main landmark.');

  // A list must contain only list items.
  for (const list of document_.querySelectorAll('ul, ol')) {
    for (const child of list.children) {
      if (!['LI', 'SCRIPT', 'TEMPLATE'].includes(child.tagName)) {
        add('list-structure', 'serious', child, 'A list contains a non-list-item child.');
      }
    }
  }

  // A definition list's children must be dt, dd, or a wrapping div.
  for (const list of document_.querySelectorAll('dl')) {
    for (const child of list.children) {
      if (!['DT', 'DD', 'DIV', 'SCRIPT', 'TEMPLATE'].includes(child.tagName)) {
        add('dl-structure', 'serious', child, 'A definition list has an invalid child.');
      }
    }
  }

  // A positive tabindex forces an unnatural order.
  for (const element of document_.querySelectorAll('[tabindex]')) {
    if (Number(element.getAttribute('tabindex')) > 0) {
      add('tabindex-positive', 'serious', element, 'A positive tabindex overrides the natural focus order.');
    }
  }

  // A tab must reference the panel it controls.
  for (const tab of document_.querySelectorAll('[role="tab"]')) {
    if (!tab.getAttribute('aria-controls')) {
      add('tab-controls', 'serious', tab, 'A tab does not name the panel it controls.');
    }
    if (tab.getAttribute('aria-selected') === null) {
      add('tab-selected', 'serious', tab, 'A tab does not declare whether it is selected.');
    }
  }

  // A switch must declare its state.
  for (const element of document_.querySelectorAll('[role="switch"]')) {
    if (element.getAttribute('aria-checked') === null) {
      add('switch-state', 'critical', element, 'A switch does not declare its checked state.');
    }
  }

  return violations;
}

/** Every primary view, rendered to markup. */
function primaryViews(): { name: string; html: string }[] {
  const views = ROUTES.filter((route) => route.indexable).map((route) => ({
    name: route.path,
    html: renderToStaticMarkup(createElement(PrerenderedBody, { path: route.path })),
  }));
  views.push({ name: '/gallery', html: renderToStaticMarkup(createElement(GalleryRoute)) });
  return views;
}

describe('Requirement: WCAG 2.2 Level AA Conformance', () => {
  it('Scenario: Automated checks gate the build', () => {
    for (const view of primaryViews()) {
      const violations = scan(view.html);
      const blocking = violations.filter((entry) => entry.impact === 'serious' || entry.impact === 'critical');
      expect(
        blocking,
        `${view.name}: ${blocking.map((entry) => `${entry.rule} on ${entry.element}: ${entry.message}`).join('; ')}`,
      ).toHaveLength(0);
    }
  });

  it('reports lesser violations too, so they are visible rather than hidden', () => {
    const all = primaryViews().flatMap((view) => scan(view.html).map((entry) => ({ view: view.name, ...entry })));
    // This build has none at any level. The assertion exists so that a new one
    // has to be looked at rather than silently accepted.
    expect(all.map((entry) => `${entry.view} ${entry.rule}`)).toEqual([]);
  });

  it('detects a violation when one is introduced, so the scan is not vacuous', () => {
    expect(scan('<button></button>').map((entry) => entry.rule)).toContain('control-has-name');
    expect(scan('<img src="x.png">').map((entry) => entry.rule)).toContain('image-alt');
    expect(scan('<h1>a</h1><h3>b</h3>').map((entry) => entry.rule)).toContain('heading-order');
    expect(scan('<div tabindex="3">a</div>').map((entry) => entry.rule)).toContain('tabindex-positive');
    expect(scan('<canvas></canvas>').map((entry) => entry.rule)).toContain('canvas-alt');
    expect(scan('<ul><div>x</div></ul>').map((entry) => entry.rule)).toContain('list-structure');
  });
});

describe('Requirement: every indexable route has real content without scripting', () => {
  it('Scenario: Content exists without JavaScript', () => {
    for (const route of ROUTES.filter((entry) => entry.indexable)) {
      const html = renderToStaticMarkup(createElement(PrerenderedBody, { path: route.path }));
      // A heading structure, primary content, and links — not an empty shell.
      expect(html, `${route.path} has no heading`).toMatch(/<h1[^>]*>/);
      expect(html.length, `${route.path} is nearly empty`).toBeGreaterThan(400);
      expect(html, `${route.path} has no links`).toMatch(/<a [^>]*href=/);
      expect(html).not.toBe('<div id="root"></div>');
    }
  });

  it('carries the not-for-clinical-use statement on the pages that need it', () => {
    for (const path of [
      '/', '/anesthesia', '/anesthesia/scenario/routine-induction',
      '/emergency-medicine', '/emergency-medicine/scenario/undifferentiated-shock',
    ]) {
      const html = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
      expect(html, `${path} omits the statement`).toContain('educational simulator');
    }
  });
});
