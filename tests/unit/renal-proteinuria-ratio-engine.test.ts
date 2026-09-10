/**
 * The only lesson in this module where the missing measurement can actually be obtained.
 *
 * Slices 10 and 11 end with the question open because nothing available would close it. Here
 * the answer cost one request nobody made, and the matched sample comes back at 189 mg/g. The
 * engine has to narrow the question without closing it: a matched value that started reading as
 * proof would turn "measure it properly" into "and then you will know", which is the next
 * mistake along.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_PROTEINURIA_RATIO as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not';
import { RENAL_PROTEINURIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/proteinuria-ratio-fixtures';
import { RENAL_PROTEINURIA_REPEAT_TICKS as REPEAT, RENAL_PROTEINURIA_DELAY_TICKS as DELAY,
  RENAL_PROTEINURIA_TAKEOVER_TICKS as TAKEOVER, RENAL_PROTEINURIA_PREVIOUS_MG_PER_G as PREVIOUS,
  RENAL_PROTEINURIA_CURRENT_MG_PER_G as CURRENT, RENAL_PROTEINURIA_REPEAT_MG_PER_G as MATCHED,
  supportsRenalProteinuriaRatio, type RenalProteinuriaAction } from '../../src/modules/renal-electrolyte/proteinuria-ratio';
import { RENAL_PHOSPHATE_TARGET as PHOSPHATE } from '../../src/modules/renal-electrolyte/scenarios/phosphate-target-a-surrogate-that-moved-the-wrong-way';

type Choices = readonly (readonly [number, RenalProteinuriaAction])[];
const choice = (tick: number, action: RenalProteinuriaAction): LearnerAction =>
  ({ tick, type: 'renal-proteinuria-ratio-response', payload: { action } });

function run(actions: Choices, until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const events: EngineEvent[] = [];
  let next = 0;
  let last = engine.step();
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    last = engine.step();
    events.push(...last.events);
  }
  expect(next, 'every fixture action was dispatched').toBe(actions.length);
  return { events, snapshot: last.equipment.resuscitation.renalProteinuriaRatio! };
}
const saw = (events: readonly EngineEvent[], fragment: string) =>
  events.some((event) => event.eventId.startsWith(`renal-proteinuria-${fragment}-`));
const REVIEW: Choices = [[0, 'compare-variation'], [1, 'review-sampling'], [2, 'review-patient'],
  [3, 'request-repeat'], [4, 'own-decision'], [5, 'call-support'], [6, 'monitor']];

describe('Requirement: the proteinuria lesson runs on its own engine', () => {
  it('claims this scenario and no other', () => {
    expect(supportsRenalProteinuriaRatio(SCENARIO)).toBe(true);
    expect(supportsRenalProteinuriaRatio(PHOSPHATE)).toBe(false);
    expect(supportsRenalProteinuriaRatio({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } })).toBe(false);
  });

  it('refuses every action that is not one of this lesson’s declared choices', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 1, type: 'fluid', payload: { volumeMl: 250 } } as unknown as LearnerAction);
    expect(saw(engine.step().events, 'generic-action-refused')).toBe(true);
    engine.apply(choice(2, 'order-biopsy' as RenalProteinuriaAction));
    expect(saw(engine.step().events, 'action-refused')).toBe(true);
  });

  it('states the arithmetic the lesson turns on', () => {
    // +86% against a reference change of +124%: inside the band, and that is the whole case.
    expect(Math.round(((CURRENT - PREVIOUS) / PREVIOUS) * 100)).toBe(86);
    const { events } = run([[0, 'compare-variation']], 5);
    const comparison = events.find((event) =>
      event.eventId.startsWith('renal-proteinuria-variation-comparison-'))!;
    expect(comparison.message).toContain('+86%');
    expect(comparison.message).toContain('+124% and −55%');
    expect(comparison.message).toContain('does not establish it is noise');
    expect(comparison.message).toContain('does not establish it is real');
  });

  it('returns the matched sample only when it is asked for, and narrows without closing', () => {
    const unrequested = run([[0, 'compare-variation'], [REPEAT + 10, 'reassess']], REPEAT + 20);
    expect(unrequested.snapshot.repeatReturned).toBe(false);
    expect(unrequested.snapshot.observation!.ratioMgPerG).toBe(CURRENT);
    expect(unrequested.snapshot.observation!.firstMorning).toBe(false);

    const requested = run([...REVIEW, [REPEAT + 10, 'reassess']], REPEAT + 20);
    expect(requested.snapshot.repeatReturned).toBe(true);
    expect(requested.snapshot.observation!.ratioMgPerG).toBe(MATCHED);
    expect(requested.snapshot.observation!.firstMorning).toBe(true);
    const checkpoint = requested.events.find((event) =>
      event.eventId.startsWith('renal-proteinuria-repeat-checkpoint-'))!;
    expect(checkpoint.message).toContain('narrows the question');
    expect(checkpoint.message).toContain('does not prove that nothing changed');
  });

  it('never moves the clinical findings', () => {
    const early = run([[0, 'check-clinical']], 10);
    const late = run([...REVIEW, [REPEAT + 10, 'reassess']], REPEAT + 20);
    expect(early.snapshot.clinicalObservation).toMatchObject({ systolicMmHg: 128, weightKg: 71 });
    expect(late.snapshot.observation!.systolicMmHg).toBe(128);
    expect(late.snapshot.observation!.weightKg).toBe(71);
  });

  it('refuses a treatment change without endorsing the current treatment', () => {
    const { events, snapshot } = run([[0, 'change-treatment']], 5);
    expect(saw(events, 'change-treatment-refused')).toBe(true);
    expect(snapshot.changeTreatmentAttempted).toBe(true);
    const refusal = events.find((event) =>
      event.eventId.startsWith('renal-proteinuria-change-treatment-refused-'))!;
    expect(refusal.message).toContain('not a claim that her disease is stable');
    expect(refusal.message).toContain('does not say her treatment is correct as it stands');
  });

  it('refuses the progression label without supplying the opposite label', () => {
    const { events, snapshot } = run([[0, 'call-it-progression']], 5);
    expect(saw(events, 'progression-refused')).toBe(true);
    expect(snapshot.callItProgressionAttempted).toBe(true);
    const refusal = events.find((event) =>
      event.eventId.startsWith('renal-proteinuria-progression-refused-'))!;
    expect(refusal.message).toContain('Refusing the label is not the opposite label');
    expect(refusal.message).toContain('nothing here establishes that she is stable either');
  });

  it('reaches the authored uncompared contrast', () => {
    const { events, snapshot } = run([[0, 'check-ratio']], DELAY + 5);
    expect(saw(events, 'uncompared-contrast')).toBe(true);
    expect(snapshot.uncomparedContrastObserved).toBe(true);
  });

  it('refuses handoff until the matched sample is back', () => {
    const { events, snapshot } = run([...REVIEW, [7, 'handoff']], 20);
    expect(saw(events, 'handoff-refused')).toBe(true);
    expect(snapshot.ended).toBeNull();
    const refusal = events.find((event) => event.eventId.startsWith('renal-proteinuria-handoff-refused-'))!;
    expect(refusal.message).toContain('is not a handoff gate and is not produced');
  });

  it('hands over a narrower question, still open', () => {
    const { events, snapshot } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    const handoff = events.find((event) => /^renal-proteinuria-handoff-\d+$/.test(event.eventId))!;
    expect(handoff.message).toContain('narrower and still open');
    expect(handoff.message).toContain('no timed collection, cause, progression, or stability is established');
  });

  it('bounds a run in which nobody compares the change', () => {
    const { events, snapshot } = run([], TAKEOVER + 1);
    expect(saw(events, 'instructor-takeover')).toBe(true);
    expect(snapshot.ended).toBe('instructor-takeover');
  });

  it('lets the recovery fixture reach handoff after two refused choices', () => {
    const { snapshot } = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.changeTreatmentAttempted).toBe(true);
    expect(snapshot.callItProgressionAttempted).toBe(true);
  });

  it('leaves the common-error fixture unfinished with no repeat requested', () => {
    const { snapshot } = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 5);
    expect(snapshot.ended).toBeNull();
    expect(snapshot.repeatRequestedAtTick).toBeNull();
  });

  it('meets every objective on the expert path', () => {
    const { events } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events)).toHaveLength(SCENARIO.metadata.objectives.length);
  });
});
