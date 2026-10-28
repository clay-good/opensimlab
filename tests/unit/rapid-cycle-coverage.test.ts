/**
 * Every authored rapid-cycle point, held against the lesson that declares it.
 *
 * The format cannot catch the one mistake that matters most: an `actionType`
 * the lesson never sends. The engine drops an unknown action silently, so a
 * typo would leave a cycle that can only ever end in its directive, and no
 * test of the format would notice. The check here is behavioural instead — the
 * lesson's own expert reference path has to land the declared action inside the
 * declared window — so a point is only valid if the action a learner can
 * actually take closes it.
 */
import { describe, expect, it } from 'vitest';
import type { LearnerAction } from '@platform/kernel/protocol';
import type { Scenario } from '@anesthesia/scenarios/types';
import { isRecognitionObjective, validateScenario } from '@anesthesia/scenarios/schema';
import { rapidCycleMaturitySubjects, rapidCycleStatus } from '@anesthesia/catalog/rapid-cycle';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../../src/modules/surgery-trauma/scenarios';
import { PERSISTENT_VF_CARDIAC_ARREST_FIXTURES } from '../../src/modules/anesthesia/persistent-vf-cardiac-arrest-fixtures';
import { PERIOPERATIVE_ANAPHYLAXIS_FIXTURES } from '../../src/modules/anesthesia/perioperative-anaphylaxis-fixtures';
import { LAST_FIXTURES } from '../../src/modules/anesthesia/local-anesthetic-systemic-toxicity-fixtures';
import { PERSISTENT_VF_FIXTURES } from '../../src/modules/emergency-medicine/persistent-vf-arrest-fixtures';
import { PERSISTENT_VF_DISPATCH } from '../../src/modules/emergency-medicine/persistent-vf-arrest';
import { PEA_ARREST_FIXTURES } from '../../src/modules/emergency-medicine/pea-arrest-fixtures';
import { PEA_ARREST_DISPATCH } from '../../src/modules/emergency-medicine/pea-arrest';
import { LARYNGOSPASM_FIXTURES } from '../../src/modules/anesthesia/laryngospasm-after-airway-stimulation-fixtures';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_FIXTURES } from '../../src/modules/anesthesia/pneumothorax-under-positive-pressure-fixtures';
import { VENOUS_AIR_EMBOLISM_FIXTURES } from '../../src/modules/anesthesia/venous-air-embolism-fixtures';
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_FIXTURES } from '../../src/modules/anesthesia/high-spinal-after-epidural-top-up-fixtures';
import { BRONCHOSPASM_FIXTURES } from '../../src/modules/anesthesia/bronchospasm-fixtures';
import { OBSTRUCTIVE_PLEURAL_SHOCK_FIXTURES } from '../../src/modules/emergency-medicine/obstructive-shock-tension-pneumothorax-fixtures';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_FIXTURES } from '../../src/modules/anesthesia/arterial-pressure-transducer-artifact-fixtures';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_FIXTURES } from '../../src/modules/anesthesia/capnography-sampling-line-obstruction-fixtures';
import { BLOOD_BANK_HANDOFF_FIXTURES } from '../../src/modules/anesthesia/blood-bank-handoff-fixtures';

const ALL_SCENARIOS: readonly Scenario[] = [
  ...SCENARIOS, ...EMERGENCY_MEDICINE_SCENARIOS, ...CRITICAL_CARE_SCENARIOS, ...CARDIOLOGY_SCENARIOS,
  ...RESPIRATORY_MEDICINE_SCENARIOS, ...PEDIATRICS_SCENARIOS, ...NEUROLOGY_SCENARIOS,
  ...TOXICOLOGY_SCENARIOS, ...OBSTETRICS_SCENARIOS, ...NEONATOLOGY_SCENARIOS,
  ...ENDOCRINE_METABOLIC_SCENARIOS, ...RENAL_ELECTROLYTE_SCENARIOS, ...INFECTIOUS_DISEASE_SCENARIOS,
  ...MEDICAL_SURGICAL_NURSING_SCENARIOS, ...ONCOLOGY_SCENARIOS, ...SURGERY_TRAUMA_SCENARIOS,
];

type TimedAction = {
  readonly tick: number; readonly type: string;
  readonly payload?: Readonly<Record<string, unknown>>;
};

/** An emergency-medicine control list, resolved through the lesson's own dispatch map. */
const dispatched = (
  path: readonly (readonly [number, string])[],
  map: Readonly<Record<string, Omit<LearnerAction, 'tick'>>>,
): readonly TimedAction[] => path.map(([tick, control]) => ({ tick, ...map[control]! }));

/** Each lesson that declares a point, beside the reference path a learner is shown. */
const EXPERT_PATHS: Readonly<Record<string, readonly TimedAction[]>> = {
  'persistent-vf-cardiac-arrest': PERSISTENT_VF_CARDIAC_ARREST_FIXTURES.expert,
  'perioperative-anaphylaxis-after-antibiotic': PERIOPERATIVE_ANAPHYLAXIS_FIXTURES.expert,
  'local-anesthetic-systemic-toxicity': LAST_FIXTURES.expert,
  'persistent-vf-arrest': dispatched(PERSISTENT_VF_FIXTURES.expert, PERSISTENT_VF_DISPATCH),
  'pea-arrest': dispatched(PEA_ARREST_FIXTURES.expert, PEA_ARREST_DISPATCH),
  'laryngospasm-after-airway-stimulation': LARYNGOSPASM_FIXTURES.expert,
  'pneumothorax-under-positive-pressure': PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_FIXTURES.expert,
  'venous-air-embolism-during-line-removal': VENOUS_AIR_EMBOLISM_FIXTURES.expert,
  'high-spinal-after-epidural-top-up': HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_FIXTURES.expert,
  bronchospasm: BRONCHOSPASM_FIXTURES.expert,
  'arterial-pressure-transducer-artifact': ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_FIXTURES.expert,
  'capnography-sampling-line-obstruction': CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_FIXTURES.expert,
  'blood-bank-handoff': BLOOD_BANK_HANDOFF_FIXTURES.expert,
  'obstructive-shock-tension-pneumothorax':
    OBSTRUCTIVE_PLEURAL_SHOCK_FIXTURES.expert.map(([tick, dispatch]) => ({ tick, ...dispatch })),
};

const DECLARING = ALL_SCENARIOS.filter((scenario) => (scenario.rapidCycle ?? []).length > 0);
const POINTS = DECLARING.flatMap((scenario) => (scenario.rapidCycle ?? [])
  .map((point) => [scenario.metadata.id, point, scenario] as const));

/**
 * Words that would turn a directive into a verdict on the learner. The lesson
 * may say what the protocol does; it may not say how the learner did.
 */
const VERDICT_WORDS = /\b(score|scored|grade|graded|pass|passed|failed|competent|proficient)\b/i;

describe('authored rapid-cycle points', () => {
  it('are declared by the lessons this test covers, and only those', () => {
    expect(DECLARING.map((scenario) => scenario.metadata.id).sort())
      .toEqual(Object.keys(EXPERT_PATHS).sort());
  });

  it.each(POINTS.map(([scenarioId, point]) => [`${scenarioId}/${point.id}`, scenarioId, point] as const))(
    '%s lands on its lesson\'s expert path inside its own window',
    (_, scenarioId, point) => {
      const expert = EXPERT_PATHS[scenarioId]!;
      const closes = point.atTick + point.windowTicks;
      expect(rapidCycleStatus(point, expert, closes + 1)).toBe('landed');
      // Not merely present somewhere in the run: the window is what it claims, and a
      // declared payload has to be the one the expert path actually sent.
      expect(expert.some((action) => action.type === point.actionType
        && action.tick >= point.atTick && action.tick <= closes
        && Object.entries(point.actionPayload ?? {})
          .every(([field, value]) => action.payload?.[field] === value))).toBe(true);
      // A point whose action type serves more than one step in its own lesson has to say
      // which step it is, or another step could close it.
      const sameType = expert.filter((action) => action.type === point.actionType);
      if (sameType.length > 1) expect(point.actionPayload).toBeDefined();
    },
  );

  it.each(POINTS.map(([scenarioId, point, scenario]) => [`${scenarioId}/${point.id}`, point, scenario] as const))(
    '%s serves a declared, non-recognition objective and cites this lesson\'s own sources',
    (_, point, scenario) => {
      expect(validateScenario(scenario)).toEqual([]);
      expect(scenario.metadata.objectives.map((objective) => objective.id)).toContain(point.objectiveId);
      expect(isRecognitionObjective(point.objectiveId)).toBe(false);
      // The locator has to point into a source this lesson actually cites. A year is the
      // usual handle; for an undated document — an obstetric handbook section, say — the
      // section designation is the only one there is, and it identifies the page just as well.
      const handles = [...point.sourceLocator.matchAll(/\b(?:(?:19|20)\d{2}|\d+-\d+)\b/g)]
        .map((match) => match[0]);
      expect(handles.length).toBeGreaterThan(0);
      const sources = scenario.metadata.clinicalReview.sources.join(' ');
      expect(handles.some((handle) => sources.includes(handle))).toBe(true);
    },
  );

  it.each(POINTS.map(([scenarioId, point, scenario]) => [`${scenarioId}/${point.id}`, point, scenario] as const))(
    '%s is registered as a tutor rule at its lesson\'s own version and status',
    (_, point, scenario) => {
      const subjects = rapidCycleMaturitySubjects([scenario], 'any-module');
      const subject = subjects.find((entry) => entry.subjectId === `${scenario.metadata.id}-${point.id}`);
      expect(subject).toBeDefined();
      expect(subject).toMatchObject({
        subjectKind: 'tutor-rule',
        contentVersion: scenario.metadata.version,
        status: scenario.metadata.maturity,
      });
      expect(subject!.evidence).toContain(point.sourceLocator);
      // A point id is unique only inside its lesson, so the subject id carries both.
      expect(subject!.subjectId).toMatch(/^[A-Za-z0-9-]+$/);
    },
  );

  it('registers nothing for a lesson that declares no point', () => {
    const without = ALL_SCENARIOS.find((scenario) => (scenario.rapidCycle ?? []).length === 0)!;
    expect(rapidCycleMaturitySubjects([without], 'any-module')).toEqual([]);
  });

  it.each(POINTS.map(([scenarioId, point]) => [`${scenarioId}/${point.id}`, point] as const))(
    '%s gives a directive, not a verdict',
    (_, point) => {
      expect(point.directive.length).toBeLessThanOrEqual(160);
      expect(point.directive).not.toMatch(VERDICT_WORDS);
      expect(point.cycleCap).toBeGreaterThanOrEqual(3);
      expect(point.cycleCap).toBeLessThanOrEqual(6);
    },
  );
});
