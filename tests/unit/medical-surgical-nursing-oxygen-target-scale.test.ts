import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { limitationsFor } from '@platform/docs/limitations';
import type { EngineEvent } from '@platform/kernel/protocol';
import { OXYGEN_TARGET_SCALE_A_SCORE_THAT_SHOULD_BE_LOWER as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/oxygen-target-scale-a-score-that-should-be-lower';
import { OXYGEN_TARGET_SCALE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale-fixtures';
import { OxygenTargetScale, oxygenTargetScore,
  OXYGEN_TARGET_COLLEAGUE_TICKS as COLLEAGUE,
  OXYGEN_TARGET_REVIEW_TICKS as REVIEW,
  OXYGEN_TARGET_TAKEOVER_TICKS as STOP,
  OXYGEN_TARGET_SESSION_TICKS as SESSION,
  OXYGEN_TARGET_ACTIONS, type OxygenTargetScaleAction } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale';

type Choices = readonly (readonly [number, OxygenTargetScaleAction])[];

function drive(actions: Choices, until: number) {
  const model = new OxygenTargetScale();
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
  events.map((entry) => ({ tick: entry.tick, eventId: `oxygen-target-scale-${entry.id}-${entry.tick}`,
    category: 'assessment', severity: 'warning', message: 'Private event prose.' }));

/** Everything the guarded actions require, in order. */
const prerequisites: Choices = [[0, 'check-the-prescription'], [1, 'check-the-chart'],
  [2, 'record-the-scale-mismatch'], [3, 'rescore-on-the-prescribed-scale'],
  [4, 'record-what-the-rescore-changes']];
const confirmedBy = (tick: number): Choices =>
  [...prerequisites, [tick, 'confirm-the-scale-with-the-team']];

describe('Nursing oxygen-target scoring contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The published bands, not a remembered version of them. Scale 2 is the only one that
  // penalises being too high, and only when the patient is on oxygen.
  it('scores both published scales exactly as the chart prints them', () => {
    for (const [saturation, score] of [[70, 3], [82, 3], [91, 3], [92, 2], [93, 2], [94, 1], [95, 1], [96, 0], [99, 0]] as const) {
      expect(oxygenTargetScore(1, saturation, false), `scale 1 at ${saturation}%`).toBe(score);
      // Scale 1 has no air-or-oxygen branch. The separate chart row carries that.
      expect(oxygenTargetScore(1, saturation, true), `scale 1 at ${saturation}% on oxygen`).toBe(score);
    }
    for (const [saturation, score] of [[70, 3], [82, 3], [83, 3], [84, 2], [85, 2], [86, 1], [87, 1], [88, 0], [92, 0], [93, 0], [99, 0]] as const) {
      expect(oxygenTargetScore(2, saturation, false), `scale 2 at ${saturation}% on air`).toBe(score);
    }
    for (const [saturation, score] of [[92, 0], [93, 1], [94, 1], [95, 2], [96, 2], [97, 3]] as const) {
      expect(oxygenTargetScore(2, saturation, true), `scale 2 at ${saturation}% on oxygen`).toBe(score);
    }
    // The whole lesson in one line: the same measurement, two answers.
    expect(oxygenTargetScore(1, 90, false)).toBe(3);
    expect(oxygenTargetScore(2, 90, false)).toBe(0);
  });

  it('never moves the saturation, whatever the learner does', () => {
    for (const action of OXYGEN_TARGET_ACTIONS) {
      for (const until of [10, COLLEAGUE + 10, REVIEW + 20_000, STOP + 10]) {
        expect(drive([[0, action]], until).snapshot.saturationPercent, `${action} at ${until}`).toBe(90);
      }
    }
  });

  it('requires both documents before the disagreement can be recorded', () => {
    const neither = drive([[0, 'record-the-scale-mismatch']], 10);
    expect(neither.ids).toContain('mismatch-refused');
    const onlyOne = drive([[0, 'check-the-prescription'], [1, 'record-the-scale-mismatch']], 10);
    expect(onlyOne.ids).toContain('mismatch-refused');
    expect(onlyOne.snapshot.choiceFeedback).toContain('only one of them has been read');
    const both = drive([[0, 'check-the-prescription'], [1, 'check-the-chart'], [2, 'record-the-scale-mismatch']], 10);
    expect(both.ids).toContain('mismatch-recorded');
    expect(both.snapshot.choiceFeedback).toContain('not about her');
  });

  it('refuses a rescore that leaves no trace of why', () => {
    const early = drive([[0, 'check-the-prescription'], [1, 'check-the-chart'], [2, 'rescore-on-the-prescribed-scale']], 10);
    expect(early.ids).toContain('rescore-refused');
    expect(early.snapshot.rescoredAtTick).toBeNull();
    const ordered = drive([[0, 'check-the-prescription'], [1, 'check-the-chart'],
      [2, 'record-the-scale-mismatch'], [3, 'rescore-on-the-prescribed-scale']], 10);
    expect(ordered.ids).toContain('rescored');
    expect(ordered.snapshot.chartedScore).toBe(0);
    expect(ordered.snapshot.choiceFeedback).toContain('The saturation did not move.');
  });

  it('refuses the harm the guideline names, and names no oxygen setting', () => {
    const raised = drive([[0, 'raise-the-oxygen-to-correct-it']], 10);
    expect(raised.ids).toContain('oxygen-raise-refused');
    expect(raised.snapshot.oxygenRaiseAttempted).toBe(true);
    expect(raised.snapshot.choiceFeedback).toContain('no oxygen was selected, set, or delivered');
    expect(raised.snapshot.choiceFeedback).toContain('put her at risk');
  });

  it('refuses the assumption, the false reassurance, and the cautious-looking shortcut', () => {
    const assumed = drive([[0, 'assume-the-diagnosis-sets-the-scale']], 10);
    expect(assumed.ids).toContain('assumed-scale-refused');
    expect(assumed.snapshot.choiceFeedback).toContain('Most patients with this diagnosis do not meet that');
    const improved = drive([[0, 'a-lower-score-means-she-is-improving']], 10);
    expect(improved.ids).toContain('improvement-refused');
    expect(improved.snapshot.choiceFeedback).toContain('has not been shown to detect deterioration better');
    const both = drive([[0, 'score-both-and-take-the-higher']], 10);
    expect(both.ids).toContain('both-scales-refused');
    expect(both.snapshot.choiceFeedback).toContain('It looks cautious and it is not');
  });

  it('brings the named harm to the learner as a helpful offer', () => {
    expect(drive([], COLLEAGUE - 10).ids).not.toContain('colleague-asked');
    const run = drive([], COLLEAGUE + 10);
    expect(run.ids).toContain('colleague-asked');
    expect(run.snapshot.colleagueAskedToRaiseOxygen).toBe(true);
  });

  it('reviews only when the decision was taken to the team, and only after the interval', () => {
    expect(drive([], REVIEW + 10_000).ids).not.toContain('review-arrived');
    expect(drive(confirmedBy(0), REVIEW - 10).ids).not.toContain('review-arrived');
    expect(drive(confirmedBy(0), REVIEW + 10).ids).toContain('review-arrived');
    // The interval runs from the request, not from the start of the run.
    expect(drive(confirmedBy(5_000), 5_000 + REVIEW - 10).ids).not.toContain('review-arrived');
  });

  it('extends the run when confirmation was requested and not otherwise', () => {
    expect(SESSION).toBeGreaterThan(STOP);
    expect(drive([], STOP + 10).snapshot.ended).toBe('instructor-takeover');
    expect(drive(confirmedBy(0), STOP + 10).snapshot.ended).toBeNull();
    expect(drive(confirmedBy(0), SESSION + 10).snapshot.ended).toBe('instructor-takeover');
  });

  it('shows both authored transitions in the reassessment the freshness gate demands', () => {
    const before = drive([[0, 'reassess']], 10).snapshot.choiceFeedback!;
    expect(before).not.toContain('already offered to put oxygen on her');
    const after = drive([[COLLEAGUE + 10, 'reassess']], COLLEAGUE + 20).snapshot.choiceFeedback!;
    expect(after).toContain('already offered to put oxygen on her');
    const reviewed = drive([...confirmedBy(0), [REVIEW + 10, 'reassess']], REVIEW + 20);
    expect(reviewed.snapshot.choiceFeedback).toContain('has confirmed the documented decision');
    expect(reviewed.snapshot.reviewObserved).toBe(true);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'check-the-prescription'], [1, 'check-the-chart'],
      [2, 'record-the-scale-mismatch'], [3, 'rescore-on-the-prescribed-scale'],
      [4, 'record-what-the-rescore-changes'], [5, 'confirm-the-scale-with-the-team'],
      [6, 'review-boundaries'], [7, 'monitor'], [8, 'reassess'], [COLLEAGUE + 10, 'handoff']];
    const blocked = drive(stale, COLLEAGUE + 20);
    expect(blocked.ids).toContain('handoff-refused');
    expect(blocked.snapshot.choiceFeedback).toContain('A confirmed cause and a settled trajectory are not handoff gates.');
    const done = drive(FIXTURES.expert, 17_010);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.reviewObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 17_020);
    expect(recovered.snapshot.oxygenRaiseAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'review-boundaries'], [5_000, 'review-boundaries']], 5_010);
    expect(twice.ids.filter((id) => id === 'boundary-review')).toHaveLength(1);
    expect(twice.snapshot.boundariesReviewedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('colleague-asked');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'salbutamol', doseMg: 5 } });
    engine.apply({ tick: 0, type: 'last-known-well-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'oxygen-target-scale-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'oxygen-target-scale-response', payload: { action: 'turn-up-the-oxygen' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('oxygen-target-scale-generic-action-refused');
    expect(ids).toContain('oxygen-target-scale-action-refused');
    expect(frame.equipment.resuscitation.oxygenTargetScale!.monitoringAtTick).toBeNull();
  });

  it('meets every objective on a run that satisfies the published measures', () => {
    const run = drive(FIXTURES.expert, 17_010);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    expect(findings.map((entry) => entry.outcome)).toEqual(Array(6).fill('met'));
    expect(findings.map((entry) => entry.objectiveId)).toEqual(SCENARIO.metadata.objectives.map((entry) => entry.id));
  });

  it('reports the refused shortcuts in the run that attempted them', () => {
    const run = drive(FIXTURES.recovery, 17_020);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    const consequences = findings.find((entry) => entry.objectiveId.includes('what-a-corrected-score-does-not-supply'))!;
    expect(consequences.finding).toContain('Raising the inspired oxygen to lift the saturation was attempted and refused');
    const recognize = findings.find((entry) => entry.objectiveId.includes('a-number-compared-with-the-wrong-range'))!;
    expect(recognize.finding).toContain('Carrying the higher of the two scales was attempted and refused');
  });

  it('leaks no oxygen setting, drug, or procedure into any authored learner-facing text', () => {
    const forbidden = ['salbutamol', 'ipratropium', 'prednisolone', 'litres per minute', 'l/min',
      'venturi', 'nasal cannula', 'fio2', '28%', '24%', 'mg/kg', 'milligram'];
    const authored = [
      ...SCENARIO.timeline.map((entry) => entry.message),
      ...SCENARIO.metadata.objectives.flatMap((entry) => [entry.statement, entry.measure]),
      ...limitationsFor(SCENARIO.metadata.id).flatMap((entry) =>
        [entry.headline, entry.simplification, entry.whereItMisleads, entry.correctUnderstanding]),
      // Every action from a fresh model, and again from a model far enough along that the
      // accepted branch is the one that fires. The accepted strings are the long ones.
      ...OXYGEN_TARGET_ACTIONS.flatMap((action) => {
        const model = new OxygenTargetScale();
        model.advance(COLLEAGUE + 10);
        return model.apply(action, COLLEAGUE + 11).map((entry) => entry.message);
      }),
      ...OXYGEN_TARGET_ACTIONS.flatMap((action) => {
        const model = new OxygenTargetScale();
        for (const [tick, prior] of prerequisites) model.apply(prior, tick);
        model.advance(REVIEW + 100);
        return model.apply(action, REVIEW + 101).map((entry) => entry.message);
      }),
    ].join(' ').toLowerCase();
    for (const term of forbidden) expect(authored, `authored text leaked ${term}`).not.toContain(term);
    expect(limitationsFor(SCENARIO.metadata.id)).toHaveLength(3);
  });

  // A confirmation request carries the mismatch and the rescore, so it cannot precede them.
  it('refuses a confirmation request with nothing to take to the team', () => {
    const bare = drive([[0, 'confirm-the-scale-with-the-team']], 10);
    expect(bare.ids).toContain('confirmation-refused');
    expect(bare.snapshot.confirmationAtTick).toBeNull();
    expect(bare.snapshot.choiceFeedback).toContain('a question about which chart to use');
    // And it does not buy the longer session bound.
    expect(drive([[0, 'confirm-the-scale-with-the-team']], STOP + 10).snapshot.ended).toBe('instructor-takeover');
    const ready = drive(confirmedBy(5), 10);
    expect(ready.ids).toContain('confirmation-requested');
  });

  it('reads the chart as it currently stands rather than as it started', () => {
    const before = drive([[0, 'check-the-chart']], 10);
    expect(before.snapshot.chartRecord!.chartedScale).toBe(1);
    expect(before.snapshot.chartRecord!.chartedScore).toBe(3);
    expect(before.snapshot.choiceFeedback).toContain('has not been crossed out');
    const after = drive([...prerequisites, [5, 'check-the-chart']], 10);
    expect(after.snapshot.chartRecord!.chartedScale).toBe(2);
    expect(after.snapshot.chartRecord!.chartedScore).toBe(0);
    expect(after.snapshot.choiceFeedback).toContain('The section not in use is crossed out.');
  });

  it('does not claim a corrected chart that does not exist yet', () => {
    const early = drive([[0, 'monitor']], 10);
    expect(early.snapshot.choiceFeedback).toContain('on the chart as it currently stands');
    expect(early.snapshot.choiceFeedback).not.toContain('crossed out');
    const later = drive([...prerequisites, [5, 'monitor']], 10);
    expect(later.snapshot.choiceFeedback).toContain('unused section crossed out');
  });

  it('will not hand over an assessment taken before the rescore', () => {
    // Entirely inside the first ten minutes, so the colleague transition never fires.
    const stale: Choices = [[0, 'check-the-prescription'], [1, 'check-the-chart'],
      [2, 'record-the-scale-mismatch'], [3, 'reassess'], [4, 'rescore-on-the-prescribed-scale'],
      [5, 'record-what-the-rescore-changes'], [6, 'confirm-the-scale-with-the-team'],
      [7, 'review-boundaries'], [8, 'monitor'], [9, 'handoff']];
    const run = drive(stale, 20);
    expect(run.ids).toContain('handoff-refused');
    expect(run.snapshot.observation!.chartedScale).toBe(1);
    const fresh = drive([...stale.slice(0, 9), [9, 'reassess'], [10, 'handoff']], 20);
    expect(fresh.ids).toContain('handoff');
    expect(fresh.snapshot.observation!.chartedScale).toBe(2);
    expect(fresh.snapshot.observation!.chartedScore).toBe(0);
  });

  it('names the right band boundary when it explains the fall', () => {
    const rescored = drive([...prerequisites.slice(0, 4)], 10).snapshot.choiceFeedback!;
    expect(rescored).toContain('anything below 96%');
    expect(rescored).not.toContain('below 92%');
  });

  it('carries the trial design and its non-adherence on the surface that reviews it', () => {
    const review = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(review).toContain('randomised by paramedic rather than by patient');
    expect(review).toContain('did not reach significance');
    expect(review).toContain('not known whether 88 to 92% is the ideal range');
    expect(review).toContain('has not been shown to detect deterioration better');
  });

  it('carries an accepted action through the engine, not only a refusal', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'oxygen-target-scale-response', payload: { action: 'check-the-prescription' } });
    const frame = engine.step();
    expect(frame.events.map((event) => event.eventId).join(' ')).toContain('oxygen-target-scale-prescription-check-');
    const snapshot = frame.equipment.resuscitation.oxygenTargetScale!;
    expect(snapshot.prescriptionCheckedAtTick).not.toBeNull();
    expect(snapshot.prescriptionRecord!.prescribedScale).toBe(2);
    expect(snapshot.saturationPercent).toBe(90);
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(OXYGEN_TARGET_ACTIONS).size).toBe(OXYGEN_TARGET_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
