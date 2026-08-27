import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario } from '@anesthesia/scenarios/types';
import {
  ThyroidStorm, supportsThyroidStorm, THYROID_DELAY_TICKS, THYROID_IODINE_WAIT_TICKS,
  THYROID_RESPONSE_TICKS, THYROID_TAKEOVER_TICKS, THYROID_SESSION_TICKS,
  type ThyroidStormAction,
} from '../../src/modules/endocrine-metabolic/thyroid-storm';
import { THYROID_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/thyroid-storm-fixtures';

const packageActions: readonly ThyroidStormAction[] = ['synthesis-blockade', 'supportive-care',
  'call-support', 'assess-circulation', 'rate-control-review'];
function completePackage(model: ThyroidStorm) {
  for (const action of packageActions) model.apply(action, 0);
  model.apply('iodine', THYROID_IODINE_WAIT_TICKS);
}
const responseTick = THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS;

describe('Thyroid storm: urgent care, sequence, circulation, and observed response', () => {
  it('binds only the exact-shaped thyroid-storm lesson', () => {
    const scenario: Scenario = { ...ROUTINE_INDUCTION,
      metadata: { ...ROUTINE_INDUCTION.metadata, id: FIXTURES.scenarioId, version: FIXTURES.contentVersion },
      timeline: [{ id: 'presentation', type: 'narrative', target: 'thyroid-storm', atTick: 0, severity: 'critical', message: 'Fictional presentation.' },
        { id: 'boundary', type: 'narrative', target: 'thyroid-storm-boundary', atTick: 0, severity: 'warning', message: 'Authored state transitions.' }],
    };
    expect(supportsThyroidStorm(scenario)).toBe(true);
    for (const other of [ROUTINE_INDUCTION, { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsThyroidStorm(other)).toBe(false);
    }
    expect(FIXTURES.contentVersion).toBe('0.1.0'); expect(FIXTURES.seed).toBe(4903);
  });

  it.each(['synthesis-blockade', 'supportive-care'] as const)('starts %s without labs, support, or a circulation gate', (first) => {
    const model = new ThyroidStorm();
    expect(model.apply(first, 0).at(-1)?.id).toBe(first);
    expect(model.snapshot(0)).toMatchObject({ supportActive: false, circulationAssessedAtTick: null,
      rateControlReviewedAtTick: null, iodineAtTick: null, responseObserved: false });
    expect(model.apply(first, 1)).toEqual([]);
  });

  it.each(['synthesis-blockade', 'supportive-care'] as const)('records deferring remaining urgent care after %s without erasing that evidence later', (first) => {
    const model = new ThyroidStorm(); model.apply(first, 0);
    expect(model.apply('wait-for-labs', 1).at(-1)?.id).toBe('diagnostic-delay-choice');
    expect(model.snapshot(1).waitForLabsChosen).toBe(true);
    model.apply(first === 'synthesis-blockade' ? 'supportive-care' : 'synthesis-blockade', 2);
    expect(model.apply('wait-for-labs', 3).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(3).waitForLabsChosen).toBe(true);
  });

  it('refuses a stale wait choice without inventing a prior delay once both urgent pathways started', () => {
    const model = new ThyroidStorm(); model.apply('synthesis-blockade', 0); model.apply('supportive-care', 1);
    expect(model.apply('wait-for-labs', 2).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(2).waitForLabsChosen).toBe(false);
  });

  it('requires circulation assessment for rate-control review without administering blanket beta blockade', () => {
    const model = new ThyroidStorm();
    expect(model.apply('rate-control-review', 0).at(-1)?.id).toBe('rate-control-review-refused');
    expect(model.snapshot(0)).toMatchObject({ circulationRisk: 'unassessed', rateControlReviewedAtTick: null });
    const initial = model.vitals();
    model.apply('assess-circulation', 1); model.apply('rate-control-review', 2);
    expect(model.snapshot(2)).toMatchObject({ circulationRisk: 'congested-poor-perfusion', circulationAssessedAtTick: 1,
      rateControlReviewedAtTick: 2, blanketBetaBlockadeChosen: false });
    expect(model.vitals()).toEqual(initial);
    expect(model.apply('blanket-beta-blockade', 3).at(-1)?.id).toBe('blanket-beta-blockade-refused');
    expect(model.snapshot(3).blanketBetaBlockadeChosen).toBe(true);
    expect(model.vitals()).toEqual(initial);
  });

  it('enforces the selected US one-hour iodine sequence at the exact boundary', () => {
    const model = new ThyroidStorm();
    expect(model.snapshot(0).iodineDueInSeconds).toBeNull();
    expect(model.apply('iodine', 0).at(-1)?.id).toBe('early-iodine-refused');
    model.apply('synthesis-blockade', 7); model.apply('supportive-care', 7);
    expect(model.snapshot(7).iodineDueInSeconds).toBe(3600);
    const due = 7 + THYROID_IODINE_WAIT_TICKS;
    expect(model.snapshot(due - 1).iodineDueInSeconds).toBe(1);
    expect(model.apply('iodine', due - 1).at(-1)?.id).toBe('early-iodine-refused');
    expect(model.snapshot(due)).toMatchObject({ iodineDueInSeconds: 0, iodineAtTick: null });
    expect(model.apply('iodine', due).at(-1)?.id).toBe('iodine');
    expect(model.snapshot(due)).toMatchObject({ iodineDueInSeconds: null, iodineAtTick: due, earlyIodineAttempted: true });
    expect(model.apply('iodine', due + 1)).toEqual([]);
  });

  it('deteriorates only at the authored incomplete-urgent boundary and permits late correction', () => {
    const model = new ThyroidStorm(); model.apply('supportive-care', 0);
    expect(model.vitals()).toMatchObject({ coreTemperatureC: 39.8, heartRateBpm: 148, systolicMmHg: 96, diastolicMmHg: 58,
      respiratoryRateBpm: 28, spo2Percent: 94 });
    expect(model.advance(THYROID_DELAY_TICKS - 1)).toEqual([]);
    expect(model.advance(THYROID_DELAY_TICKS).map((event) => event.id)).toEqual(['incomplete-urgent-coverage']);
    expect(model.snapshot(THYROID_DELAY_TICKS).urgentCoverageDelayed).toBe(true);
    expect(model.vitals().meanArterialMmHg).toBe(58);
    model.apply('synthesis-blockade', THYROID_TAKEOVER_TICKS - 1);
    expect(model.advance(THYROID_TAKEOVER_TICKS)).toEqual([]);
    expect(model.snapshot(THYROID_TAKEOVER_TICKS).ended).toBeNull();
  });

  it('never mistakes the appropriate iodine interval for absent urgent coverage', () => {
    const model = new ThyroidStorm();
    for (const action of packageActions) model.apply(action, 0);
    expect(model.advance(THYROID_TAKEOVER_TICKS)).toEqual([]);
    expect(model.snapshot(THYROID_TAKEOVER_TICKS)).toMatchObject({ urgentCoverageDelayed: false, ended: null, iodineDueInSeconds: 1800 });
    expect(model.advance(THYROID_IODINE_WAIT_TICKS)).toEqual([]);
    expect(model.snapshot(THYROID_IODINE_WAIT_TICKS)).toMatchObject({ ended: null, iodineDueInSeconds: 0, responseObserved: false });
  });

  it('keeps state progress distinct from old observations and requires a fresh post-treatment assessment', () => {
    const model = new ThyroidStorm(); model.apply('reassess', 0); completePackage(model);
    expect(model.apply('handoff', THYROID_IODINE_WAIT_TICKS).at(-1)?.id).toBe('handoff-refused');
    expect(model.advance(responseTick - 1)).toEqual([]);
    expect(model.snapshot(responseTick)).toMatchObject({ responseDueInSeconds: 0, responseObserved: false });
    expect(model.vitals().coreTemperatureC).toBe(39.8);
    expect(model.advance(responseTick).map((event) => event.id)).toEqual(['response']);
    expect(model.vitals()).toMatchObject({ coreTemperatureC: 39.3, heartRateBpm: 132, systolicMmHg: 104, diastolicMmHg: 62 });
    expect(model.snapshot(responseTick)).toMatchObject({ responseObserved: false, observation: { atTick: 0, coreTemperatureC: 39.8 } });
    expect(model.apply('handoff', responseTick).at(-1)?.id).toBe('handoff-refused');
    model.apply('reassess', responseTick);
    expect(model.snapshot(responseTick)).toMatchObject({ responseObserved: true, observation: { atTick: responseTick, coreTemperatureC: 39.3 } });
    expect(model.apply('handoff', responseTick + 1).at(-1)?.id).toBe('handoff');
    expect(model.snapshot(responseTick + 1).durableRecoveryProven).toBe(false);
  });

  it.each([...packageActions, 'iodine', 'handoff'] as const)('bounds the unfinished %s path without inventing a response', (missing) => {
    const model = new ThyroidStorm();
    for (const action of packageActions) if (action !== missing) model.apply(action, 0);
    if (missing !== 'iodine') model.apply('iodine', THYROID_IODINE_WAIT_TICKS);
    model.advance(responseTick); model.apply('reassess', responseTick);
    expect(model.snapshot(responseTick).responseObserved).toBe(missing === 'handoff');
    model.advance(THYROID_SESSION_TICKS - 1);
    if (missing !== 'synthesis-blockade' && missing !== 'supportive-care') expect(model.snapshot(THYROID_SESSION_TICKS - 1).ended).toBeNull();
    model.advance(THYROID_SESSION_TICKS); expect(model.snapshot(THYROID_SESSION_TICKS).ended).toBe('instructor-takeover');
  });

  it('starts the response clock only when the last part of the package is accepted', () => {
    const model = new ThyroidStorm();
    for (const action of packageActions) if (action !== 'call-support') model.apply(action, 0);
    model.apply('iodine', THYROID_IODINE_WAIT_TICKS);
    expect(model.snapshot(THYROID_IODINE_WAIT_TICKS).responseDueInSeconds).toBeNull();
    model.apply('call-support', THYROID_IODINE_WAIT_TICKS + 100);
    expect(model.snapshot(THYROID_IODINE_WAIT_TICKS + 100).responseDueInSeconds).toBe(7200);
    model.advance(responseTick); expect(model.vitals().heartRateBpm).toBe(148);
    model.advance(responseTick + 100); expect(model.vitals().heartRateBpm).toBe(132);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays the entire %s state/event trace exactly and preserves mistakes', (path) => {
    const run = () => {
      const model = new ThyroidStorm(); const hash = createHash('sha256');
      for (let tick = 0; tick <= THYROID_SESSION_TICKS; tick += 1) {
        const events = model.advance(tick);
        for (const [at, action] of FIXTURES[path]) if (at === tick) events.push(...model.apply(action, tick));
        hash.update(JSON.stringify({ tick, vitals: model.vitals(), patient: model.snapshot(tick), events }));
      }
      return { hash: hash.digest('hex'), patient: model.snapshot(THYROID_SESSION_TICKS) };
    };
    const first = run(); expect(run()).toEqual(first);
    const completed = path === 'expert' || path === 'recovery';
    const choseErrors = path === 'commonError' || path === 'recovery';
    expect(first.patient).toMatchObject({ ended: completed ? 'handoff' : 'instructor-takeover',
      responseObserved: completed, waitForLabsChosen: choseErrors,
      blanketBetaBlockadeChosen: choseErrors, earlyIodineAttempted: choseErrors,
      urgentCoverageDelayed: path !== 'expert', durableRecoveryProven: false });
  }, 30_000);

  it('freezes ended branches and refuses unknown values without reflecting their contents', () => {
    const model = new ThyroidStorm();
    for (const action of [null, {}, '__proto__', { action: 'synthesis-blockade', private: 'private-value' }]) {
      expect(model.apply(action, 0)).toEqual([{ id: 'action-refused', message: 'That choice is not part of this fictional thyroid-storm lesson. Nothing changed.' }]);
    }
    expect(model.snapshot(0).synthesisAtTick).toBeNull();
    model.advance(THYROID_TAKEOVER_TICKS);
    const ended = model.snapshot(THYROID_TAKEOVER_TICKS);
    for (const action of [...packageActions, 'iodine', 'reassess', 'handoff']) model.apply(action, THYROID_SESSION_TICKS);
    expect(model.advance(THYROID_SESSION_TICKS)).toEqual([]);
    expect(model.snapshot(THYROID_SESSION_TICKS)).toEqual(ended);
  });
});
