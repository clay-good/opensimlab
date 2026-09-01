/**
 * The README says which modules ship a worked example and a private tutor.
 *
 * A claim about the product in the front-page documentation is exactly the kind
 * that rots quietly, so it is derived here from the same audit the build uses
 * rather than trusted. It was wrong once already: an early draft said every
 * endocrine lab had both while two of the twelve did not, and this test is what
 * held the sentence back until they did. Both now do, so the stronger claim is
 * allowed — and it stays allowed only while the audit agrees.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';

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

  it('covers every endocrine and metabolic lab', () => {
    expect(ENDOCRINE_METABOLIC_SCENARIOS).toHaveLength(12);
    expect(uncovered(ENDOCRINE_METABOLIC_SCENARIOS, 'endocrine-metabolic')).toEqual([]);
  });

  it('covers every medical-surgical nursing lab', () => {
    expect(MEDICAL_SURGICAL_NURSING_SCENARIOS).toHaveLength(9);
    expect(uncovered(MEDICAL_SURGICAL_NURSING_SCENARIOS, 'medical-surgical-nursing')).toEqual([]);
  });

  it('claims only what those four modules support', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Every renal, oncology, endocrine, and nursing lab has');
    // The hedge this sentence used to carry belongs to a state the audit has
    // left behind. If it comes back, one of the three tests above is failing too.
    expect(readme).not.toContain('and most\nendocrine ones');
  });
});
