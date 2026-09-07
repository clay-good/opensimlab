/**
 * Reference transcripts for the rapid-desaturation lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The assertion this file exists for is the margin. Routine induction teaches
 * that preoxygenation buys time; this patient is here to say what that time is
 * worth, and the only honest way to show it is to run the healthy patient's
 * induction on him and report the number the solver produces.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { findStacking } from '@anesthesia/debrief/analysis';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RAPID_DESATURATION as SCENARIO } from '@anesthesia/scenarios/rapid-desaturation';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RAPID_DESATURATION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/rapid-desaturation-fixtures';
import {
  RAPID_DESATURATION_OBJECTIVES, supportsRapidDesaturation,
} from '../../src/modules/anesthesia/rapid-desaturation';
import { rapidDesaturationCompletionEvidence } from '../../src/modules/anesthesia/rapid-desaturation-completion';

const PEAKS = { propofol: 100, remifentanil: 90 };

function run(
  actions: readonly LearnerAction[],
  level: GuidanceLevel = 'unassisted',
  region: 'US' | 'GB' = 'US',
) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
  const hash = createHash('sha256');
  const history: HistorySample[] = [];
  const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= FIXTURES.ticks; tick += 1) {
    while (actions[next]?.tick === tick) { engine.apply(actions[next]!); next += 1; }
    const frame = engine.step();
    hash.update(JSON.stringify(frame));
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    events.push(...frame.events);
    const prompt = promptFor(level, {
      scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      tick, state: frame.state as Readonly<Record<string, number>>,
      actions: actions.slice(0, next), ventilating: false, alarmCount: 0,
    }, new Map());
    if (level === 'unassisted') expect(prompt).toBeNull();
  }
  expect(next).toBe(actions.length);
  const preoxygenationSeconds = engine.equipment().preoxygenationSeconds;
  const stacking = findStacking(actions, history, PEAKS);
  return {
    hash: hash.digest('hex'), history, events, preoxygenationSeconds, stacking,
    findings: objectiveFindings(SCENARIO, history, stacking.length, preoxygenationSeconds, actions, events),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const lowestSaturation = (result: ReturnType<typeof run>) =>
  Math.min(...result.history.map((sample) => sample.state.spo2Percent ?? Infinity));
const directAttempts = (result: ReturnType<typeof run>) => result.events.filter(
  (event) => event.eventId.startsWith('laryngoscopy-start-') && event.data?.technique === 'direct',
).length;

describe('Rapid desaturation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsRapidDesaturation(SCENARIO)).toBe(true);
    // The lesson this one is the counterfactual for shares three objective ids
    // and the same formulary, and must not be read as this patient.
    expect(supportsRapidDesaturation(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsRapidDesaturation({
      ...SCENARIO,
      patient: { ...SCENARIO.patient, airway: { ...SCENARIO.patient.airway, difficulty: 0.2 } },
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(rapidDesaturationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(rapidDesaturationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(rapidDesaturationCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(rapidDesaturationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia')).toEqual([]);
  });

  it('claims its own worked example and not the scripted demonstration', () => {
    // This requirement was missing until the lesson had an example of its own,
    // and the reason it could not borrow one is worth keeping: the flagship
    // demonstration is authored against routine induction, its seed and its
    // patient, so pointing at it here would narrate a session that is not
    // happening. The evidence now cites the observed-state example instead.
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    const guidance = audit.requirements.find(({ id }) => id === 'guidance-and-demonstration')!;
    expect(guidance.status).toBe('satisfied');
    expect(guidance.evidence.join(' ')).toContain('The flagship scripted demonstration is NOT this');
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...RAPID_DESATURATION_OBJECTIVES]);
    expect(supportsRapidDesaturation({
      ...SCENARIO,
      metadata: { ...SCENARIO.metadata, objectives: [...SCENARIO.metadata.objectives].reverse() },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions = FIXTURES[path];
    const reference = run(actions);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, level).hash).toBe(reference.hash);
    }
    expect(run(actions, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.preoxygenationSeconds).toBeGreaterThanOrEqual(180);
    // The saturation never leaves its room-air baseline, which is what the
    // preoxygenation bought.
    expect(lowestSaturation(expert)).toBeGreaterThan(92);
    // Video first, in a patient the assessment already called difficult.
    expect(directAttempts(expert)).toBe(0);
  });

  it('shows what this patient costs when he is treated like the healthy one', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'met', 'met']);
    expect(errored.preoxygenationSeconds).toBe(0);
    // Not an authored number: it comes out of the obese respiratory profile.
    expect(lowestSaturation(errored)).toBeLessThan(60);
  });

  it('holds the saturation on the same haste, because the oxygen was running', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['partly-met', 'met', 'met', 'met']);
    // The impatience is real and is not recovered: the reserve is short.
    expect(recovered.preoxygenationSeconds).toBeLessThan(180);
    expect(recovered.preoxygenationSeconds).toBeGreaterThan(60);
    // And the margin it still bought is the whole lesson.
    expect(lowestSaturation(recovered) - lowestSaturation(errored)).toBeGreaterThan(30);
  });

  it('records what the airway actually did rather than asserting a result', () => {
    // The laryngoscopic view is drawn from a distribution anchored to reported
    // incidence, so this pins the seed's behaviour rather than a guaranteed one.
    const direct = run([...FIXTURES.expert.slice(0, 3),
      { tick: 3000, type: 'laryngoscopy', payload: { technique: 'direct' } },
      { tick: 3600, type: 'laryngoscopy', payload: { technique: 'direct' } },
    ] as LearnerAction[]);
    const completed = direct.events.filter((event) => /^laryngoscopy-\d+$/.test(event.eventId));
    expect(completed).toHaveLength(2);
    expect(completed[0]!.data?.intubated).toBe(false);
    expect(completed[1]!.data?.intubated).toBe(true);
    expect(outcomes(direct)[2]).toBe('met');
  });

  it('does not exercise the airway objective when nothing is done', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'met', 'not-exercised', 'met']);
    expect(idle.preoxygenationSeconds).toBe(0);
  });
});
