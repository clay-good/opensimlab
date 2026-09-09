import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getModule, availableModules, plannedModules } from '@platform/modules/registry';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';
import { reviewableItems } from '@platform/governance/records';
import { structuredDataFor } from '@platform/docs/structured-data';
import { SITE_BAR_LINKS } from '@platform/ui';
import { limitationsFor } from '@platform/docs/limitations';
import { requireSource } from '@platform/docs/sources';
import { READY_MODULE_COUNT } from '@landing/content';
import { ROUTES, routeFor } from '@routes/routes';
import { PrerenderedBody } from '@routes/Prerendered';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { moduleProse } from '@platform/modules/module-prose';
import { offersWorkedExample, WORKED_EXAMPLE_MODULE_IDS } from '@anesthesia/demo/worked-examples';
import {
  DEFAULT_SURGERY_TRAUMA_SCENARIO_ID, SURGERY_TRAUMA_SCENARIOS, getSurgeryTraumaScenario,
} from '../../src/modules/surgery-trauma/scenarios';

const id = 'negative-scan-a-scan-that-cannot-say-no';
const path = `/surgery-trauma/scenario/${id}`;
const scenario = SURGERY_TRAUMA_SCENARIOS[0]!;
const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const json = (file: string) => JSON.parse(read(file));

describe('Surgery and trauma module foundation', () => {
  it('opens the sixteenth module and leaves nothing declared but unbuilt', () => {
    expect(getModule('surgery-trauma')).toMatchObject({
      route: 'surgery-trauma', displayName: 'Surgery and trauma', status: 'available',
      timescale: { unit: 'seconds', stepSeconds: 0.1, speeds: [1, 2, 5, 60] },
    });
    expect(moduleProse('surgery-trauma').plannedScope).toContain('Ten bounded');
    // The prose must no longer read as an unbuilt module, because the route now runs one.
    expect(moduleProse('surgery-trauma').description).not.toBe('Planned.');
    expect(SURGERY_TRAUMA_SCENARIOS).toHaveLength(5);
    expect(DEFAULT_SURGERY_TRAUMA_SCENARIO_ID).toBe(id);
    expect(getSurgeryTraumaScenario(id)).toBe(scenario);
    expect(getSurgeryTraumaScenario('not-a-scenario')).toBeUndefined();
    expect(availableModules().map((entry) => entry.id)).toContain('surgery-trauma');
    expect(READY_MODULE_COUNT).toBe(16);
    // This was the last module the registry declared as planned. Nothing is now declared and
    // unbuilt, and the front door must not invent a roadmap to keep its planned sentence.
    expect(plannedModules()).toEqual([]);
  });

  it('validates against the shared scenario schema', () => {
    expect(validateScenario(scenario)).toEqual([]);
  });

  // A module is only reachable if every surface knows about it. Each of these has been a
  // separate omission in past module launches.
  it('is reachable from the nav, the routes, and the prerendered markup', () => {
    expect(SITE_BAR_LINKS.map((link) => link.href)).toContain('/surgery-trauma');
    expect(routeFor('/surgery-trauma')).toMatchObject({
      indexable: true, heading: 'Surgery and trauma simulator',
    });
    const route = routeFor(path)!;
    expect(route.indexable).toBe(true);
    expect(route.description.length).toBeGreaterThanOrEqual(110);
    expect(route.description.length).toBeLessThanOrEqual(160);
    expect(ROUTES.filter((entry) => entry.path.startsWith('/surgery-trauma'))).toHaveLength(6);
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
    expect(markup).toContain('a scan that cannot say no');
    const moduleMarkup = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/surgery-trauma' }));
    expect(moduleMarkup).toContain('Surgery and trauma simulator');
  });

  it('publishes structured data and its own catalog artifacts', () => {
    const data = structuredDataFor(['LearningResource'], path);
    expect(data.some((entry) => JSON.stringify(entry).includes(id))).toBe(true);
    for (const artifact of ['completion-audit', 'quality-audit', 'maturity']) {
      expect(PUBLIC_CATALOG_ARTIFACTS).toContain(`/catalog/surgery-trauma-${artifact}.json`);
    }
    const completion = json('public/catalog/surgery-trauma-completion-audit.json');
    expect(completion.scenarioCount).toBe(5);
    expect(completion.scenarios[0].scenarioId).toBe(id);
    expect(completion.scenarios[0].environment).toBe('ward');
    // The two report catalogs must stay byte-identical, or a report can resolve in one and not the other.
    expect(read('public/catalog/scenario-report-catalog.json'))
      .toBe(read('workers/reports/src/report-catalog.generated.json'));
  });

  it('enters the governance record under its own domain', () => {
    const item = reviewableItems().find((entry) => entry.id === id);
    expect(item).toMatchObject({ kind: 'scenario', domains: ['surgery-trauma'] });
    expect(item!.review.reviewer).toBe('UNSIGNED');
  });

  it('declares its limitations and resolves every cited source', () => {
    const limitations = limitationsFor(id);
    expect(limitations).toHaveLength(3);
    expect(limitations.map((entry) => entry.id))
      .toContain('negative-scan-single-centre-figures-are-not-a-decision-rule');
    for (const source of ['surgery-trauma-vital-signs-after-bowel-resection-2014',
      'surgery-trauma-false-negative-ct-colonic-2014',
      'surgery-trauma-delayed-reintervention-false-negative-ct-2017']) {
      expect(requireSource(source).verifiedOn).toBe('2026-09-09');
    }
  });

  it('claims a worked example for every lesson only because the product offers one', () => {
    const completion = json('public/catalog/surgery-trauma-completion-audit.json');
    for (const audited of completion.scenarios) {
      const requirement = audited.requirements
        .find((entry: { id: string }) => entry.id === 'guidance-and-demonstration');
      expect(requirement.status, `${audited.scenarioId} claims no example`).toBe('satisfied');
    }
    for (const entry of SURGERY_TRAUMA_SCENARIOS) {
      expect(offersWorkedExample(entry, 'surgery-trauma'), entry.metadata.id).toBe(true);
    }
    expect(WORKED_EXAMPLE_MODULE_IDS).toContain('surgery-trauma');
  });

  // The lessons are a deliberate alternation. Two of them teach holding a position while
  // nothing declares itself; two teach that the delay is the harm. A module that only ever
  // taught one of those would be teaching a reflex, so this asserts the sequence rather than
  // any single lesson.
  it('alternates a lesson about holding with a lesson about not waiting', () => {
    // A module that only ever taught "keep looking" would teach a learner to sit on a limb
    // that needed decompressing an hour ago, and a module that only ever taught "escalate now"
    // would teach the reverse reflex. The order is the teaching, so it is asserted.
    const [first, second, third, fourth, fifth] = SURGERY_TRAUMA_SCENARIOS;
    expect(first!.metadata.id).toBe('negative-scan-a-scan-that-cannot-say-no');
    expect(second!.metadata.id).toBe('rising-requirement-a-number-that-under-calls');
    expect(third!.metadata.id).toBe('unfinished-survey-a-patient-who-cannot-be-asked');
    expect(fourth!.metadata.id).toBe('transient-response-a-patient-who-will-not-stay-up');
    expect(fifth!.metadata.id).toBe('quiet-chest-an-injury-whose-severity-is-not-yet-visible');
    const ids = SURGERY_TRAUMA_SCENARIOS.flatMap((entry) => entry.metadata.objectives.map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('makes every scenario in the module reportable, not just the first', () => {
    const catalog = json('public/catalog/scenario-report-catalog.json');
    for (const entry of SURGERY_TRAUMA_SCENARIOS) {
      const record = catalog.scenarios.find((row: { scenarioId: string; contentVersion: string }) =>
        row.scenarioId === entry.metadata.id && row.contentVersion === entry.metadata.version);
      expect(record, `${entry.metadata.id} is missing from the report catalog at its current version`).toMatchObject({
        moduleId: 'surgery-trauma', contentVersion: entry.metadata.version, maturity: 'preview',
      });
    }
  });
});
