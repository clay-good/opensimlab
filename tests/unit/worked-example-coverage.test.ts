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
 * Neurology inherited that form and that guard, counted upward through fourteen
 * lessons, and has now made the same transition. Obstetrics inherited it in turn, counted
 * upward through fourteen lessons, and made the same transition. Respiratory
 * medicine carried it through fourteen lessons too and has now made the same
 * transition: it is a list entry, and the sentence calling it started is gone.
 * Pediatrics is the sixth module to make it, and the longest: its number was
 * rewritten fifteen times, from four through sixteen, before the sentence
 * calling it started could go.
 *
 * The part-finished form itself is not gone. The obstetrics and pediatrics
 * cases below still hold it, so the next module to start inherits a guard that
 * derives its number from the audit rather than trusting the front page.
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
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
  'twenty-three', 'twenty-four', 'twenty-five'] as const;

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

  it('covers every neurology lab', () => {
    expect(NEUROLOGY_SCENARIOS).toHaveLength(15);
    expect(uncovered(NEUROLOGY_SCENARIOS, 'neurology')).toEqual([]);
    // The part-finished sentence counted upward for fourteen lessons and is
    // now untrue, so the front page has to say this as a list rather than a
    // number — the same transition toxicology made.
    expect(coveredCount(NEUROLOGY_SCENARIOS, 'neurology')).toBe(NEUROLOGY_SCENARIOS.length);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).not.toContain('Neurology has started');
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

  it('covers every obstetrics lab', () => {
    expect(OBSTETRICS_SCENARIOS).toHaveLength(15);
    const covered = coveredCount(OBSTETRICS_SCENARIOS, 'obstetrics');
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    if (covered !== OBSTETRICS_SCENARIOS.length) {
      // The part-finished form, kept here for the next module to inherit.
      expect(readme).toContain(`with ${COUNT_WORDS[covered]} of its`);
      expect(readme).toContain(`${COUNT_WORDS[OBSTETRICS_SCENARIOS.length]} labs done.`);
      return;
    }
    // The part-finished sentence is not allowed to linger once it is untrue.
    expect(uncovered(OBSTETRICS_SCENARIOS, 'obstetrics')).toEqual([]);
    expect(readme).not.toContain('Obstetrics has');
  });

  it('counts the finished respiratory-medicine labs rather than trusting the sentence', () => {
    expect(RESPIRATORY_MEDICINE_SCENARIOS).toHaveLength(15);
    const covered = coveredCount(RESPIRATORY_MEDICINE_SCENARIOS, 'respiratory-medicine');
    expect(covered).toBeGreaterThan(0);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    if (covered === RESPIRATORY_MEDICINE_SCENARIOS.length) {
      // The part-finished sentence is not allowed to linger once it is untrue.
      expect(uncovered(RESPIRATORY_MEDICINE_SCENARIOS, 'respiratory-medicine')).toEqual([]);
      expect(readme).not.toContain('medicine has started');
      return;
    }
    expect(readme).toContain(`with ${COUNT_WORDS[covered]} of its`);
    expect(readme).toContain(`${COUNT_WORDS[RESPIRATORY_MEDICINE_SCENARIOS.length]} labs done.`);
  });

  it('counts the finished pediatrics labs rather than trusting the sentence', () => {
    expect(PEDIATRICS_SCENARIOS).toHaveLength(16);
    const covered = coveredCount(PEDIATRICS_SCENARIOS, 'pediatrics');
    expect(covered).toBeGreaterThan(0);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    if (covered === PEDIATRICS_SCENARIOS.length) {
      // The part-finished sentence is not allowed to linger once it is untrue.
      expect(uncovered(PEDIATRICS_SCENARIOS, 'pediatrics')).toEqual([]);
      expect(readme).not.toContain('Pediatrics has started');
      return;
    }
    expect(readme).toContain(`with ${COUNT_WORDS[covered]} of its`);
    expect(readme).toContain(`${COUNT_WORDS[PEDIATRICS_SCENARIOS.length]} labs done.`);
  });

  it('counts the finished cardiology labs rather than trusting the sentence', () => {
    expect(CARDIOLOGY_SCENARIOS).toHaveLength(17);
    const covered = coveredCount(CARDIOLOGY_SCENARIOS, 'cardiology');
    expect(covered).toBeGreaterThan(0);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    if (covered === CARDIOLOGY_SCENARIOS.length) {
      // The part-finished sentence is not allowed to linger once it is untrue.
      expect(uncovered(CARDIOLOGY_SCENARIOS, 'cardiology')).toEqual([]);
      expect(readme).not.toContain('Cardiology has started');
      return;
    }
    expect(readme).toContain(`with ${COUNT_WORDS[covered]} of its`);
    expect(readme).toContain(`${COUNT_WORDS[CARDIOLOGY_SCENARIOS.length]} labs done.`);
  });

  it('counts the finished critical-care labs rather than trusting the sentence', () => {
    expect(CRITICAL_CARE_SCENARIOS).toHaveLength(24);
    const covered = coveredCount(CRITICAL_CARE_SCENARIOS, 'critical-care');
    expect(covered).toBeGreaterThan(0);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    if (covered === CRITICAL_CARE_SCENARIOS.length) {
      // The part-finished sentence is not allowed to linger once it is untrue.
      expect(uncovered(CRITICAL_CARE_SCENARIOS, 'critical-care')).toEqual([]);
      expect(readme).not.toContain('Critical care has started');
      return;
    }
    expect(readme).toContain(`with ${COUNT_WORDS[covered]} of its`);
    expect(readme).toContain(`${COUNT_WORDS[CRITICAL_CARE_SCENARIOS.length]} labs done.`);
  });

  it('claims only what those twelve modules support', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Every renal, oncology, endocrine, nursing,');
    expect(readme).toContain('infectious-disease, neonatology, toxicology, neurology, obstetrics, respiratory-medicine,');
    expect(readme).toContain('pediatrics, and cardiology lab has both.');
    // The hedge this sentence used to carry belongs to a state the audit has
    // left behind. If it comes back, one of the three tests above is failing too.
    expect(readme).not.toContain('and most\nendocrine ones');
  });
});
