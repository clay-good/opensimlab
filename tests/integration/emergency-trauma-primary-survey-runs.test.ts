/**
 * Reference transcripts for the emergency trauma-primary-survey lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is the letter in front of the alphabet:
 * the airway and breathing review is refused until the catastrophic external
 * haemorrhage is controlled.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TRAUMA_PRIMARY_SURVEY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/trauma-primary-survey';
import { TRAUMA_PRIMARY_SURVEY_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/trauma-primary-survey-fixtures';
import {
  TRAUMA_PRIMARY_SURVEY_ACTIONS, TRAUMA_PRIMARY_SURVEY_OBJECTIVES,
  supportsTraumaPrimarySurvey, type TraumaPrimarySurveyAction,
} from '../../src/modules/emergency-medicine/trauma-primary-survey';
import { traumaPrimarySurveyCompletionEvidence } from '../../src/modules/emergency-medicine/trauma-primary-survey-completion';
import { traumaPrimarySurveyInlinePrompt } from '../../src/modules/emergency-medicine/tutor/trauma-primary-survey-guidance';

type Choices = readonly (readonly [number, TraumaPrimarySurveyAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: TraumaPrimarySurveyAction): LearnerAction => ({ tick, type: 'trauma-primary-survey-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.traumaPrimarySurveyAssessment);
    const prompt = traumaPrimarySurveyInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.traumaPrimarySurveyAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.traumaPrimarySurveyAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.traumaPrimarySurveyAssessment! };
}

describe('Emergency trauma primary survey transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(TRAUMA_PRIMARY_SURVEY_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsTraumaPrimarySurvey(SCENARIO)).toBe(true);
    expect(supportsTraumaPrimarySurvey({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'trauma-primary-survey-boundary'),
    })).toBe(false);
    expect(traumaPrimarySurveyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(traumaPrimarySurveyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(traumaPrimarySurveyCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(traumaPrimarySurveyCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...TRAUMA_PRIMARY_SURVEY_OBJECTIVES]);
    expect([...TRAUMA_PRIMARY_SURVEY_OBJECTIVES]).not.toEqual([...TRAUMA_PRIMARY_SURVEY_ACTIONS.slice(0, 5)]);
    expect(supportsTraumaPrimarySurvey({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: TRAUMA_PRIMARY_SURVEY_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: TRAUMA_PRIMARY_SURVEY_ACTIONS[index]!,
        })),
      },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions: Choices = FIXTURES[path];
    const until = (actions.at(-1)?.[0] ?? 0) + 2;
    const reference = run(actions, until);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, until, level).hash).toBe(reference.hash);
    }
    expect(run(actions, until, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and none with no action', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(findings(expert.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.repeatedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.activatedAtTick).toBeNull();
  });

  it('leaves the abdominal concern unresolved and hands over the uncertainty', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const circulation = expert.events.find(({ eventId }) => eventId.startsWith('trauma-circulation-'))!;
    expect(JSON.stringify(circulation))
      .toContain('it directs rather than delays surgery or interventional planning and does not exclude other bleeding');
    const repeat = expert.events.find(({ eventId }) => eventId.startsWith('trauma-repeat-'))
      ?? expert.events.find(({ eventId }) => /trauma-.*repeat/.test(eventId))!;
    const text = JSON.stringify(expert.events);
    expect(text).toContain('Persistent abdominal and pelvic concern plus positive eFAST were handed directly to the definitive-control team');
    expect(text).toContain('remaining uncertainties');
    expect(repeat).toBeDefined();
  });

  it('refuses the airway review while the leg is still bleeding', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.activatedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      catastrophicHemorrhageAtTick: null, airwayBreathingAtTick: null, repeatedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Control the authored catastrophic external hemorrhage before continuing the survey.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.repeatedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Receive the structured handoff, activate the trauma response, and declare the survey order first.');
    expect(transcript).toContain('Complete the bounded circulation, hemorrhage, and definitive-control path before D and E.');
    expect(recovered.patient.activatedAtTick).toBeLessThan(recovered.patient.catastrophicHemorrhageAtTick!);
    expect(recovered.patient.catastrophicHemorrhageAtTick).toBeLessThan(recovered.patient.airwayBreathingAtTick!);
    expect(recovered.patient.disabilityExposureAtTick).toBeLessThan(recovered.patient.repeatedAtTick!);
  });

  it('refuses every later step before the handoff is received', () => {
    for (const action of TRAUMA_PRIMARY_SURVEY_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Receive the structured handoff, activate the trauma response, and declare the survey order first.');
      expect(refused.patient.activatedAtTick).toBeNull();
    }
  });

  it('refuses the repeat survey until disability and exposure are complete', () => {
    const short = run([
      [0, 'activate-trauma-primary-survey'],
      [1, 'control-trauma-catastrophic-hemorrhage'],
      [2, 'review-trauma-airway-and-breathing'],
      [3, 'record-trauma-circulation-response'],
      [4, 'repeat-trauma-primary-survey'],
    ], 6);
    expect(short.patient.repeatedAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Complete disability, glucose, exposure, posterior review, and heat-loss prevention before repeating the survey.');
  });
});
