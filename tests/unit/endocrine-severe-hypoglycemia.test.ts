import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { validateScenario } from '@anesthesia/scenarios/schema';
import type { EngineEvent } from '@platform/kernel/protocol';
import { SevereHypoglycemia, supportsSevereHypoglycemia, HYPOGLYCEMIA_RECHECK_TICKS, HYPOGLYCEMIA_RECURRENCE_TICKS, HYPOGLYCEMIA_TAKEOVER_TICKS } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia';
import { HYPOGLYCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/severe-hypoglycemia-fixtures';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/severe-hypoglycemia-recurrence';
import { DKA_RESOLUTION_TRANSITION } from '../../src/modules/endocrine-metabolic/scenarios/dka-resolution-transition';
import { promptFor, promptStillEligible, unpromptedOmissions } from '@anesthesia/tutor/guidance';

function runFixture(actions: typeof FIXTURES.expert | typeof FIXTURES.commonError | typeof FIXTURES.recovery) {
  const model = new SevereHypoglycemia(); const events: EngineEvent[] = [];
  for (const [tick, action] of actions) for (const event of model.apply(action, tick)) events.push({ tick, eventId: `severe-hypoglycemia-${event.id}-${tick}`, message: event.message, category: 'assessment', severity: 'warning' });
  for (const event of model.advance(27011)) events.push({ tick: 27011, eventId: `severe-hypoglycemia-${event.id}-27011`, message: event.message, category: 'assessment', severity: 'warning' });
  return { snapshot: model.snapshot(27011), findings: objectiveFindings(SCENARIO, [], 0, 0, [], events), events };
}

describe('Adult severe hypoglycemia decisions and clock', () => {
  it('does not offer unrelated induction guidance or omissions in any guidance mode', () => {
    const input = { scenarioId: SCENARIO.metadata.id, tick: 9000, state: { fio2: 0.21 }, actions: [], ventilating: false, alarmCount: 0 };
    for (const level of ['guided', 'coached', 'unassisted'] as const) {
      expect(promptFor(level, input, new Map())).toBeNull();
      expect(promptStillEligible(level, input, 'preoxygenate')).toBe(false);
    }
    expect(unpromptedOmissions(input)).toEqual([]);
  });
  it('binds five objectives, three exact-version transcripts, and a hidden initial result', () => {
    expect(validateScenario(SCENARIO)).toEqual([]); expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(validateScenario({ ...SCENARIO, metadata: { ...SCENARIO.metadata, estimatedMinutes: 360 } })).toEqual([]);
    expect(validateScenario({ ...SCENARIO, metadata: { ...SCENARIO.metadata, estimatedMinutes: 361 } })).toContainEqual(expect.objectContaining({ pointer: '/metadata/estimatedMinutes', rule: 'maximum' }));
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id); expect(FIXTURES.contentVersion).toBe(SCENARIO.metadata.version);
    expect(new SevereHypoglycemia().snapshot(0)).toMatchObject({ glucoseMgPerDl: null, medicationReviewed: false, consciousness: 'drowsy', firstRescueAtTick: null });
  });
  it('distinguishes expert, common-error, and recovered branches without hiding the unsafe choice', () => {
    const expert = runFixture(FIXTURES.expert); const error = runFixture(FIXTURES.commonError); const recovery = runFixture(FIXTURES.recovery);
    expect(expert.snapshot).toMatchObject({ ended: 'handoff', glucoseMgPerDl: 108, monitoringActive: true, durableRecoveryProven: false });
    expect(expert.findings.map(({ outcome }) => outcome)).toEqual(Array(5).fill('met'));
    expect(error.snapshot).toMatchObject({ ended: 'instructor-takeover', recurrenceActive: true, monitoringActive: false });
    expect(error.findings.map(({ outcome }) => outcome)).toEqual(['met', 'not-met', 'met', 'not-met', 'not-met']);
    expect(recovery.snapshot.ended).toBe('handoff'); expect(recovery.findings[1]!.outcome).toBe('not-met');
    expect(recovery.findings[1]!.finding).toContain('then corrected'); expect(recovery.findings[3]!.finding).toContain('closed prematurely');
    expect(expert.findings[1]!.finding).toContain('Authored counterfactual');
  });
  it('changes at exact elapsed boundaries and keeps old glucose stale until checked', () => {
    const model = new SevereHypoglycemia(); model.apply('check-glucose', 0); model.apply('call-support', 0); model.apply('iv-rescue', 1);
    model.advance(HYPOGLYCEMIA_RECHECK_TICKS); expect(model.snapshot(HYPOGLYCEMIA_RECHECK_TICKS).consciousness).toBe('drowsy');
    model.advance(HYPOGLYCEMIA_RECHECK_TICKS + 1); expect(model.snapshot(HYPOGLYCEMIA_RECHECK_TICKS + 1)).toMatchObject({ consciousness: 'more-alert', glucoseMgPerDl: 36 });
    model.apply('check-glucose', HYPOGLYCEMIA_RECHECK_TICKS + 1); expect(model.snapshot(6001).glucoseMgPerDl).toBe(112);
    model.advance(HYPOGLYCEMIA_RECURRENCE_TICKS + 1); expect(model.snapshot(18001)).toMatchObject({ consciousness: 'drowsy', glucoseMgPerDl: 112, recurrenceActive: true });
    expect(model.apply('iv-rescue', 18001).at(-1)?.id).toBe('rescue-order-refused');
    model.apply('check-glucose', 18002); model.apply('iv-rescue', 18002); expect(model.snapshot(18002).secondRescueAtTick).toBe(18002);
  });
  it('allows late recovery when the first post-rescue check was missed', () => {
    const model = new SevereHypoglycemia(); model.apply('check-glucose', 0); model.apply('call-support', 0); model.apply('iv-rescue', 0);
    model.apply('check-glucose', 18000); model.apply('iv-rescue', 18000); model.apply('check-glucose', 24000);
    model.apply('review-medications', 24000); model.apply('continue-monitoring', 24000); model.apply('handoff', 24000);
    expect(model.snapshot(24000)).toMatchObject({ ended: 'handoff', firstRecheckComplete: false, secondRecheckComplete: true });
  });
  it('stops untreated branches without inventing an outcome or accepting later rescue', () => {
    const model = new SevereHypoglycemia(); model.advance(HYPOGLYCEMIA_TAKEOVER_TICKS);
    const stopped = model.snapshot(HYPOGLYCEMIA_TAKEOVER_TICKS);
    expect(stopped).toMatchObject({ ended: 'instructor-takeover', consciousness: 'hard-to-rouse', durableRecoveryProven: false });
    model.apply('iv-rescue', 30000); expect(model.snapshot(30000)).toEqual(stopped);
  });
  it('replays the expert through the real engine with matching vital consequences', () => {
    for (const practiceRegion of ['US', 'GB'] as const) {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion });
      const events: EngineEvent[] = []; const frames = new Map<number, number>();
      for (let tick = 0; tick <= 24012; tick += 1) {
        for (const [atTick, action] of FIXTURES.expert) if (atTick === tick) subject.apply({ tick, type: 'severe-hypoglycemia-response', payload: { action } });
        const frame = subject.step(); events.push(...frame.events);
        if ([0, 6010, 18010, 24011].includes(tick)) frames.set(tick, frame.state.heartRateBpm);
      }
      expect([...frames.values()]).toEqual([112, 88, 112, 88]);
      expect(subject.equipment().resuscitation.severeHypoglycemia?.ended).toBe('handoff');
      expect(objectiveFindings(SCENARIO, [], 0, 0, [], events).map(({ outcome }) => outcome)).toEqual(Array(5).fill('met'));
    }
  });
  it('fails closed for tampered scenarios, arbitrary payloads, and generic care controls', () => {
    for (const scenario of [DKA_RESOLUTION_TRANSITION, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] }]) expect(supportsSevereHypoglycemia(scenario)).toBe(false);
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1, practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 1, practiceRegion: 'US' });
    for (const type of ['bolus', 'fluid', 'inject-crisis', 'hhs-osmolality-trajectory-response']) hostile.apply({ tick: 90000, type, payload: { action: 'iv-rescue', amount: 999, notes: 'private-value' } });
    for (const action of [null, {}, '__proto__', 'private-value']) hostile.apply({ tick: 90000, type: 'severe-hypoglycemia-response', payload: { action } as never });
    const frame = hostile.step(); expect(frame.state).toEqual(control.step().state); expect(JSON.stringify(frame.events)).not.toContain('private-value');
    expect(frame.equipment.resuscitation.severeHypoglycemia?.firstRescueAtTick).toBeNull();
  });
});
