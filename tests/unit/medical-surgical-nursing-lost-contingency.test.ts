import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { limitationsFor } from '@platform/docs/limitations';
import type { EngineEvent } from '@platform/kernel/protocol';
import { LOST_CONTINGENCY_A_PLAN_THAT_WAS_NOT_SAID as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/lost-contingency-a-plan-that-was-not-said';
import { LOST_CONTINGENCY_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/lost-contingency-fixtures';
import { LostContingency, LOST_CONTINGENCY_SPOKEN as SPOKEN,
  LOST_CONTINGENCY_RECORDED as RECORDED,
  LOST_CONTINGENCY_OUTPUT_TICKS as OUTPUT,
  LOST_CONTINGENCY_CONFIRMATION_TICKS as CONFIRM,
  LOST_CONTINGENCY_TAKEOVER_TICKS as STOP,
  LOST_CONTINGENCY_SESSION_TICKS as SESSION,
  LOST_CONTINGENCY_ACTIONS, type LostContingencyAction } from '../../src/modules/medical-surgical-nursing/lost-contingency';

type Choices = readonly (readonly [number, LostContingencyAction])[];

function drive(actions: Choices, until: number) {
  const model = new LostContingency();
  const events: { id: string; tick: number }[] = [];
  const at = (tick: number, emitted: readonly { id: string }[]) =>
    events.push(...emitted.map((entry) => ({ id: entry.id, tick })));
  for (const [tick, action] of actions) {
    if (tick > 0) at(tick, model.advance(tick));
    at(tick, model.apply(action, tick));
  }
  at(until, model.advance(until));
  return { model, snapshot: model.snapshot(until), events, ids: events.map((entry) => entry.id) };
}

const engineLog = (events: readonly { id: string; tick: number }[]): EngineEvent[] =>
  events.map((entry) => ({ tick: entry.tick, eventId: `lost-contingency-${entry.id}-${entry.tick}`,
    category: 'assessment', severity: 'warning', message: 'Private event prose.' }));

/** Everything the guarded actions require, in order. */
const prerequisites: Choices = [[0, 'record-what-was-said'], [1, 'check-the-notes'],
  [2, 'record-the-gap-as-a-transmission-gap'], [3, 'reconstruct-the-contingency']];

describe('Nursing handover-loss contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The record is complete. That is the premise the whole lesson rests on, and it must hold on
  // every path: if any action could make the record the thing that failed, this is a different
  // and much more ordinary lesson about charting.
  it('never makes the record incomplete and never marks the contingency as spoken', () => {
    expect(RECORDED).toHaveLength(SPOKEN.length + 1);
    expect(RECORDED.slice(0, SPOKEN.length)).toEqual([...SPOKEN]);
    expect(RECORDED[3]).toContain('call the surgical registrar');
    for (const action of LOST_CONTINGENCY_ACTIONS) {
      for (const until of [10, OUTPUT + 10, CONFIRM + 20_000, STOP + 10]) {
        const run = drive([[0, action]], until);
        expect(run.snapshot.contingencyInTheRecord, `${action} at ${until}`).toBe(true);
        expect(run.snapshot.contingencyWasSpoken, `${action} at ${until}`).toBe(false);
        expect(run.snapshot.recordedElements).toHaveLength(4);
      }
    }
  });

  it('requires both sources before the difference can be recorded', () => {
    expect(drive([[0, 'record-the-gap-as-a-transmission-gap']], 10).ids).toContain('gap-refused');
    const onlyOne = drive([[0, 'record-what-was-said'], [1, 'record-the-gap-as-a-transmission-gap']], 10);
    expect(onlyOne.ids).toContain('gap-refused');
    expect(onlyOne.snapshot.choiceFeedback).toContain('only one of them has been read');
    const both = drive(prerequisites.slice(0, 3), 10);
    expect(both.ids).toContain('gap-recorded');
    expect(both.snapshot.choiceFeedback).toContain('transmission gap, not a documentation gap');
  });

  it('reconstructs rather than authors, and refuses a plan of the learner’s own', () => {
    const early = drive([[0, 'record-what-was-said'], [1, 'check-the-notes'], [2, 'reconstruct-the-contingency']], 10);
    expect(early.ids).toContain('reconstruct-refused');
    const ordered = drive(prerequisites, 10);
    expect(ordered.ids).toContain('reconstructed');
    expect(ordered.snapshot.contingencyReconstructed).toBe(RECORDED[3]);
    expect(ordered.snapshot.choiceFeedback).toContain('transcription with attribution, not authorship');
    const own = drive([[0, 'write-a-plan-of-my-own']], 10);
    expect(own.ids).toContain('own-plan-refused');
    expect(own.snapshot.ownPlanAttempted).toBe(true);
    expect(own.snapshot.contingencyReconstructed).toBeNull();
  });

  it('refuses the three ways of explaining the silence away', () => {
    const absent = drive([[0, 'nothing-said-means-nothing-applies']], 10);
    expect(absent.ids).toContain('nothing-applies-refused');
    expect(absent.snapshot.choiceFeedback).toContain('a fact about the receiver rather than about the patient');
    const memory = drive([[0, 'ask-the-day-nurse-to-remember']], 10);
    expect(memory.ids).toContain('memory-refused');
    expect(memory.snapshot.choiceFeedback).toContain('Memory is the thing that failed');
    const quiet = drive([[0, 'a-quiet-handover-means-a-stable-patient']], 10);
    expect(quiet.ids).toContain('quiet-refused');
    expect(quiet.snapshot.choiceFeedback).toContain('the patient it describes is the same either way');
  });

  it('requires a reconstructed plan before it can be taken to the team', () => {
    const bare = drive([[0, 'confirm-the-plan-with-the-team']], 10);
    expect(bare.ids).toContain('confirmation-refused');
    expect(bare.snapshot.confirmationAtTick).toBeNull();
    // And it does not buy the longer session bound.
    expect(drive([[0, 'confirm-the-plan-with-the-team']], STOP + 10).snapshot.ended).toBe('instructor-takeover');
    expect(drive([...prerequisites, [5, 'confirm-the-plan-with-the-team']], 10).ids).toContain('confirmation-requested');
  });

  // The output brushes the threshold and never crosses it. A triggered plan would let a learner
  // read the value of the recovery off an event, when the point is that it was worth doing before.
  it('reports an output that makes the plan matter without triggering it', () => {
    expect(drive([], OUTPUT - 10).ids).not.toContain('output-reported');
    const run = drive([], OUTPUT + 10);
    expect(run.ids).toContain('output-reported');
    expect(run.snapshot.urineHourlyMl).toBeGreaterThan(run.snapshot.urineThresholdMl);
    expect(run.snapshot.consecutiveHoursBelowThreshold).toBe(0);
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('confirms only when the plan was taken to the team, and only after the interval', () => {
    expect(drive([], CONFIRM + 10_000).ids).not.toContain('confirmation-arrived');
    const requested: Choices = [...prerequisites, [5, 'confirm-the-plan-with-the-team']];
    expect(drive(requested, 5 + CONFIRM - 10).ids).not.toContain('confirmation-arrived');
    expect(drive(requested, 5 + CONFIRM + 10).ids).toContain('confirmation-arrived');
    // The interval runs from the request, not from the start of the run.
    const late: Choices = [...prerequisites, [5_000, 'confirm-the-plan-with-the-team']];
    expect(drive(late, 5_000 + CONFIRM - 10).ids).not.toContain('confirmation-arrived');
  });

  it('extends the run when the plan was taken to the team and not otherwise', () => {
    expect(SESSION).toBeGreaterThan(STOP);
    expect(drive([], STOP + 10).snapshot.ended).toBe('instructor-takeover');
    const requested: Choices = [...prerequisites, [5, 'confirm-the-plan-with-the-team']];
    expect(drive(requested, STOP + 10).snapshot.ended).toBeNull();
    expect(drive(requested, SESSION + 10).snapshot.ended).toBe('instructor-takeover');
  });

  it('shows all three state changes in the reassessment the freshness gate demands', () => {
    const before = drive([[0, 'reassess']], 10).snapshot.choiceFeedback!;
    expect(before).toContain('still held only in the notes');
    expect(before).not.toContain('The last hourly output');
    const reconstructed = drive([...prerequisites, [5, 'reassess']], 10).snapshot.choiceFeedback!;
    expect(reconstructed).toContain('It is reconstructed and held on the shift');
    const reported = drive([[OUTPUT + 10, 'reassess']], OUTPUT + 20).snapshot.choiceFeedback!;
    expect(reported).toContain('The last hourly output');
    const confirmed = drive([...prerequisites, [5, 'confirm-the-plan-with-the-team'],
      [5 + CONFIRM + 10, 'reassess']], 5 + CONFIRM + 20);
    expect(confirmed.snapshot.choiceFeedback).toContain('has confirmed the plan stands as written');
    expect(confirmed.snapshot.confirmationObserved).toBe(true);
  });

  it('will not hand over an assessment taken before the reconstruction', () => {
    // Inside the first twelve minutes, so the output transition never fires either.
    const stale: Choices = [[0, 'record-what-was-said'], [1, 'check-the-notes'],
      [2, 'record-the-gap-as-a-transmission-gap'], [3, 'reassess'], [4, 'reconstruct-the-contingency'],
      [5, 'record-what-the-gap-changes'], [6, 'confirm-the-plan-with-the-team'],
      [7, 'review-boundaries'], [8, 'monitor'], [9, 'handoff']];
    const run = drive(stale, 20);
    expect(run.ids).toContain('handoff-refused');
    const fresh = drive([...stale.slice(0, 9), [9, 'reassess'], [10, 'handoff']], 20);
    expect(fresh.ids).toContain('handoff');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const done = drive(FIXTURES.expert, 11_010);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.confirmationObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 11_020);
    expect(recovered.snapshot.ownPlanAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'review-boundaries'], [5_000, 'review-boundaries']], 5_010);
    expect(twice.ids.filter((id) => id === 'boundary-review')).toHaveLength(1);
    expect(twice.snapshot.boundariesReviewedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('output-reported');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 2 } });
    engine.apply({ tick: 0, type: 'oxygen-target-scale-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'lost-contingency-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'lost-contingency-response', payload: { action: 'give-fluid' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('lost-contingency-generic-action-refused');
    expect(ids).toContain('lost-contingency-action-refused');
    expect(frame.equipment.resuscitation.lostContingency!.monitoringAtTick).toBeNull();
  });

  it('carries an accepted action through the engine, not only a refusal', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'lost-contingency-response', payload: { action: 'check-the-notes' } });
    const frame = engine.step();
    expect(frame.events.map((event) => event.eventId).join(' ')).toContain('lost-contingency-notes-check-');
    const snapshot = frame.equipment.resuscitation.lostContingency!;
    expect(snapshot.notesRecord!.contingencyInTheRecord).toBe(true);
    expect(snapshot.notesRecord!.urineThresholdMl).toBe(34);
  });

  it('meets every objective on a run that satisfies the published measures', () => {
    const run = drive(FIXTURES.expert, 11_010);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    expect(findings.map((entry) => entry.outcome)).toEqual(Array(6).fill('met'));
    expect(findings.map((entry) => entry.objectiveId)).toEqual(SCENARIO.metadata.objectives.map((entry) => entry.id));
  });

  it('reports the refused shortcuts in the run that attempted them', () => {
    const run = drive(FIXTURES.recovery, 11_020);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    const recognize = findings.find((entry) => entry.objectiveId.includes('a-gap-the-handover-created'))!;
    expect(recognize.finding).toContain('Treating the unmentioned plan as absent was attempted and refused');
    const record = findings.find((entry) => entry.objectiveId.includes('reconstructed-not-authored'))!;
    expect(record.finding).toContain('Authoring a replacement plan was attempted and refused');
  });

  // A nursing lesson built entirely on physician and paramedic evidence has to say so.
  it('states that none of its evidence was measured on nursing handover', () => {
    const review = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(review).toContain('None of it is nursing handover');
    expect(review).toContain('an assumption rather than a finding');
    expect(review).toContain('22 percent of second sign-outs');
    expect(review).toContain('no study has done is isolate a lost contingency as a cause of harm');
    const transfer = limitationsFor(SCENARIO.metadata.id)
      .find((entry) => entry.id.endsWith('evidence-is-not-from-nursing-handover'))!;
    expect(transfer.correctUnderstanding).toContain('None of them observed nursing shift handover');
    expect(limitationsFor(SCENARIO.metadata.id)).toHaveLength(4);
  });

  it('leaks no drug, dose, fluid, or procedure into any authored learner-facing text', () => {
    const forbidden = ['morphine', 'gelatin', 'hartmann', 'saline bolus', 'mg/kg', 'milligram',
      'ml/kg', 'furosemide', 'catheterise', 'laparotomy again'];
    const authored = [
      ...SCENARIO.timeline.map((entry) => entry.message),
      ...SCENARIO.metadata.objectives.flatMap((entry) => [entry.statement, entry.measure]),
      ...limitationsFor(SCENARIO.metadata.id).flatMap((entry) =>
        [entry.headline, entry.simplification, entry.whereItMisleads, entry.correctUnderstanding]),
      ...LOST_CONTINGENCY_ACTIONS.flatMap((action) => {
        const model = new LostContingency();
        model.advance(OUTPUT + 10);
        return model.apply(action, OUTPUT + 11).map((entry) => entry.message);
      }),
      ...LOST_CONTINGENCY_ACTIONS.flatMap((action) => {
        const model = new LostContingency();
        for (const [tick, prior] of prerequisites) model.apply(prior, tick);
        model.advance(CONFIRM + 100);
        return model.apply(action, CONFIRM + 101).map((entry) => entry.message);
      }),
    ].join(' ').toLowerCase();
    for (const term of forbidden) expect(authored, `authored text leaked ${term}`).not.toContain(term);
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(LOST_CONTINGENCY_ACTIONS).size).toBe(LOST_CONTINGENCY_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
