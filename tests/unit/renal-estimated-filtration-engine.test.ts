/**
 * The lesson that never gives the learner the answer.
 *
 * Every other lab in this module eventually hands over something firmer than it started with.
 * This one supplies two estimates that disagree and then stops, and the measured filtration
 * line is null in every observation the engine can produce. That absence is the teaching, so it
 * is asserted exhaustively: a future change that quietly supplied a "true" value, or that let
 * one estimate move toward the other, would turn the lab into the opposite of itself.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { RENAL_ESTIMATED_FILTRATION as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/estimated-filtration-a-number-she-was-never-measured-by';
import { RENAL_ESTIMATE_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/estimated-filtration-fixtures';
import { RENAL_ESTIMATE_SECOND_MARKER_TICKS as MARKER, RENAL_ESTIMATE_DELAY_TICKS as DELAY,
  RENAL_ESTIMATE_TAKEOVER_TICKS as TAKEOVER, supportsRenalEstimatedFiltration,
  type RenalEstimateAction } from '../../src/modules/renal-electrolyte/estimated-filtration';
import { RENAL_RHABDOMYOLYSIS_NUMBER as RHABDO } from '../../src/modules/renal-electrolyte/scenarios/rhabdomyolysis-a-number-that-does-not-carry-the-risk';

type Choices = readonly (readonly [number, RenalEstimateAction])[];
const choice = (tick: number, action: RenalEstimateAction): LearnerAction =>
  ({ tick, type: 'renal-estimated-filtration-response', payload: { action } });

function run(actions: Choices, until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const events: EngineEvent[] = [];
  const everyObservation: (typeof last)['equipment']['resuscitation']['renalEstimatedFiltration'][] = [];
  let next = 0;
  let last = engine.step();
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    last = engine.step();
    events.push(...last.events);
    everyObservation.push(last.equipment.resuscitation.renalEstimatedFiltration);
  }
  expect(next, 'every fixture action was dispatched').toBe(actions.length);
  return { events, snapshot: last.equipment.resuscitation.renalEstimatedFiltration!, everyObservation };
}
const saw = (events: readonly EngineEvent[], fragment: string) =>
  events.some((event) => event.eventId.startsWith(`renal-estimate-${fragment}-`));
const REVIEW: Choices = [[0, 'review-precision'], [1, 'review-generation'], [2, 'request-second-marker'],
  [3, 'own-medicine-decision'], [4, 'call-support'], [5, 'monitor']];

describe('Requirement: the estimated-filtration lesson runs on its own engine', () => {
  it('claims this scenario and no other', () => {
    expect(supportsRenalEstimatedFiltration(SCENARIO)).toBe(true);
    expect(supportsRenalEstimatedFiltration(RHABDO)).toBe(false);
    expect(supportsRenalEstimatedFiltration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } })).toBe(false);
  });

  it('refuses every action that is not one of this lesson’s declared choices', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 1, type: 'bolus', payload: { drugId: 'x', micrograms: 1 } } as unknown as LearnerAction);
    expect(saw(engine.step().events, 'generic-action-refused')).toBe(true);
    engine.apply(choice(2, 'measure-filtration' as RenalEstimateAction));
    expect(saw(engine.step().events, 'action-refused')).toBe(true);
  });

  it('never supplies a measured filtration rate, at any tick, on any path', () => {
    const { everyObservation } = run([...REVIEW, [MARKER + 10, 'review-discordance'],
      [MARKER + 11, 'reassess']], MARKER + 20);
    const observed = everyObservation.filter((snapshot) => snapshot?.observation);
    expect(observed.length).toBeGreaterThan(0);
    for (const snapshot of observed) {
      expect(snapshot!.observation!.measuredFiltration).toBeNull();
    }
  });

  it('returns a second estimate that disagrees, and never moves either one', () => {
    const { snapshot } = run([...REVIEW, [MARKER + 10, 'review-discordance'], [MARKER + 11, 'reassess']], MARKER + 20);
    expect(snapshot.secondMarkerReturned).toBe(true);
    expect(snapshot.observation!.creatinineEstimate).toBe(68);
    expect(snapshot.observation!.cystatinEstimate).toBe(38);
    // More than 30% apart, which is the threshold the cited cohort used.
    expect((68 - 38) / 68).toBeGreaterThan(0.3);
  });

  it('has nothing to compare before the marker returns', () => {
    const { snapshot } = run([[0, 'request-second-marker'], [1, 'check-second-marker'], [2, 'reassess']], 10);
    expect(snapshot.markerObservation!.cystatinEstimate).toBeNull();
    expect(snapshot.observation!.cystatinEstimate).toBeNull();
  });

  it('refuses a discordance review before there is a discordance', () => {
    const { events, snapshot } = run([[0, 'review-discordance']], 5);
    expect(saw(events, 'discordance-early')).toBe(true);
    expect(snapshot.discordanceReviewedAtTick).toBeNull();
  });

  it('refuses dosing on the estimate without saying the medicine is wrong', () => {
    const { events, snapshot } = run([[0, 'dose-on-estimate']], 5);
    expect(saw(events, 'dose-refused')).toBe(true);
    expect(snapshot.doseOnEstimateAttempted).toBe(true);
    const refusal = events.find((event) => event.eventId.startsWith('renal-estimate-dose-refused-'))!;
    expect(refusal.message).toContain('does not say the medicine is wrong for her');
    expect(refusal.message).toContain('does not select any other dose');
  });

  it('refuses resolving the disagreement by convenience', () => {
    const { events, snapshot } = run([[0, 'take-the-convenient-number']], 5);
    expect(saw(events, 'convenient-number-refused')).toBe(true);
    expect(snapshot.convenientNumberAttempted).toBe(true);
    const refusal = events.find((event) =>
      event.eventId.startsWith('renal-estimate-convenient-number-refused-'))!;
    expect(refusal.message).toContain('converts an open question into a false answer');
  });

  it('reaches the authored unreviewed contrast', () => {
    const { events, snapshot } = run([[0, 'check-creatinine']], DELAY + 5);
    expect(saw(events, 'unreviewed-contrast')).toBe(true);
    expect(snapshot.unreviewedContrastObserved).toBe(true);
  });

  it('refuses handoff until the disagreement has been recorded', () => {
    const { events, snapshot } = run([...REVIEW, [6, 'handoff']], 20);
    expect(saw(events, 'handoff-refused')).toBe(true);
    expect(snapshot.ended).toBeNull();
    const refusal = events.find((event) => event.eventId.startsWith('renal-estimate-handoff-refused-'))!;
    expect(refusal.message).toContain('none of them exists here');
  });

  it('hands over the uncertainty as uncertainty', () => {
    const { events, snapshot } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    const handoff = events.find((event) => /^renal-estimate-handoff-\d+$/.test(event.eventId))!;
    expect(handoff.message).toContain('What is handed on is the uncertainty, stated as uncertainty');
    expect(handoff.message).toContain('no measured filtration rate has been performed');
  });

  it('bounds a run in which the estimate is never read', () => {
    const { events, snapshot } = run([], TAKEOVER + 1);
    expect(saw(events, 'instructor-takeover')).toBe(true);
    expect(snapshot.ended).toBe('instructor-takeover');
  });

  it('lets the recovery fixture reach handoff after two refused choices', () => {
    const { snapshot } = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 5);
    expect(snapshot.ended).toBe('handoff');
    expect(snapshot.doseOnEstimateAttempted).toBe(true);
    expect(snapshot.convenientNumberAttempted).toBe(true);
  });

  it('leaves the common-error fixture unfinished with no marker requested', () => {
    const { snapshot } = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 5);
    expect(snapshot.ended).toBeNull();
    expect(snapshot.secondMarkerRequestedAtTick).toBeNull();
  });

  it('meets every objective on the expert path', () => {
    const { events } = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 5);
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], events)).toHaveLength(SCENARIO.metadata.objectives.length);
  });
});
