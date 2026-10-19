import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { FacilitatorGuideRoute } from '@routes/FacilitatorGuideRoute';
import { ROUTES, routeFor } from '@routes/routes';
import { socialImageUrl } from '@routes/site-metadata';
import { MODULES } from '@platform/modules/registry';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import {
  absentGuideSections, facilitatorGuide, GUIDE_TEMPLATES,
} from '@platform/facilitation/guide';
import {
  FACILITATED_SCENARIOS, facilitatedScenarioFor, facilitatorGuidePath,
} from '@platform/facilitation/scenario-catalog';

const ORDER = ['at-a-glance', 'objectives', 'frameworks', 'patient', 'prebrief', 'timeline',
  'expected-actions', 'error-and-recovery', 'debrief', 'pause-points', 'limitations', 'sources',
  'provenance'];

describe('facilitator guide', () => {
  it('covers every scenario in every available module exactly once', () => {
    const declared = MODULES.filter((module) => module.status === 'available')
      .reduce((total, module) => total + module.scenarioCount, 0);
    expect(FACILITATED_SCENARIOS).toHaveLength(declared);
    const paths = FACILITATED_SCENARIOS.map((entry) =>
      facilitatorGuidePath(entry.moduleRoute, entry.scenario.metadata.id));
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) {
      expect(routeFor(path)).toMatchObject({ indexable: false });
      expect(facilitatedScenarioFor(path)).toBeDefined();
    }
  });

  it('keeps the fixed section order and fills every section a scenario can fill', () => {
    for (const entry of FACILITATED_SCENARIOS) {
      const guide = facilitatorGuide(entry);
      expect(guide.map((section) => section.id)).toEqual(ORDER);
      for (const id of ['at-a-glance', 'objectives', 'patient', 'prebrief', 'timeline', 'debrief', 'sources', 'provenance']) {
        expect(guide.find((section) => section.id === id)?.status, `${entry.scenario.metadata.id} ${id}`)
          .toBe('present');
      }
    }
  });

  it('asks one analysis question per rubric row, in the scenario\'s own words', () => {
    for (const entry of FACILITATED_SCENARIOS) {
      const debrief = facilitatorGuide(entry).find((section) => section.id === 'debrief');
      if (debrief?.status !== 'present') throw new Error('debrief absent');
      const texts = debrief.items.map((item) => item.text);
      for (const row of entry.scenario.debrief.rubric) expect(texts).toContain(row.question);
      expect(texts[0]).toBe(GUIDE_TEMPLATES.reactions);
      expect(texts.at(-1)).toBe(GUIDE_TEMPLATES.summary);
    }
  });

  it('maps a mapped scenario to its framework domains with the disclaimer, and only then', () => {
    for (const entry of FACILITATED_SCENARIOS) {
      const section = facilitatorGuide(entry).find((candidate) => candidate.id === 'frameworks')!;
      const mapped = entry.moduleRoute === 'anesthesia'
        && SCENARIO_MAPPINGS.some((mapping) => mapping.scenarioId === entry.scenario.metadata.id);
      expect(section.status, entry.scenario.metadata.id).toBe(mapped ? 'present' : 'absent');
      if (section.status === 'present') expect(section.items.at(-1)?.text).toBe(MAPPING_DISCLAIMER);
    }
  });

  it('adds no clinical claim of its own', () => {
    for (const template of Object.values(GUIDE_TEMPLATES)) {
      expect(template).not.toMatch(/\d|\bmg\b|mmHg|\bdose|\bgive\b|\badminister|diagnos|\btreat|\bshould\b|\bmust\b/i);
    }
  });

  it('reports the same absent sections for every scenario until their fields exist', () => {
    const reported = new Set(FACILITATED_SCENARIOS.map((entry) => absentGuideSections(entry).join('|')));
    expect([...reported].every((ids) =>
      ['expected-actions', 'error-and-recovery', 'pause-points']
        .every((id) => ids.split('|').includes(id)))).toBe(true);
  });

  it('renders every section, absent ones as absent, with nothing collapsed', () => {
    const entry = FACILITATED_SCENARIOS[0]!;
    const path = facilitatorGuidePath(entry.moduleRoute, entry.scenario.metadata.id);
    const markup = renderToStaticMarkup(createElement(FacilitatorGuideRoute, { path }));
    expect(markup).toContain(entry.scenario.metadata.title);
    const main = /<main[\s\S]*<\/main>/.exec(markup)?.[0] ?? '';
    expect(main).not.toContain('<details');
    expect((markup.match(/class="guide__section/g) ?? []).length).toBe(ORDER.length);
    expect(markup).toContain('Not available: The scenario format does not declare pause points');
    for (const objective of entry.scenario.metadata.objectives) expect(markup).toContain(objective.measure.replace(/'/g, '&#x27;'));
  });

  it('answers an unknown guide address honestly', () => {
    const markup = renderToStaticMarkup(createElement(FacilitatorGuideRoute,
      { path: '/facilitator/anesthesia/scenario/no-such-scenario' }));
    expect(markup).toContain('No such facilitator guide');
  });

  it('shares its briefing preview image instead of adding one', () => {
    const guide = ROUTES.find((route) => route.path.startsWith('/facilitator/'))!;
    expect(socialImageUrl(guide.path)).toBe(socialImageUrl(guide.path.replace(/^\/facilitator/, '')));
  });
});
