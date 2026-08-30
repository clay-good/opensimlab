/**
 * The README says which modules ship a worked example and a private tutor.
 *
 * A claim about the product in the front-page documentation is exactly the kind
 * that rots quietly, so it is derived here from the same audit the build uses
 * rather than trusted. I got it wrong once already: the first draft of that
 * sentence said every endocrine lab had both, and two of the twelve do not.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';

function uncovered(scenarios: Parameters<typeof buildModuleCompletionCatalog>[0], moduleId: string) {
  const catalog = buildModuleCompletionCatalog(scenarios, ENGINE_VERSION, moduleId, 'ward');
  return catalog.scenarios
    .filter((scenario) => scenario.requirements.some(
      (entry) => entry.id === 'guidance-and-demonstration' && entry.status !== 'satisfied',
    ))
    .map((scenario) => scenario.scenarioId);
}

describe('Requirement: The Worked-Example Claim Matches The Audit', () => {
  it('covers every oncology lab', () => {
    expect(ONCOLOGY_SCENARIOS).toHaveLength(11);
    expect(uncovered(ONCOLOGY_SCENARIOS, 'oncology')).toEqual([]);
  });

  it('covers every renal and electrolyte lab', () => {
    expect(RENAL_ELECTROLYTE_SCENARIOS).toHaveLength(6);
    expect(uncovered(RENAL_ELECTROLYTE_SCENARIOS, 'renal-electrolyte')).toEqual([]);
  });

  it('claims only what those two modules support', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Every renal and oncology lab has both, and most');
    // The stronger claim is the one that was wrong, so it must not come back
    // without the two endocrine lessons being given observed state first.
    expect(readme).not.toContain('Every renal, endocrine and oncology lab has both');
  });
});
