/**
 * @vitest-environment jsdom
 *
 * No surface shows a learner an internal identifier.
 *
 * The bronchospasm briefing listed four bullets that read
 * "no-shunt-or-dead-space-dynamics", "bolus-injection-is-instantaneous" and so
 * on, because it printed the ids the scenario stored rather than looking their
 * sentences up. It survived because the one scenario that stored prose instead
 * read fine, so whichever you looked at looked right.
 *
 * This sweeps every id the project defines against the text each surface
 * renders, so the next registry to be printed raw is caught by the build.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LIMITATIONS } from '@platform/docs/limitations';
import { SOURCES } from '@platform/docs/sources';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { SCENARIOS } from '@anesthesia/scenarios';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { DEFAULT_LIMITS } from '@platform/alarms/alarms';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';

/**
 * Every internal identifier the project defines.
 *
 * Scenario ids are excluded: they appear legitimately in URLs, and the unknown-
 * scenario page shows one deliberately because the reader is usually the person
 * who mistyped it.
 */
const IDENTIFIERS = new Set<string>([
  ...LIMITATIONS.map((limitation) => limitation.id),
  ...EXPLAINERS.map((explainer) => explainer.id),
  ...SOURCES.map((source) => source.id),
  ...FRAMEWORKS.flatMap((framework) => framework.domains.map((domain) => domain.id)),
  ...DEFAULT_LIMITS.map((limit) => limit.id),
]);

/**
 * The visible text of some markup, with attributes and URLs removed.
 *
 * An id inside an `href` or a `key` is correct; an id a reader can see is not.
 */
function visibleText(markup: string): string {
  return markup
    .replace(/<code[^>]*>[\s\S]*?<\/code>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Identifiers appearing as a standalone word in the visible text. */
function leaked(markup: string): string[] {
  const text = visibleText(markup);
  return [...IDENTIFIERS].filter((id) => new RegExp(`(^|\\s)${id}($|[\\s.,;:)])`).test(text));
}

describe('the scenario briefings', () => {
  it.each(SCENARIOS.map((scenario) => [scenario.metadata.id, scenario] as const))(
    '%s shows no identifiers',
    (_id, scenario) => {
      const markup = renderToStaticMarkup(createElement(Prebrief, {
        scenario,
        region: UNITED_STATES,
        onStart: () => {},
        guidance: 'coached' as const,
        onGuidance: () => {},
      }));
      expect(leaked(markup), 'these identifiers are visible to a learner').toEqual([]);
    },
  );

  it('still shows the limitations, rather than passing by showing nothing', () => {
    // The trap in a test like this: deleting the section makes it pass. Every
    // briefing has to still be saying something about what is not modelled.
    for (const scenario of SCENARIOS) {
      const markup = renderToStaticMarkup(createElement(Prebrief, {
        scenario, region: UNITED_STATES, onStart: () => {},
        guidance: 'coached' as const, onGuidance: () => {},
      }));
      const text = visibleText(markup);
      expect(text, scenario.metadata.id).toContain('does not model');
      // And the sentences are real ones, not one-word bullets.
      const section = text.slice(text.indexOf('does not model'));
      expect(section.split(' ').length).toBeGreaterThan(40);
    }
  });
});

describe('the identifier sweep itself', () => {
  it('is looking at a set worth sweeping', () => {
    // If the registries were empty this whole file would pass on nothing.
    expect(IDENTIFIERS.size).toBeGreaterThan(30);
    for (const id of IDENTIFIERS) expect(id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
  });

  it('catches an identifier when one is present', () => {
    const anId = LIMITATIONS[0]!.id;
    expect(leaked(`<p>Something about ${anId}.</p>`)).toContain(anId);
  });

  it('ignores an identifier used as a link target or inside code', () => {
    const anId = LIMITATIONS[0]!.id;
    expect(leaked(`<a href="/limitations#${anId}">Read this</a>`)).toEqual([]);
    expect(leaked(`<code>${anId}</code>`)).toEqual([]);
  });
});
