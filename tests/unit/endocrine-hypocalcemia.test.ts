import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import {
  Hypocalcemia, supportsHypocalcemia, HYPOCALCEMIA_DELAY_TICKS, HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS,
  HYPOCALCEMIA_RECURRENCE_TICKS, HYPOCALCEMIA_RESPONSE_TICKS, HYPOCALCEMIA_TAKEOVER_TICKS,
  HYPOCALCEMIA_SESSION_TICKS, type HypocalcemiaAction,
} from '../../src/modules/endocrine-metabolic/hypocalcemia';
import { HYPOCALCEMIA_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/hypocalcemia-fixtures';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';

const care: readonly HypocalcemiaAction[] = ['calcium-rescue', 'assess-risk', 'review-cause', 'magnesium', 'continuing-care', 'call-support'];
const complete = (model: Hypocalcemia, at = 0) => { for (const action of care) model.apply(action, at); };

describe('Hypocalcemia: urgent rescue, recurrence, and observed continuing care', () => {
  it('binds the declared narrative shape and version without accepting adjacent scenarios', () => {
    expect(supportsHypocalcemia(SCENARIO)).toBe(true);
    expect(FIXTURES).toMatchObject({ scenarioId: SCENARIO.metadata.id, contentVersion: SCENARIO.metadata.version, seed: 4906 });
    for (const other of [ROUTINE_INDUCTION, { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, type: 'surgical-stimulus' as const }] }]) {
      expect(supportsHypocalcemia(other)).toBe(false);
    }
  });

  it.each(['calcium-rescue', 'assess-risk', 'review-cause', 'call-support'] as const)('accepts %s independently and only once', (action) => {
    const model = new Hypocalcemia(); const before = model.vitals();
    expect(model.apply(action, 0)).toHaveLength(1);
    expect(model.apply(action, 1)).toEqual([]);
    expect(model.vitals()).toEqual(before);
    expect(model.snapshot(1).observation).toBeNull();
  });

  it.each(['magnesium', 'continuing-care'] as const)('requires known cause findings for %s without delaying rescue or inventing a wait', (action) => {
    const model = new Hypocalcemia();
    expect(model.apply(action, 0).at(-1)?.id).toMatch(/review-refused$/);
    expect(model.apply('calcium-rescue', 0).at(-1)?.id).toBe('calcium-rescue');
    model.apply('review-cause', 0);
    expect(model.apply(action, 0).at(-1)?.id).toBe(action);
    expect(model.apply(action, 1)).toEqual([]);
    expect(model.snapshot(1)).toMatchObject({ causeReviewedAtTick: 0, calciumAtTick: 0, responseDueInSeconds: null });
  });

  it('applies deterioration and the missing-rescue stop only at their exact authored boundaries', () => {
    const model = new Hypocalcemia(); model.apply('review-cause', 0); model.apply('magnesium', 0);
    expect(model.advance(HYPOCALCEMIA_DELAY_TICKS - 1)).toEqual([]);
    expect(model.advance(HYPOCALCEMIA_DELAY_TICKS).map(({ id }) => id)).toEqual(['urgent-treatment-delay']);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 110, adjustedCalciumMgDl: 6.6 });
    expect(model.advance(HYPOCALCEMIA_TAKEOVER_TICKS - 1)).toEqual([]);
    expect(model.advance(HYPOCALCEMIA_TAKEOVER_TICKS).map(({ id }) => id)).toEqual(['instructor-takeover']);
    expect(model.snapshot(HYPOCALCEMIA_TAKEOVER_TICKS).ended).toBe('instructor-takeover');
  });

  it('allows late rescue before takeover without erasing the missed urgent-care evidence', () => {
    const model = new Hypocalcemia(); model.advance(HYPOCALCEMIA_DELAY_TICKS);
    model.apply('calcium-rescue', HYPOCALCEMIA_TAKEOVER_TICKS - 1);
    model.advance(HYPOCALCEMIA_TAKEOVER_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_TAKEOVER_TICKS)).toMatchObject({ ended: null, urgentTreatmentDelayed: true });
    model.advance(HYPOCALCEMIA_TAKEOVER_TICKS - 1 + HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 90, adjustedCalciumMgDl: 7 });
  });

  it('keeps response progression separate from historical observations', () => {
    const model = new Hypocalcemia(); complete(model, 7); model.apply('reassess', 7);
    const initial = model.snapshot(7).observation;
    const early = 7 + HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS;
    expect(model.snapshot(early - 1).calciumDueInSeconds).toBe(1);
    expect(model.advance(early - 1)).toEqual([]);
    expect(model.advance(early).map(({ id }) => id)).toEqual(['calcium-response']);
    expect(model.snapshot(early)).toMatchObject({ calciumResponseObserved: false, observation: initial });
    expect(model.vitals().adjustedCalciumMgDl).toBe(7);
    model.apply('reassess', early); expect(model.snapshot(early).calciumResponseObserved).toBe(true);
    expect(model.apply('handoff', early).at(-1)?.id).toBe('handoff-refused');
    const later = 7 + HYPOCALCEMIA_RESPONSE_TICKS;
    expect(model.advance(later - 1)).toEqual([]);
    expect(model.snapshot(later - 1).responseDueInSeconds).toBe(1);
    expect(model.advance(later).map(({ id }) => id)).toEqual(['response']);
    expect(model.snapshot(later)).toMatchObject({ responseObserved: false, observation: { atTick: early, adjustedCalciumMgDl: 7 } });
    expect(model.apply('handoff', later).at(-1)?.id).toBe('handoff-refused');
    model.apply('reassess', later); model.apply('handoff', later + 1);
    expect(model.snapshot(later + 1)).toMatchObject({ ended: 'handoff', responseObserved: true, durableRecoveryProven: false });
  });

  it('does not award an earlier observation for a late assessment or block an appropriate handoff', () => {
    const model = new Hypocalcemia(); complete(model);
    model.advance(HYPOCALCEMIA_RESPONSE_TICKS);
    model.apply('reassess', HYPOCALCEMIA_RESPONSE_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS)).toMatchObject({ calciumResponseObserved: false, responseObserved: true });
    model.apply('handoff', HYPOCALCEMIA_RESPONSE_TICKS + 1);
    expect(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS + 1).ended).toBe('handoff');
  });

  it.each(['magnesium', 'continuing-care'] as const)('exposes recurrence when %s remains absent, then permits correction with evidence retained', (missing) => {
    const model = new Hypocalcemia();
    for (const action of care) if (action !== missing) model.apply(action, 0);
    model.advance(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS); model.apply('reassess', HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    expect(model.advance(HYPOCALCEMIA_RECURRENCE_TICKS - 1)).toEqual([]);
    expect(model.advance(HYPOCALCEMIA_RECURRENCE_TICKS).map(({ id }) => id)).toEqual(['recurrence']);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 106, adjustedCalciumMgDl: 6.7 });
    expect(model.snapshot(HYPOCALCEMIA_RECURRENCE_TICKS)).toMatchObject({ recurrenceOccurred: true,
      observation: { atTick: HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS, adjustedCalciumMgDl: 7 } });
    model.apply('reassess', HYPOCALCEMIA_RECURRENCE_TICKS);
    const corrected = HYPOCALCEMIA_RECURRENCE_TICKS + 1; model.apply(missing, corrected);
    expect(model.vitals().adjustedCalciumMgDl).toBe(6.7);
    expect(model.snapshot(corrected).responseDueInSeconds).toBe(3600);
    model.advance(corrected + HYPOCALCEMIA_RESPONSE_TICKS);
    expect(model.vitals()).toMatchObject({ heartRateBpm: 86, adjustedCalciumMgDl: 7.2 });
    expect(model.snapshot(corrected + HYPOCALCEMIA_RESPONSE_TICKS).recurrenceOccurred).toBe(true);
  });

  it.each(['magnesium', 'continuing-care'] as const)('avoids the recurrence branch when %s is supplied just before its checkpoint', (last) => {
    const model = new Hypocalcemia();
    for (const action of care) if (action !== last) model.apply(action, 0);
    model.apply(last, HYPOCALCEMIA_RECURRENCE_TICKS - 1); model.advance(HYPOCALCEMIA_RECURRENCE_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_RECURRENCE_TICKS).recurrenceOccurred).toBe(false);
    expect(model.snapshot(HYPOCALCEMIA_RECURRENCE_TICKS).responseDueInSeconds).toBe(3600);
  });

  it.each(['oral-only', 'wait-for-labs', 'wait-for-magnesium'] as const)('retains %s as an earlier choice but rejects inventing it after rescue', (action) => {
    const model = new Hypocalcemia(); expect(model.apply(action, 0).at(-1)?.id).toBe(`${action}-choice`);
    model.apply('calcium-rescue', 1);
    expect(model.apply(action, 2).at(-1)?.id).toBe('action-refused');
    const correct = new Hypocalcemia(); correct.apply('calcium-rescue', 0); correct.apply(action, 1);
    expect(correct.snapshot(1)).toMatchObject({ oralOnlyChosen: false, waitForLabsChosen: false, waitForMagnesiumChosen: false });
  });

  it('refuses to stop after relief without actually withdrawing treatment', () => {
    const model = new Hypocalcemia(); complete(model);
    expect(model.apply('stop-after-relief', 0).at(-1)?.id).toBe('action-refused');
    expect(model.snapshot(0).stopAfterReliefAttempted).toBe(false);
    model.advance(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    expect(model.apply('stop-after-relief', HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS).at(-1)?.id).toBe('stop-after-relief-refused');
    expect(model.snapshot(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS)).toMatchObject({ continuingCareAtTick: 0, stopAfterReliefAttempted: true });
  });

  it.each(care)('bounds an unfinished pathway missing %s without claiming completed care', (missing) => {
    const model = new Hypocalcemia();
    for (const action of care) if (action !== missing) model.apply(action, 0);
    model.advance(HYPOCALCEMIA_RESPONSE_TICKS); model.apply('reassess', HYPOCALCEMIA_RESPONSE_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS).responseObserved).toBe(false);
    model.advance(HYPOCALCEMIA_SESSION_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_SESSION_TICKS).ended).toBe('instructor-takeover');
  });

  it('copies observations and freezes ended state while refusing hostile values without echoing them', () => {
    const model = new Hypocalcemia();
    for (const action of [null, {}, '__proto__', { action: 'calcium-rescue', private: 'private-value' }]) {
      expect(model.apply(action, 0)).toEqual([{ id: 'action-refused', message: 'That choice is not part of this fictional hypocalcemia lesson. Nothing changed.' }]);
    }
    model.apply('reassess', 0); const observation = model.snapshot(0).observation!;
    (observation as { adjustedCalciumMgDl: number }).adjustedCalciumMgDl = 99;
    expect(model.snapshot(0).observation?.adjustedCalciumMgDl).toBe(6.6);
    model.advance(HYPOCALCEMIA_TAKEOVER_TICKS); const ended = model.snapshot(HYPOCALCEMIA_TAKEOVER_TICKS);
    for (const action of care) model.apply(action, HYPOCALCEMIA_SESSION_TICKS);
    model.advance(HYPOCALCEMIA_SESSION_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_SESSION_TICKS)).toEqual(ended);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s tick with identical state and event evidence', (path) => {
    const run = () => {
      const model = new Hypocalcemia(); const hash = createHash('sha256');
      for (let tick = 0; tick <= HYPOCALCEMIA_SESSION_TICKS; tick += 1) {
        const events = model.advance(tick);
        for (const [at, action] of FIXTURES[path]) if (at === tick) events.push(...model.apply(action, tick));
        hash.update(JSON.stringify({ tick, vitals: model.vitals(), patient: model.snapshot(tick), events }));
      }
      return { hash: hash.digest('hex'), patient: model.snapshot(HYPOCALCEMIA_SESSION_TICKS) };
    };
    const first = run(); expect(run()).toEqual(first);
    expect(first.patient.ended).toBe(path === 'expert' || path === 'recovery' ? 'handoff' : 'instructor-takeover');
    expect(first.patient.durableRecoveryProven).toBe(false);
  });
});
