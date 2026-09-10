/**
 * Two numbers that move apart, and neither of them is a scoreboard.
 *
 * The creatine kinase climbs across the rehearsal while the creatinine and urine output hold
 * exactly where they started. That divergence is the lesson, so it is asserted directly: if a
 * later change ever let the kidney follow the muscle, or let good care bend either number, the
 * lab would be teaching the opposite of what its sources say.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_RHABDOMYOLYSIS_NUMBER as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/rhabdomyolysis-a-number-that-does-not-carry-the-risk';
import { RENAL_RHABDOMYOLYSIS_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/rhabdomyolysis-fixtures';
import { RENAL_RHABDOMYOLYSIS_SERIAL_TICKS as SERIAL, RENAL_RHABDOMYOLYSIS_DELAY_TICKS as DELAY,
  RENAL_RHABDOMYOLYSIS_TAKEOVER_TICKS as TAKEOVER, supportsRenalRhabdomyolysis,
  type RenalRhabdomyolysisAction } from '../../src/modules/renal-electrolyte/rhabdomyolysis';
import { RENAL_CONTRAST_ATTRIBUTION_LABEL as CONTRAST } from '../../src/modules/renal-electrolyte/scenarios/contrast-attribution-a-label-that-stopped-the-search';

type Choices = readonly (readonly [number, RenalRhabdomyolysisAction])[];
const choice = (tick: number, action: RenalRhabdomyolysisAction): LearnerAction =>
  ({ tick, type: 'renal-rhabdomyolysis-response', payload: { action } });

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
  return { events, snapshot: last.equipment.resuscitation.renalRhabdomyolysis! };
}
const saw = (events: readonly EngineEvent[], fragment: string) =>
  events.some((event) => event.eventId.startsWith(`renal-rhabdomyolysis-${fragment}-`));
const CARE: Choices = [[0, 'examine-compartments'], [1, 'review-cause'], [2, 'arrange-fluids'],
  [3, 'review-number'], [4, 'review-additions'], [5, 'call-support'], [6, 'monitor']];

describe('Requirement: the rhabdomyolysis lesson runs on its own engine', () => {
  it('claims this scenario and no other', () => {
    expect(supportsRenalRhabdomyolysis(SCENARIO)).toBe(true);
    expect(supportsRenalRhabdomyolysis(CONTRAST)).toBe(false);
    expect(supportsRenalRhabdomyolysis({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } })).toBe(false);
  });

  it('refuses every action that is not one of this lesson’s declared choices', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 1, type: 'fluid', payload: { volumeMl: 1000 } } as unknown as LearnerAction);
    expect(saw(engine.step().events, 'generic-action-refused')).toBe(true);
    engine.apply(choice(2, 'fasciotomy' as RenalRhabdomyolysisAction));
    expect(saw(engine.step().events, 'action-refused')).toBe(true);
  });

  it('raises the creatine kinase and leaves the kidney exactly where it was', () => {
    const { snapshot } = run([...CARE, [SERIAL + 10, 'reassess']], SERIAL + 20);
    expect(snapshot.serialOpened).toBe(true);
    expect(snapshot.observation!.creatineKinaseUL).toBe(61000);
    // The kidney does not follow the muscle. That divergence is the whole lab.
    expect(snapshot.observation!.creatinineUmolL).toBe(88);
    expect(snapshot.observation!.urineMlPerKgPerHour).toBeCloseTo(1.4, 2);
    expect(snapshot.observation!.potassiumMmolL).toBe(4.4);
  });

  it('never lets good care bend either number', () => {
    // Same tick, same reassessment, opposite amounts of care taken beforehand.
    const cared = run([...CARE, [10, 'reassess']], 20);
    const neglected = run([[10, 'reassess']], 20);
    expect(neglected.snapshot.observation!.creatinineUmolL)
      .toBe(cared.snapshot.observation!.creatinineUmolL);
    expect(neglected.snapshot.observation!.creatineKinaseUL)
      .toBe(cared.snapshot.observation!.creatineKinaseUL);
    expect(cared.snapshot.observation!.creatineKinaseUL).toBe(48000);
    // Only the authored serial checkpoint moves it, and the checkpoint is a clock, not a reward.
    expect(run([...CARE, [SERIAL + 10, 'reassess']], SERIAL + 20)
      .snapshot.observation!.creatineKinaseUL).toBe(61000);
  });

  it('records the compartment examination as a finding that must be repeated', () => {
    const { events, snapshot } = run([[0, 'examine-compartments']], 10);
    expect(snapshot.compartmentExaminedAtTick).not.toBeNull();
    const examination = events.find((event) =>
      event.eventId.startsWith('renal-rhabdomyolysis-compartment-examination-'))!;
    expect(examination.message).toContain('a bedside finding that must be repeated, not a result');
    expect(examination.message).toContain('no creatine kinase value rules a compartment syndrome in or out');
  });

  it('refuses replacement therapy on the number, without claiming he will never need it', () => {
    const { events, snapshot } = run([[0, 'dialyse-on-number']], 5);
    expect(saw(events, 'dialysis-refused')).toBe(true);
    expect(snapshot.dialysisOnNumberAttempted).toBe(true);
    const refusal = events.find((event) => event.eventId.startsWith('renal-rhabdomyolysis-dialysis-refused-'))!;
    expect(refusal.message).toContain('not a claim that this patient will never need replacement therapy');
  });

  it('refuses the two additions, and says the evidence is weak in both directions', () => {
    const { events, snapshot } = run([[0, 'add-bicarbonate-and-mannitol']], 5);
    expect(saw(events, 'additions-refused')).toBe(true);
    expect(snapshot.additionsAttempted).toBe(true);
    const refusal = events.find((event) => event.eventId.startsWith('renal-rhabdomyolysis-additions-refused-'))!;
    expect(refusal.message).toContain('rather than proof they are useless');
  });

  it('reaches the authored unexamined contrast and points back at the bedside', () => {
    const { events, snapshot } = run([[0, 'review-cause']], DELAY + 5);
    expect(saw(events, 'unexamined-contrast')).toBe(true);
    expect(snapshot.unexaminedContrastObserved).toBe(true);
    const contrast = events.find((event) =>
      event.eventId.startsWith('renal-rhabdomyolysis-unexamined-contrast-'))!;
    expect(contrast.message).toContain('found at the bedside');
    expect(contrast.message).toContain('not a safe waiting period');
  });

  it('refuses handoff until the serial results are back and everything is recorded', () => {
    const { events, snapshot } = run([...CARE, [7, 'handoff']], 20);
    expect(saw(events, 'handoff-refused')).toBe(true);
    expect(snapshot.ended).toBeNull();
    const refusal = events.find((event) => event.eventId.startsWith('renal-rhabdomyolysis-handoff-refused-'))!;
    expect(refusal.message).toContain('A falling creatine kinase, a normal value');
  });

  it('hands over without naming a peak or a discharge criterion', () => {
    const { events, snapshot } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    const handoff = events.find((event) => /^renal-rhabdomyolysis-handoff-\d+$/.test(event.eventId))!;
    expect(handoff.message).toContain('neither of those is the discharge criterion');
    expect(handoff.message).toContain('this rehearsal supplies none');
  });

  it('bounds a run in which nobody examines the limbs or owns the fluid', () => {
    const { events, snapshot } = run([], TAKEOVER + 1);
    expect(saw(events, 'instructor-takeover')).toBe(true);
    expect(snapshot.ended).toBe('instructor-takeover');
  });

  it('lets the recovery fixture reach handoff after two refused choices', () => {
    const { snapshot } = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.dialysisOnNumberAttempted).toBe(true);
    expect(snapshot.additionsAttempted).toBe(true);
  });

  it('leaves the common-error fixture unfinished with nobody having examined the limbs', () => {
    const { snapshot } = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 5);
    expect(snapshot.ended).toBeNull();
    expect(snapshot.compartmentExaminedAtTick).toBeNull();
  });

  it('meets every objective on the expert path', () => {
    const { events } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events)).toHaveLength(SCENARIO.metadata.objectives.length);
  });
});
