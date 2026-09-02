/**
 * The README says which modules ship a worked example and a private tutor.
 *
 * A claim about the product in the front-page documentation is exactly the kind
 * that rots quietly, so it is derived here from the same audit the build uses
 * rather than trusted. It was wrong once already: an early draft said every
 * endocrine lab had both while two of the twelve did not, and this test is what
 * held the sentence back until they did. Both now do, so the stronger claim is
 * allowed — and it stays allowed only while the audit agrees. Neonatology joined
 * the sentence the same way: eleven of eleven, checked here rather than assumed.
 *
 * Toxicology was the first module the README described part-finished, as a
 * number spelled out in words rather than a list. That count was derived from
 * the audit here and matched against the sentence, so it could not survive a
 * lesson landing without being rewritten — which is what happened, five times,
 * until the fifteenth landed and the number had nowhere left to go. Toxicology
 * is now a list entry like the rest, checked the same way, and its
 * part-finished form is gone rather than left behind saying something stale.
 * Neurology has inherited that form and that guard: it is the module the front
 * page now describes as a number, derived here the same way, so the sentence
 * cannot outlive the count it quotes.
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
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';

function uncovered(scenarios: Parameters<typeof buildModuleCompletionCatalog>[0], moduleId: string) {
  const catalog = buildModuleCompletionCatalog(scenarios, ENGINE_VERSION, moduleId, 'ward');
  return catalog.scenarios
    .filter((scenario) => scenario.requirements.some(
      (entry) => entry.id === 'guidance-and-demonstration' && entry.status !== 'satisfied',
    ))
    .map((scenario) => scenario.scenarioId);
}

/** How many of a module's labs the audit says are finished, not how many exist. */
function coveredCount(scenarios: Parameters<typeof buildModuleCompletionCatalog>[0], moduleId: string) {
  const catalog = buildModuleCompletionCatalog(scenarios, ENGINE_VERSION, moduleId, 'ward');
  return catalog.scenarios.filter((scenario) => scenario.requirements.some(
    (entry) => entry.id === 'guidance-and-demonstration' && entry.status === 'satisfied',
  )).length;
}

const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'] as const;

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

  it('covers every infectious-disease lab', () => {
    expect(INFECTIOUS_DISEASE_SCENARIOS).toHaveLength(10);
    expect(uncovered(INFECTIOUS_DISEASE_SCENARIOS, 'infectious-disease')).toEqual([]);
  });

  it('covers every neonatology lab', () => {
    expect(NEONATOLOGY_SCENARIOS).toHaveLength(11);
    expect(uncovered(NEONATOLOGY_SCENARIOS, 'neonatology')).toEqual([]);
  });

  it('spells the part-finished neurology count the way the audit counts it', () => {
    const covered = coveredCount(NEUROLOGY_SCENARIOS, 'neurology');
    // Neurology is now the part-finished module, so the front page carries a
    // number rather than a list again. Both halves are derived, exactly as
    // toxicology's were, and the sentence cannot survive the next lesson
    // landing without being rewritten.
    expect(covered).toBeGreaterThan(0);
    expect(covered).toBeLessThan(NEUROLOGY_SCENARIOS.length);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain(`Neurology has started — ${COUNT_WORDS[covered]} of its\n`
      + `${COUNT_WORDS[NEUROLOGY_SCENARIOS.length]} ${covered === 1 ? 'is' : 'are'}`);
  });

  it('covers every toxicology lab', () => {
    expect(TOXICOLOGY_SCENARIOS).toHaveLength(15);
    expect(uncovered(TOXICOLOGY_SCENARIOS, 'toxicology')).toEqual([]);
    // The part-finished sentence is not allowed to linger once it is untrue.
    // It counted upward for five lessons; now that the count is the whole
    // module, the front page has to say so as a list rather than a number.
    expect(coveredCount(TOXICOLOGY_SCENARIOS, 'toxicology')).toBe(TOXICOLOGY_SCENARIOS.length);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).not.toContain('Toxicology has started');
  });

  it('claims only what those seven modules support', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Every renal, oncology, endocrine, nursing,');
    expect(readme).toContain('infectious-disease, neonatology, and toxicology lab has');
    // The hedge this sentence used to carry belongs to a state the audit has
    // left behind. If it comes back, one of the three tests above is failing too.
    expect(readme).not.toContain('and most\nendocrine ones');
  });
});
