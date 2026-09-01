/**
 * The briefing has to offer the example, not merely have one.
 *
 * `tests/unit/worked-example-offer.test.ts` checks the list. This checks the
 * render: that a lesson with a worked example gets the control, under the
 * worked-example label rather than the scripted 90-second one.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { LIMITATIONS } from '@platform/docs/limitations';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { SCENARIOS as ANESTHESIA_SCENARIOS } from '@anesthesia/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';

const briefing = (scenario: Scenario, environment: 'oncology' | 'renal-electrolyte' | 'endocrine-metabolic' | 'medical-surgical-nursing' | 'anesthesia') =>
  renderToStaticMarkup(createElement(Prebrief, {
    limitations: LIMITATIONS, scenario, region: UNITED_STATES, environment,
    guidance: 'coached', onGuidance: () => {}, onStart: () => {}, onWatch: () => {},
  }));

describe('The worked-example control on the briefing', () => {
  it.each(ONCOLOGY_SCENARIOS.map((scenario) => [scenario.metadata.id, scenario] as const))(
    'offers it for the oncology lesson %s', (_id, scenario) => {
      const html = briefing(scenario, 'oncology');
      expect(html).toContain('Watch a worked example');
      expect(html).not.toContain('Watch a 90-second demonstration');
    });

  it('offers it for a renal and an endocrine lesson too', () => {
    expect(briefing(RENAL_ELECTROLYTE_SCENARIOS[0]!, 'renal-electrolyte')).toContain('Watch a worked example');
    expect(briefing(ENDOCRINE_METABOLIC_SCENARIOS[0]!, 'endocrine-metabolic')).toContain('Watch a worked example');
  });

  it('offers it for the nursing lessons that have one, and not the others', () => {
    // This module is still being written toward the standard, so the briefing has
    // to tell the two apart rather than offering a control that starts nothing.
    // Which is which comes from the completion audit, not from a list kept here.
    const audited = buildModuleCompletionCatalog(
      MEDICAL_SURGICAL_NURSING_SCENARIOS, ENGINE_VERSION, 'medical-surgical-nursing', 'ward',
    ).scenarios;
    const claims = new Set(audited.filter((scenario) => scenario.requirements.some(
      (entry) => entry.id === 'guidance-and-demonstration' && entry.status === 'satisfied',
    )).map((scenario) => scenario.scenarioId));
    expect(claims.size).toBeGreaterThan(0);
    expect(claims.size).toBeLessThan(MEDICAL_SURGICAL_NURSING_SCENARIOS.length);
    for (const scenario of MEDICAL_SURGICAL_NURSING_SCENARIOS) {
      const html = briefing(scenario, 'medical-surgical-nursing');
      expect(html.includes('Watch a worked example'), scenario.metadata.id)
        .toBe(claims.has(scenario.metadata.id));
    }
  });

  it('keeps the scripted label for the anesthesia demonstration', () => {
    const html = briefing(ANESTHESIA_SCENARIOS[0]!, 'anesthesia');
    expect(html).toContain('Watch a 90-second demonstration');
    expect(html).not.toContain('Watch a worked example');
  });
});
