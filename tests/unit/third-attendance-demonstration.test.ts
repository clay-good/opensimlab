/**
 * The worked example and observed-state tutor for a question two people have already answered.
 *
 * Two failures this example must not model: acting only once challenged, and treating the
 * previous clinicians as the problem. It is held here to asking for the assessment before the
 * Tuesday clinician speaks, and to naming no diagnosis and no error.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { THIRD_ATTENDANCE_A_QUESTION_TWO_PEOPLE_HAVE_ALREADY_ANSWERED as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/third-attendance-a-question-two-people-have-already-answered';
import { THIRD_ATTENDANCE_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/third-attendance-fixtures';
import {
  THIRD_ATTENDANCE_DEMONSTRATION_VERSION, thirdAttendanceDemonstrationStep, supportsThirdAttendanceDemonstration,
} from '../../src/modules/surgery-trauma/demo/third-attendance-demonstration';
import { thirdAttendanceInlinePrompt } from '../../src/modules/surgery-trauma/third-attendance-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.thirdAttendance;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = thirdAttendanceDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'third-attendance-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Asks Before It Is Challenged', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(THIRD_ATTENDANCE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsThirdAttendanceDemonstration(SCENARIO)).toBe(true);
    expect(supportsThirdAttendanceDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['visits', 'prior', 'change', 'escalate', 'intent', 'boundaries',
      'hold', 'colleague', 'reassess', 'handoff']);
  });

  it('asks for the assessment before the Tuesday clinician speaks, not after it', () => {
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('colleague'));
    expect(narrations[beats.indexOf('escalate')]).toContain('before anybody challenges you');
  });

  it('starts by separating the three visits', () => {
    expect(beats[0]).toBe('visits');
    expect(narrations[0]).toContain('Start by separating the three visits');
  });

  // The example must never turn two reasonable colleagues into two people who were wrong.
  it('never names a diagnosis and never criticises a previous clinician, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['appendicitis', 'was missed', 'should have', 'got it wrong',
      'failed to', 'negligent', 'proves']) {
      expect(joined, `the example carried "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('that entry is right, it can stay right');
  });

  it('says that no number is coming to endorse the position', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('no number coming to endorse it');
    const colleague = narrations[beats.indexOf('colleague')]!;
    expect(colleague).toContain('only the cost of your position');
  });

  it('keeps the source that argues against the instinct the case produces', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('1.85 against 2.48');
    expect(boundaries).toContain('Your reason is not that she returned');
  });

  it('ends with the examination owed and nobody blamed', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('no criticism of anybody');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(thirdAttendanceInlinePrompt('unassisted', { scenarioVersion: '0.1.0', thirdAttendance: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = thirdAttendanceDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', thirdAttendance: patientNow };
      guided.push(thirdAttendanceInlinePrompt('guided', input)?.id ?? null);
      coached.push(thirdAttendanceInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'third-attendance-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['third-attendance-handoff', 'third-attendance-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(thirdAttendanceInlinePrompt('guided', { scenarioVersion: '0.1.1', thirdAttendance: snapshot(engine) }))
      .toBeNull();
    expect(thirdAttendanceInlinePrompt('guided', { scenarioVersion: '0.1.0', thirdAttendance: patient })).toBeNull();
  });
});
