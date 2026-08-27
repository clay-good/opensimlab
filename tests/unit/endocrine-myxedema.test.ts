import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import type { Scenario } from '@anesthesia/scenarios/types';
import {
  Myxedema, supportsMyxedema, MYXEDEMA_VENTILATION_TICKS, MYXEDEMA_RESPIRATORY_DELAY_TICKS,
  MYXEDEMA_ENDOCRINE_DELAY_TICKS, MYXEDEMA_RESPONSE_TICKS, MYXEDEMA_TAKEOVER_TICKS,
  MYXEDEMA_SESSION_TICKS, type MyxedemaAction,
} from '../../src/modules/endocrine-metabolic/myxedema';
import { MYXEDEMA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/myxedema-fixtures';

const packageActions: readonly MyxedemaAction[] = ['ventilate', 'hydrocortisone', 'levothyroxine', 'supportive-care', 'call-support'];
function completePackage(model: Myxedema, tick = 0) {
  for (const action of packageActions) model.apply(action, tick);
}

describe('Myxedema: ventilation, steroid-first sequence, and observed support', () => {
  it('binds only the exact-shaped lesson and fixture version', () => {
    const scenario: Scenario = { ...ROUTINE_INDUCTION,
      metadata: { ...ROUTINE_INDUCTION.metadata, id: FIXTURES.scenarioId, version: FIXTURES.contentVersion },
      timeline: [{ id: 'presentation', type: 'narrative', target: 'myxedema', atTick: 0, severity: 'critical', message: 'Fictional presentation.' },
        { id: 'boundary', type: 'narrative', target: 'myxedema-boundary', atTick: 0, severity: 'warning', message: 'Authored transitions.' }],
    };
    expect(supportsMyxedema(scenario)).toBe(true);
    for (const other of [ROUTINE_INDUCTION, { ...scenario, timeline: scenario.timeline.slice(0, 1) },
      { ...scenario, timeline: [...scenario.timeline, scenario.timeline[0]!] },
      { ...scenario, timeline: [...scenario.timeline, { ...scenario.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsMyxedema(other)).toBe(false);
    }
    expect(FIXTURES.contentVersion).toBe('0.1.1'); expect(FIXTURES.seed).toBe(4904);
  });

  it.each(['call-support', 'ventilate', 'hydrocortisone', 'supportive-care'] as const)('accepts %s independently without invented gates', (action) => {
    const model = new Myxedema();
    expect(model.apply(action, 0).at(-1)?.id).toBe(action === 'call-support' ? 'support' : action === 'ventilate' ? 'ventilation' : action);
    expect(model.snapshot(0)).toMatchObject({ observation: null, levothyroxineAtTick: null, responseDueInSeconds: null });
    expect(model.apply(action, 1)).toEqual([]);
  });

  it('requires accepted hydrocortisone first, permitting correct same-tick order without a fabricated delay', () => {
    const model = new Myxedema();
    expect(model.apply('levothyroxine', 0).at(-1)?.id).toBe('early-thyroxine-refused');
    expect(model.snapshot(0)).toMatchObject({ earlyThyroxineAttempted: true, levothyroxineAtTick: null });
    model.apply('hydrocortisone', 0);
    expect(model.apply('levothyroxine', 0).at(-1)?.id).toBe('levothyroxine');
    expect(model.snapshot(0)).toMatchObject({ hydrocortisoneAtTick: 0, levothyroxineAtTick: 0, earlyThyroxineAttempted: true });
    expect(model.apply('levothyroxine', 1)).toEqual([]);
    const correct = new Myxedema(); correct.apply('hydrocortisone', 0); correct.apply('levothyroxine', 0);
    expect(correct.snapshot(0).earlyThyroxineAttempted).toBe(false);
  });

  it('makes oxygen-only saturation reassuring without treating hypercapnia or preventing respiratory delay', () => {
    const model = new Myxedema(); model.apply('oxygen-only', 0);
    expect(model.vitals()).toMatchObject({ spo2Percent: 94, paco2MmHg: 68, respiratoryRateBpm: 8 });
    expect(model.advance(MYXEDEMA_RESPIRATORY_DELAY_TICKS - 1)).toEqual([]);
    expect(model.advance(MYXEDEMA_RESPIRATORY_DELAY_TICKS).map((event) => event.id)).toEqual(['respiratory-delay']);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 80, heartRateBpm: 38, spo2Percent: 94, paco2MmHg: 78, respiratoryRateBpm: 6 });
    model.apply('ventilate', MYXEDEMA_RESPIRATORY_DELAY_TICKS);
    expect(model.apply('oxygen-only', MYXEDEMA_RESPIRATORY_DELAY_TICKS + 1).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(MYXEDEMA_RESPIRATORY_DELAY_TICKS + 1).oxygenOnlyAtTick).toBe(0);
    const correct = new Myxedema(); correct.apply('ventilate', 0); correct.apply('oxygen-only', 1);
    expect(correct.snapshot(1).oxygenOnlyAtTick).toBeNull();
  });

  it('has separate exact respiratory and endocrine deterioration boundaries', () => {
    const model = new Myxedema();
    expect(model.vitals()).toMatchObject({ systolicMmHg: 88, diastolicMmHg: 54, meanArterialMmHg: 65, heartRateBpm: 42,
      respiratoryRateBpm: 8, spo2Percent: 90, coreTemperatureC: 34, paco2MmHg: 68 });
    model.advance(MYXEDEMA_RESPIRATORY_DELAY_TICKS);
    expect(model.vitals()).toMatchObject({ spo2Percent: 86, paco2MmHg: 78 });
    expect(model.advance(MYXEDEMA_ENDOCRINE_DELAY_TICKS - 1)).toEqual([]);
    expect(model.advance(MYXEDEMA_ENDOCRINE_DELAY_TICKS).map((event) => event.id)).toEqual(['endocrine-delay']);
    expect(model.snapshot(MYXEDEMA_ENDOCRINE_DELAY_TICKS)).toMatchObject({ ventilationDelayed: true, endocrineTreatmentDelayed: true });
    expect(model.advance(MYXEDEMA_ENDOCRINE_DELAY_TICKS + 1)).toEqual([]);
  });

  it.each(['hydrocortisone', 'levothyroxine'] as const)('retains endocrine deterioration when %s is absent despite ventilatory support', (missing) => {
    const model = new Myxedema(); model.apply('ventilate', 0);
    if (missing !== 'hydrocortisone') model.apply('hydrocortisone', 0);
    if (missing !== 'levothyroxine') model.apply('levothyroxine', 0);
    model.advance(MYXEDEMA_ENDOCRINE_DELAY_TICKS);
    expect(model.snapshot(MYXEDEMA_ENDOCRINE_DELAY_TICKS)).toMatchObject({ ventilationDelayed: false, endocrineTreatmentDelayed: true });
    expect(model.vitals()).toMatchObject({ systolicMmHg: 80, heartRateBpm: 38, respiratoryRateBpm: 12, spo2Percent: 94, paco2MmHg: 54 });
  });

  it('advances ventilation independently of endocrine treatment and leaves prior observations stale', () => {
    const model = new Myxedema(); model.apply('reassess', 0); model.apply('ventilate', 7);
    const due = 7 + MYXEDEMA_VENTILATION_TICKS;
    expect(model.snapshot(7).ventilationDueInSeconds).toBe(300);
    expect(model.advance(due - 1)).toEqual([]); expect(model.snapshot(due - 1).ventilationDueInSeconds).toBe(1);
    expect(model.snapshot(due)).toMatchObject({ ventilationDueInSeconds: 0, respiratorySupportObserved: false });
    expect(model.vitals().paco2MmHg).toBe(68);
    expect(model.advance(due).map((event) => event.id)).toEqual(['ventilation-response']);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 88, heartRateBpm: 42, respiratoryRateBpm: 12, spo2Percent: 94, paco2MmHg: 54 });
    expect(model.snapshot(due)).toMatchObject({ ventilationDueInSeconds: null, responseDueInSeconds: null,
      respiratorySupportObserved: false, responseObserved: false, observation: { atTick: 0, paco2MmHg: 68 } });
    expect(model.apply('reassess', due).at(-1)?.id).toBe('respiratory-reassessment');
    expect(model.snapshot(due)).toMatchObject({ respiratorySupportObserved: true, responseObserved: false, observation: { atTick: due, paco2MmHg: 54 } });
    expect(model.apply('handoff', due).at(-1)?.id).toBe('handoff-refused');
  });

  it('does not let prior respiratory reassessment stand in for a fresh complete-care observation', () => {
    const model = new Myxedema(); completePackage(model);
    model.apply('reassess', MYXEDEMA_VENTILATION_TICKS);
    expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS - 1).responseDueInSeconds).toBe(1);
    expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS).responseDueInSeconds).toBe(0);
    expect(model.vitals().coreTemperatureC).toBe(34);
    expect(model.advance(MYXEDEMA_RESPONSE_TICKS).map((event) => event.id)).toEqual(['response']);
    expect(model.vitals()).toMatchObject({ systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71, heartRateBpm: 46,
      respiratoryRateBpm: 12, spo2Percent: 94, coreTemperatureC: 34.2, paco2MmHg: 54 });
    expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS)).toMatchObject({ responseObserved: false, respiratorySupportObserved: true,
      observation: { atTick: MYXEDEMA_VENTILATION_TICKS, coreTemperatureC: 34 } });
    expect(model.apply('handoff', MYXEDEMA_RESPONSE_TICKS).at(-1)?.id).toBe('handoff-refused');
    expect(model.apply('reassess', MYXEDEMA_RESPONSE_TICKS).at(-1)?.id).toBe('post-treatment-reassessment');
    expect(model.apply('handoff', MYXEDEMA_RESPONSE_TICKS).at(-1)?.id).toBe('handoff');
    expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS)).toMatchObject({ ended: 'handoff', responseObserved: true, durableRecoveryProven: false });
  });

  it('permits a first fresh assessment after both response checkpoints to observe both without inventing an earlier check', () => {
    const model = new Myxedema(); completePackage(model); model.advance(MYXEDEMA_RESPONSE_TICKS);
    expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS)).toMatchObject({ respiratorySupportObserved: false, responseObserved: false, observation: null });
    model.apply('reassess', MYXEDEMA_RESPONSE_TICKS);
    expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS)).toMatchObject({ respiratorySupportObserved: true, responseObserved: true });
  });

  it.each(packageActions)('does not start complete-care response while %s is missing and bounds the unfinished branch', (missing) => {
    const model = new Myxedema(); for (const action of packageActions) if (action !== missing) model.apply(action, 0);
    expect(model.snapshot(0).responseDueInSeconds).toBeNull();
    const urgentMissing = ['ventilate', 'hydrocortisone', 'levothyroxine'].includes(missing);
    const stop = urgentMissing ? MYXEDEMA_TAKEOVER_TICKS : MYXEDEMA_SESSION_TICKS;
    model.advance(stop - 1); expect(model.snapshot(stop - 1).ended).toBeNull();
    model.advance(stop); expect(model.snapshot(stop)).toMatchObject({ ended: 'instructor-takeover', responseObserved: false });
  });

  it('starts response at the last accepted package action and still bounds an omitted handoff', () => {
    const model = new Myxedema(); for (const action of packageActions) if (action !== 'call-support') model.apply(action, 0);
    model.apply('call-support', 100);
    expect(model.snapshot(100).responseDueInSeconds).toBe(3600);
    model.advance(MYXEDEMA_RESPONSE_TICKS); expect(model.vitals().heartRateBpm).toBe(42);
    model.apply('reassess', MYXEDEMA_RESPONSE_TICKS + 100); expect(model.snapshot(MYXEDEMA_RESPONSE_TICKS + 100).responseObserved).toBe(true);
    model.advance(MYXEDEMA_SESSION_TICKS - 1); expect(model.snapshot(MYXEDEMA_SESSION_TICKS - 1).ended).toBeNull();
    model.advance(MYXEDEMA_SESSION_TICKS); expect(model.snapshot(MYXEDEMA_SESSION_TICKS).ended).toBe('instructor-takeover');
  });

  it('permits correction before the authored takeover but never revives a branch at its exact stop', () => {
    const repaired = new Myxedema(); completePackage(repaired, MYXEDEMA_TAKEOVER_TICKS - 1);
    repaired.advance(MYXEDEMA_TAKEOVER_TICKS);
    expect(repaired.snapshot(MYXEDEMA_TAKEOVER_TICKS)).toMatchObject({ ended: null, ventilationDelayed: true, endocrineTreatmentDelayed: true });
    const stopped = new Myxedema();
    expect(stopped.apply('ventilate', MYXEDEMA_TAKEOVER_TICKS).map((event) => event.id)).toEqual([
      'respiratory-delay', 'endocrine-delay', 'instructor-takeover', 'action-refused',
    ]);
    expect(stopped.snapshot(MYXEDEMA_TAKEOVER_TICKS)).toMatchObject({ ended: 'instructor-takeover', ventilationAtTick: null });
  });

  it('reaches the same independent support checkpoints through coarse or fine updates', () => {
    const fine = new Myxedema(); const coarse = new Myxedema(); completePackage(fine); completePackage(coarse);
    const events = [];
    for (let tick = 0; tick <= MYXEDEMA_RESPONSE_TICKS; tick += 1) events.push(...fine.advance(tick));
    expect(coarse.advance(MYXEDEMA_RESPONSE_TICKS)).toEqual(events);
    expect(coarse.vitals()).toEqual(fine.vitals());
    expect(coarse.snapshot(MYXEDEMA_RESPONSE_TICKS)).toEqual(fine.snapshot(MYXEDEMA_RESPONSE_TICKS));
    expect(coarse.snapshot(MYXEDEMA_RESPONSE_TICKS)).toMatchObject({ respiratorySupportObserved: false, responseObserved: false, observation: null });
  });

  it.each(['ventilate', 'hydrocortisone', 'levothyroxine'] as const)('records deferred remaining care with %s missing without erasing evidence', (missing) => {
    const model = new Myxedema(); for (const action of packageActions) if (action !== missing) model.apply(action, 0);
    expect(model.apply('wait-for-labs', 1).at(-1)?.id).toBe('diagnostic-delay-choice');
    completePackage(model, 2);
    expect(model.apply('wait-for-labs', 3).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(3).waitForLabsChosen).toBe(true);
  });

  it('refuses stale delay choices and rapid rewarming without applying heat or fabricating earlier errors', () => {
    const model = new Myxedema(); completePackage(model);
    expect(model.apply('wait-for-labs', 0).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(0).waitForLabsChosen).toBe(false);
    const before = model.vitals();
    expect(model.apply('rapid-rewarming', 0).at(-1)?.id).toBe('rapid-rewarming-refused');
    expect(model.snapshot(0).rapidRewarmingAttempted).toBe(true); expect(model.vitals()).toEqual(before);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays the full %s trace deterministically with distinct retained evidence', (path) => {
    const run = () => {
      const model = new Myxedema(); const hash = createHash('sha256');
      for (let tick = 0; tick <= MYXEDEMA_SESSION_TICKS; tick += 1) {
        const events = model.advance(tick);
        for (const [at, action] of FIXTURES[path]) if (at === tick) events.push(...model.apply(action, tick));
        hash.update(JSON.stringify({ tick, vitals: model.vitals(), patient: model.snapshot(tick), events }));
      }
      return { hash: hash.digest('hex'), patient: model.snapshot(MYXEDEMA_SESSION_TICKS) };
    };
    const first = run(); expect(run()).toEqual(first);
    const complete = path === 'expert' || path === 'recovery'; const mistakes = path === 'commonError' || path === 'recovery';
    expect(first.patient).toMatchObject({ ended: complete ? 'handoff' : 'instructor-takeover', responseObserved: complete,
      respiratorySupportObserved: complete, earlyThyroxineAttempted: mistakes, rapidRewarmingAttempted: mistakes,
      waitForLabsChosen: mistakes, ventilationDelayed: path !== 'expert', endocrineTreatmentDelayed: path !== 'expert', durableRecoveryProven: false });
    expect(first.patient.oxygenOnlyAtTick !== null).toBe(mistakes);
  }, 30_000);

  it('does not mutate exposed observations, reflect unknown payloads, or change ended branches', () => {
    const model = new Myxedema();
    for (const action of [null, {}, '__proto__', { action: 'ventilate', private: 'private-value' }]) {
      expect(model.apply(action, 0)).toEqual([{ id: 'action-refused', message: 'That choice is not part of this fictional myxedema lesson. Nothing changed.' }]);
    }
    model.apply('reassess', 0); const exposed = model.snapshot(0).observation!;
    Object.assign(exposed, { paco2MmHg: 999 }); expect(model.snapshot(0).observation!.paco2MmHg).toBe(68);
    model.advance(MYXEDEMA_TAKEOVER_TICKS); const ended = model.snapshot(MYXEDEMA_TAKEOVER_TICKS);
    for (const action of [...packageActions, 'oxygen-only', 'wait-for-labs', 'rapid-rewarming', 'reassess', 'handoff']) model.apply(action, MYXEDEMA_SESSION_TICKS);
    expect(model.advance(MYXEDEMA_SESSION_TICKS)).toEqual([]); expect(model.snapshot(MYXEDEMA_SESSION_TICKS)).toEqual(ended);
  });
});
