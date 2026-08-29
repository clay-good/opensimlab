import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/paired-reading-a-number-wrong-in-one-direction';
import { PAIRED_READING_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/paired-reading-fixtures';
import { PairedReading, PAIRED_READING_OXIMETER_PERCENT as OXIMETER,
  PAIRED_READING_ARTERIAL_PERCENT as ARTERIAL, PAIRED_READING_GAS_TICKS as GAS,
  PAIRED_READING_REVIEW_TICKS as REVIEW, PAIRED_READING_TAKEOVER_TICKS as STOP,
  PAIRED_READING_ACTIONS, type PairedReadingAction } from '../../src/modules/medical-surgical-nursing/paired-reading';

type Choices = readonly (readonly [number, PairedReadingAction])[];

function drive(actions: Choices, until: number) {
  const model = new PairedReading();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Nursing paired oximetry reading contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The error must run toward reassurance, or the lesson is about something else.
  it('overestimates, and the displayed number never moves', () => {
    expect(OXIMETER).toBeGreaterThan(ARTERIAL);
    for (const until of [10, GAS + 10, REVIEW + 10, STOP - 10]) {
      const run = drive([[0, 'check-oximeter']], until);
      expect(run.snapshot.oximeterPercent).toBe(OXIMETER);
      expect(run.snapshot.oximeterRecord!.readingPercent).toBe(OXIMETER);
      expect(run.snapshot.oximeterRecord!.goodTrace).toBe(true);
    }
  });

  it('withholds the arterial value until the sample returns', () => {
    expect(drive([], GAS - 10).snapshot.arterialPercent).toBeNull();
    expect(drive([], GAS - 10).snapshot.gasReturned).toBe(false);
    const returned = drive([], GAS + 10);
    expect(returned.ids).toContain('gas-returned');
    expect(returned.snapshot.arterialPercent).toBe(ARTERIAL);
  });

  it('refuses pairing, characterising, and escalating before the sample returns', () => {
    const early = drive([[0, 'record-the-paired-values'], [1, 'record-what-the-gap-is-not'],
      [2, 'escalate-on-the-arterial-value']], 20);
    expect(early.ids).toContain('pairing-refused');
    expect(early.ids).toContain('explanation-refused');
    expect(early.ids).toContain('escalation-refused');
    expect(early.snapshot.choiceFeedback).toContain('escalating on the number that is in question');
  });

  it('records both values and leaves the reading unamended', () => {
    const run = drive([[GAS + 10, 'record-the-paired-values']], GAS + 20);
    const text = run.snapshot.choiceFeedback!;
    expect(text).toContain('same minute, same patient');
    expect(text).toContain('not amended and not deleted');
    expect(run.snapshot.oximeterPercent).toBe(OXIMETER);
  });

  it('names the mechanism as optical, and refuses the bedside fixes', () => {
    const gap = drive([[GAS + 10, 'record-the-paired-values'], [GAS + 11, 'record-what-the-gap-is-not']], GAS + 20);
    const text = gap.snapshot.choiceFeedback!;
    expect(text).toContain('not a poor trace, a cold hand, nail varnish, motion, or a malpositioned probe');
    expect(text).toContain('skin pigmentation changes that absorbance');
    expect(text).toContain('moderate certainty');
    const reposition = drive([[0, 'reposition-the-probe']], 10);
    expect(reposition.ids).toContain('reposition-refused');
    expect(reposition.snapshot.choiceFeedback).toContain('optical, in how light is absorbed');
    const warm = drive([[0, 'warm-the-hand']], 10);
    expect(warm.ids).toContain('warming-refused');
    expect(warm.snapshot.choiceFeedback).toContain('trace here is already good');
  });

  it('refuses the steady trend and the assumed regulatory fix', () => {
    const trend = drive([[0, 'trust-the-oximeter-trend']], 10);
    expect(trend.ids).toContain('trend-refused');
    expect(trend.snapshot.choiceFeedback).toContain('A steady overestimate is steady');
    const standard = drive([[0, 'the-device-standard-was-fixed']], 10);
    expect(standard.ids).toContain('standard-refused');
    // The guidance governs future submissions; it does not touch devices in service.
    expect(standard.snapshot.choiceFeedback).toContain('does not recall, recalibrate, or replace');
    expect(standard.snapshot.standardAssumedFixed).toBe(true);
  });

  it('never sends a review that nobody requested', () => {
    const idle = drive([], REVIEW + 6000);
    expect(idle.ids).not.toContain('review-arrived');
    const called = drive([[GAS + 10, 'escalate-on-the-arterial-value']], GAS + REVIEW + 20);
    expect(called.ids).toContain('review-arrived');
    expect(called.snapshot.reviewArrived).toBe(true);
  });

  it('finds no fault with the device or the person who read it', () => {
    const run = drive([[GAS + 10, 'escalate-on-the-arterial-value'], [GAS + REVIEW + 20, 'reassess']], GAS + REVIEW + 30);
    const arrived = run.ids.includes('review-arrived');
    expect(arrived).toBe(true);
    expect(run.snapshot.reviewObserved).toBe(true);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    // The arterial result changes what is known, so a reassessment before it cannot satisfy handoff.
    const stale: Choices = [[0, 'record-the-oximeter-reading'], [1, 'review-boundaries'], [2, 'monitor'],
      [3, 'reassess'], [GAS + 10, 'record-the-paired-values'], [GAS + 11, 'record-what-the-gap-is-not'],
      [GAS + 12, 'escalate-on-the-arterial-value'], [GAS + 13, 'handoff']];
    expect(drive(stale, GAS + 20).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 45030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.reviewObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 45040);
    expect(recovered.snapshot.repositionAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-the-oximeter-reading'], [5000, 'record-the-oximeter-reading']], 5010);
    expect(twice.ids.filter((id) => id === 'oximeter-recorded')).toHaveLength(1);
    expect(twice.snapshot.oximeterRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(GAS).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('gas-returned');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'oxygen', doseMg: 1 } });
    engine.apply({ tick: 0, type: 'counted-rate-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'paired-reading-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'paired-reading-response', payload: { action: 'start-oxygen' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('paired-reading-generic-action-refused');
    expect(ids).toContain('paired-reading-action-refused');
    expect(frame.equipment.resuscitation.pairedReading!.monitoringAtTick).toBeNull();
  });

  it('names no agent, dose, or oxygen setting after ANY action', () => {
    const forbidden = ['litres per minute', 'venturi', 'nasal cannula', 'mg/kg', 'milligram'];
    for (const action of PAIRED_READING_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'paired-reading-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.pairedReading!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(PAIRED_READING_ACTIONS).size).toBe(PAIRED_READING_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
