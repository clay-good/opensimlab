/**
 * Every explainer's "show me" resolves (knowledge-layer → catalog gate:
 * dangling "show me"). A link that opens nothing, or opens the sandbox on a
 * state it refuses, is worse than no link: it promises a demonstration and
 * delivers an error page.
 */
import { describe, expect, it } from 'vitest';
import { EXPLAINERS } from '@anesthesia/content/explainers';
import { SCENARIOS } from '@anesthesia/scenarios';
import { parseSandboxQuery, sandboxCatalogue } from '@anesthesia/sandbox/pharmacology-sandbox';
import { parsePhysiologyQuery } from '@anesthesia/sandbox/physiology-sandbox';
import { parseCirculationQuery } from '@anesthesia/sandbox/circulation-sandbox';

const catalogue = sandboxCatalogue(SCENARIOS);
const parse = (query: string) => {
  const view = new URLSearchParams(query).get('view');
  return view === 'physiology' ? parsePhysiologyQuery(query)
    : view === 'circulation' ? parseCirculationQuery(SCENARIOS, query)
      : parseSandboxQuery(catalogue, query);
};

describe('every explainer\'s "show me" resolves', () => {
  it.each(EXPLAINERS.map((explainer) => [explainer.id, explainer] as const))('%s', (_, explainer) => {
    expect(SCENARIOS.some((scenario) => scenario.metadata.id === explainer.showMe.scenarioId)).toBe(true);
    if (explainer.showMe.sandbox !== undefined) expect(parse(explainer.showMe.sandbox)).toHaveProperty('state');
  });

  it('gives each sandbox view an explainer to point back to', () => {
    const views = new Set(EXPLAINERS.flatMap((explainer) => explainer.showMe.sandbox === undefined ? []
      : [new URLSearchParams(explainer.showMe.sandbox).get('view') ?? 'pharmacology']));
    expect([...views].sort()).toEqual(['circulation', 'pharmacology', 'physiology']);
  });
});
