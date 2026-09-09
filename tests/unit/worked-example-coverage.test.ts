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
 * Critical care is the seventh and largest: twenty-four labs, its number
 * rewritten twenty-three times before the sentence calling it started could go.
 *
 * Emergency medicine is the eighth and now the largest: twenty-five labs, its
 * number rewritten twenty-four times.
 *
 * Anesthesia then started, which is what the not-started claim was written to
 * break on, and it did. There is no module left to name as unstarted, so that
 * assertion is gone and anesthesia has inherited the part-finished form instead:
 * thirty-nine labs, the longest count this file has ever had to carry, derived
 * from the audit like every one before it.
 *
 * Anesthesia has now finished too: thirty-nine of thirty-nine, its number
 * rewritten thirty-eight times before the sentence calling it started could go.
 * It was the last module the front page described as part-finished, so that
 * form now has no holder at all — the branches keeping it are left in place
 * against the next module rather than deleted, but every one of them currently
 * takes its completed path.
 *
 * The sentence itself has changed shape as a result. It used to name fourteen
 * complete modules and leave anesthesia to a count; it now claims all fifteen,
 * which is a stronger claim than this file has ever allowed, and it stays
 * allowed only while every test above agrees.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../../src/modules/surgery-trauma/scenarios';
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
import { SCENARIOS as ANESTHESIA_SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';

// Out to thirty-nine, which is the anesthesia module's size and the longest
// count the front page has ever had to spell.
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
  'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven',
  'twenty-eight', 'twenty-nine', 'thirty', 'thirty-one', 'thirty-two',
  'thirty-three', 'thirty-four', 'thirty-five', 'thirty-six', 'thirty-seven',
  'thirty-eight', 'thirty-nine'] as const;

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
      // Named in full: the bare 'medicine has started' also matched the sentence
      // emergency medicine earned when it started, which is a different module.
      expect(readme).not.toContain('Respiratory medicine has started');
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

  it('covers every critical-care lab', () => {
    expect(CRITICAL_CARE_SCENARIOS).toHaveLength(24);
    expect(uncovered(CRITICAL_CARE_SCENARIOS, 'critical-care')).toEqual([]);
    // Critical care counted upward through twenty-three lessons and is the
    // seventh module to make the transition, so the front page says it as a list
    // entry and the part-finished sentence must be gone rather than stale.
    expect(coveredCount(CRITICAL_CARE_SCENARIOS, 'critical-care')).toBe(CRITICAL_CARE_SCENARIOS.length);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).not.toContain('Critical care has started');
    expect(readme).not.toContain('of its twenty-four labs done');
  });

  it('covers every emergency-medicine lab', () => {
    expect(EMERGENCY_MEDICINE_SCENARIOS).toHaveLength(25);
    expect(uncovered(EMERGENCY_MEDICINE_SCENARIOS, 'emergency-medicine')).toEqual([]);
    // Emergency medicine counted upward through twenty-four lessons and is the
    // eighth module to make the transition, so the front page says it as a list
    // entry and the part-finished sentence must be gone rather than stale.
    expect(coveredCount(EMERGENCY_MEDICINE_SCENARIOS, 'emergency-medicine')).toBe(EMERGENCY_MEDICINE_SCENARIOS.length);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).not.toContain('Emergency medicine has started');
    expect(readme).not.toContain('of its twenty-five labs done');
  });

  it('counts the finished anesthesia labs rather than trusting the sentence', () => {
    expect(ANESTHESIA_SCENARIOS).toHaveLength(39);
    const covered = coveredCount(ANESTHESIA_SCENARIOS, 'anesthesia');
    expect(covered).toBeGreaterThan(0);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    if (covered === ANESTHESIA_SCENARIOS.length) {
      // The part-finished sentence is not allowed to linger once it is untrue.
      expect(uncovered(ANESTHESIA_SCENARIOS, 'anesthesia')).toEqual([]);
      expect(readme).not.toContain('Anesthesia has\nstarted');
      return;
    }
    // The claim that no module had started is gone, and cannot come back while
    // this passes: anesthesia was the last one it could have named.
    expect(readme).not.toContain('has not started');
    expect(readme).toContain(`with ${COUNT_WORDS[covered]} of its`);
    expect(readme).toContain(`${COUNT_WORDS[ANESTHESIA_SCENARIOS.length]} labs done.`);
  });

  it('claims only what all fifteen modules support', () => {
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    // Every module named in the sentence, checked against the audit rather than
    // against the sentence. The claim is now that all fifteen are complete, so
    // each of these has to be fully covered for the front page to be honest.
    const modules: readonly [Parameters<typeof uncovered>[0], string][] = [
      [ONCOLOGY_SCENARIOS, 'oncology'],
      [RENAL_ELECTROLYTE_SCENARIOS, 'renal-electrolyte'],
      [ENDOCRINE_METABOLIC_SCENARIOS, 'endocrine-metabolic'],
      [MEDICAL_SURGICAL_NURSING_SCENARIOS, 'medical-surgical-nursing'],
      [INFECTIOUS_DISEASE_SCENARIOS, 'infectious-disease'],
      [NEONATOLOGY_SCENARIOS, 'neonatology'],
      [TOXICOLOGY_SCENARIOS, 'toxicology'],
      [NEUROLOGY_SCENARIOS, 'neurology'],
      [OBSTETRICS_SCENARIOS, 'obstetrics'],
      [RESPIRATORY_MEDICINE_SCENARIOS, 'respiratory-medicine'],
      [PEDIATRICS_SCENARIOS, 'pediatrics'],
      [CARDIOLOGY_SCENARIOS, 'cardiology'],
      [CRITICAL_CARE_SCENARIOS, 'critical-care'],
      [EMERGENCY_MEDICINE_SCENARIOS, 'emergency-medicine'],
      [ANESTHESIA_SCENARIOS, 'anesthesia'],
    ];
    expect(modules).toHaveLength(15);
    for (const [scenarios, moduleId] of modules) {
      expect(uncovered(scenarios, moduleId), moduleId).toEqual([]);
    }
    expect(readme).toContain('All sixteen specialties are complete on both counts');
    expect(readme).toContain('anesthesia, and surgery and trauma, whose seven labs are the newest.');
    // The hedge this sentence used to carry belongs to a state the audit has
    // left behind. If it comes back, one of the tests above is failing too.
    expect(readme).not.toContain('and most\nendocrine ones');
    // And the older fourteen-module form must not survive alongside the new one.
    expect(readme).not.toContain('and emergency-medicine lab has both.');
    // The sentence used to say all fifteen, before a sixteenth module opened without either. If
    // that older, now-overclaiming form comes back, this catches it.
    expect(readme).not.toContain('All fifteen specialties are now complete on both');
  });

  // The sixteenth module opened with neither a tutor nor a worked example, and the README
  // carried an exception sentence saying so. Both are now bound, so that sentence has to be
  // gone — and the hedge in front of it with it.
  it('covers the surgery and trauma lab, and drops the exception that described it', () => {
    expect(SURGERY_TRAUMA_SCENARIOS).toHaveLength(7);
    expect(uncovered(SURGERY_TRAUMA_SCENARIOS, 'surgery-trauma')).toEqual([]);
    expect(coveredCount(SURGERY_TRAUMA_SCENARIOS, 'surgery-trauma')).toBe(SURGERY_TRAUMA_SCENARIOS.length);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).not.toContain('exception is the one lab that opened surgery and trauma');
    expect(readme).not.toContain('Almost every lab also carries');
    expect(readme).toContain('Every lab also carries');
  });
});
