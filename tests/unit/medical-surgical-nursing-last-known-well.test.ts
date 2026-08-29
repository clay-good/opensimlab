import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { limitationsFor } from '@platform/docs/limitations';
import { LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/last-known-well-a-time-nobody-can-supply';
import { LAST_KNOWN_WELL_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/last-known-well-fixtures';
import type { EngineEvent } from '@platform/kernel/protocol';
import { LastKnownWell, LAST_KNOWN_WELL_TIMELINE as TIMELINE,
  LAST_KNOWN_WELL_RECOLLECTION_TICKS as PRESSED,
  LAST_KNOWN_WELL_ASSESSMENT_TICKS as ASSESSMENT,
  LAST_KNOWN_WELL_TAKEOVER_TICKS as STOP,
  LAST_KNOWN_WELL_SESSION_TICKS as SESSION,
  LAST_KNOWN_WELL_ACTIONS, type LastKnownWellAction } from '../../src/modules/medical-surgical-nursing/last-known-well';

type Choices = readonly (readonly [number, LastKnownWellAction])[];

function drive(actions: Choices, until: number) {
  const model = new LastKnownWell();
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

/** The ids the engine publishes, built from what the model actually emitted. */
const engineLog = (events: readonly { id: string; tick: number }[]): EngineEvent[] =>
  events.map((entry) => ({ tick: entry.tick, eventId: `last-known-well-${entry.id}-${entry.tick}`,
    category: 'assessment', severity: 'warning', message: 'Private event prose.' }));

describe('Nursing unwitnessed-onset contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The whole lesson is that this field stays empty. If any path fills it, the lesson is inverted.
  it('never records an onset time, in any state, after any action', () => {
    for (const action of LAST_KNOWN_WELL_ACTIONS) {
      for (const until of [10, PRESSED + 10, ASSESSMENT + 20_000, STOP + 10]) {
        expect(drive([[0, action]], until).snapshot.onsetTimeRecorded, `${action} at ${until}`).toBeNull();
      }
    }
    expect(drive(FIXTURES.expert, 12040).snapshot.onsetTimeRecorded).toBeNull();
  });

  it('carries exactly one uncertain entry in a three-point timeline', () => {
    expect(TIMELINE).toHaveLength(3);
    expect(TIMELINE.filter((entry) => !entry.certain).map((entry) => entry.id)).toEqual(['recollection']);
    const run = drive([[0, 'check-the-timeline']], 10);
    expect(run.snapshot.timelineRecord!.certainEntries).toBe(2);
    expect(run.snapshot.timelineRecord!.totalEntries).toBe(3);
    expect(run.snapshot.timelineRecord!.unwitnessedHours).toBe(7.5);
  });

  it('records last known well as a bound and refuses it as an onset', () => {
    const bound = drive([[0, 'record-last-known-well']], 10);
    expect(bound.ids).toContain('bound-recorded');
    expect(bound.snapshot.choiceFeedback).toContain('a bound rather than an onset');
    const charted = drive([[0, 'chart-last-known-well-as-onset']], 10);
    expect(charted.ids).toContain('bound-charted-refused');
    expect(charted.snapshot.choiceFeedback).toContain('the earliest possible time rather than a known one');
    expect(charted.snapshot.boundChartedAttempted).toBe(true);
  });

  it('keeps the recollection uncertain and refuses it as a timestamp', () => {
    const kept = drive([[0, 'record-the-uncertain-recollection']], 10);
    expect(kept.snapshot.choiceFeedback).toContain('in its own field');
    expect(kept.snapshot.choiceFeedback).toContain('indistinguishable from a witnessed one');
    const charted = drive([[0, 'chart-the-recollection-as-onset']], 10);
    expect(charted.ids).toContain('recollection-charted-refused');
    expect(charted.snapshot.recollectionChartedAttempted).toBe(true);
  });

  it('refuses standing down and refuses waiting for a time nobody has', () => {
    const stood = drive([[0, 'unknown-onset-means-nothing-offered']], 10);
    expect(stood.ids).toContain('nothing-offered-refused');
    expect(stood.snapshot.choiceFeedback).toContain('a reason to escalate for that assessment, not a reason to stop');
    const waited = drive([[0, 'wait-for-the-family-to-confirm']], 10);
    expect(waited.ids).toContain('waiting-refused');
    expect(waited.snapshot.choiceFeedback).toContain('another recollection wearing a timestamp');
  });

  it('requires the bound before its consequences can be stated', () => {
    const early = drive([[0, 'record-what-the-unknown-changes']], 10);
    expect(early.ids).toContain('consequences-refused');
    expect(early.snapshot.consequencesRecordedAtTick).toBeNull();
    const ordered = drive([[0, 'record-last-known-well'], [1, 'record-what-the-unknown-changes']], 10);
    expect(ordered.ids).toContain('consequences-recorded');
    expect(ordered.snapshot.choiceFeedback).toContain('assessed by imaging rather than by a clock');
  });

  it('pressing the recollection makes it worse rather than better', () => {
    const run = drive([], PRESSED + 10);
    expect(run.ids).toContain('recollection-pressed');
    expect(run.snapshot.recollectionPressed).toBe(true);
    expect(run.snapshot.onsetTimeRecorded).toBeNull();
  });

  it('assesses only when the pathway was activated, and only after the interval', () => {
    expect(drive([], ASSESSMENT + 10_000).ids).not.toContain('assessment-arrived');
    const early = drive([[0, 'activate-the-stroke-pathway']], ASSESSMENT - 10);
    expect(early.ids).not.toContain('assessment-arrived');
    const late = drive([[0, 'activate-the-stroke-pathway']], ASSESSMENT + 10);
    expect(late.ids).toContain('assessment-arrived');
    // The interval runs from activation, not from the start of the run.
    const delayed = drive([[5_000, 'activate-the-stroke-pathway']], 5_000 + ASSESSMENT - 10);
    expect(delayed.ids).not.toContain('assessment-arrived');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-last-known-well'], [1, 'record-the-uncertain-recollection'],
      [2, 'activate-the-stroke-pathway'], [3, 'record-what-the-unknown-changes'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [PRESSED + 10, 'handoff']];
    const blocked = drive(stale, PRESSED + 20);
    expect(blocked.ids).toContain('handoff-refused');
    expect(blocked.snapshot.choiceFeedback).toContain('A settled onset time and a resolved eligibility are not handoff gates.');
    const done = drive(FIXTURES.expert, 12_040);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.assessmentObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 12_050);
    expect(recovered.snapshot.recollectionChartedAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-last-known-well'], [5_000, 'record-last-known-well']], 5_010);
    expect(twice.ids.filter((id) => id === 'bound-recorded')).toHaveLength(1);
    expect(twice.snapshot.boundRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('recollection-pressed');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.ended).toBe('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'alteplase', doseMg: 50 } });
    engine.apply({ tick: 0, type: 'proxy-scale-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'last-known-well-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'last-known-well-response', payload: { action: 'give-thrombolysis' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('last-known-well-generic-action-refused');
    expect(ids).toContain('last-known-well-action-refused');
    expect(frame.equipment.resuscitation.lastKnownWell!.monitoringAtTick).toBeNull();
  });

  it('names no drug, dose, or imaging request after ANY action', () => {
    const forbidden = ['alteplase', 'tenecteplase', 'thrombectomy', 'aspirin', 'mg/kg', 'milligram', 'order a ct'];
    for (const action of LAST_KNOWN_WELL_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'last-known-well-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.lastKnownWell!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  // A debrief keyed to an event id the model never emits pins its objective to not-met forever
  // and no assertion notices. These ids are checked against a real run, not against themselves.
  it('meets every objective on a run that satisfies the published measures', () => {
    const run = drive(FIXTURES.expert, 12_040);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    expect(findings.map((entry) => entry.outcome)).toEqual(Array(6).fill('met'));
    expect(findings.map((entry) => entry.objectiveId)).toEqual(SCENARIO.metadata.objectives.map((entry) => entry.id));
  });

  it('separates the activation objective from the timed observation its measure never names', () => {
    const withoutMonitoring: Choices = [[0, 'record-last-known-well'], [1, 'record-the-uncertain-recollection'],
      [2, 'activate-the-stroke-pathway'], [3, 'record-what-the-unknown-changes'], [4, 'review-boundaries']];
    const run = drive(withoutMonitoring, 10);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    const activation = findings.find((entry) => entry.objectiveId.includes('on-the-deficit-not-the-clock'))!;
    expect(activation.outcome).toBe('met');
    // Timed observation is still required, by the handoff gate rather than by this objective.
    expect(findings.find((entry) => entry.objectiveId.includes('handed-over-empty'))!.outcome).toBe('not-met');
  });

  it('reports the refused shortcuts in the run that attempted them', () => {
    const run = drive(FIXTURES.recovery, 12_050);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], engineLog(run.events));
    const kept = findings.find((entry) => entry.objectiveId.includes('an-uncertain-account-kept-uncertain'))!;
    expect(kept.finding).toContain('refused; it remains in this run');
  });

  // Activation moves the terminal from the 90-minute takeover to the 8-hour session bound.
  it('extends the run when the pathway was activated and not otherwise', () => {
    expect(SESSION).toBeGreaterThan(STOP);
    const abandoned = drive([], STOP + 10);
    expect(abandoned.snapshot.ended).toBe('instructor-takeover');
    const activated = drive([[0, 'activate-the-stroke-pathway']], STOP + 10);
    expect(activated.snapshot.ended).toBeNull();
    expect(drive([[0, 'activate-the-stroke-pathway']], SESSION + 10).snapshot.ended).toBe('instructor-takeover');
  });

  it('shows the moved recollection in the reassessment the freshness gate demands', () => {
    const before = drive([[0, 'reassess']], 10).snapshot.choiceFeedback!;
    expect(before).not.toContain('moved by an hour');
    const after = drive([[PRESSED + 10, 'reassess']], PRESSED + 20).snapshot.choiceFeedback!;
    expect(after).toContain('moved by an hour under questioning and is no firmer');
  });

  it('does not satisfy the handoff gate with partial checks alone', () => {
    const partial: Choices = [[0, 'record-last-known-well'], [1, 'record-the-uncertain-recollection'],
      [2, 'activate-the-stroke-pathway'], [3, 'record-what-the-unknown-changes'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'check-the-timeline'], [7, 'check-patient'],
      [8, 'handoff']];
    expect(drive(partial, 20).ids).toContain('handoff-refused');
  });

  it('names the deficit rather than a look at it when the pathway is activated late', () => {
    const late = drive([[PRESSED + 10, 'activate-the-stroke-pathway']], PRESSED + 20);
    expect(late.snapshot.choiceFeedback).toContain('without waiting for the recollection to firm up');
    expect(late.snapshot.choiceFeedback).toContain('observation continues alongside it rather than in front of it');
  });

  it('leaks no drug, test, or procedure into any authored learner-facing text', () => {
    const forbidden = ['alteplase', 'tenecteplase', 'thrombectomy', 'aspirin', 'heparin', 'warfarin',
      'mg/kg', 'milligram', 'order a ct', 'request a ct', 'request an mri', 'litres per minute'];
    const authored = [
      ...SCENARIO.timeline.map((entry) => entry.message),
      ...SCENARIO.metadata.objectives.flatMap((entry) => [entry.statement, entry.measure]),
      ...limitationsFor(SCENARIO.metadata.id).flatMap((entry) =>
        [entry.headline, entry.simplification, entry.whereItMisleads, entry.correctUnderstanding]),
      ...LAST_KNOWN_WELL_ACTIONS.flatMap((action) => {
        const model = new LastKnownWell();
        model.advance(PRESSED + 10);
        return model.apply(action, PRESSED + 11).map((entry) => entry.message);
      }),
    ].join(' ').toLowerCase();
    for (const term of forbidden) expect(authored, `authored text leaked ${term}`).not.toContain(term);
    expect(limitationsFor(SCENARIO.metadata.id)).toHaveLength(3);
  });

  // A lesson about honest uncertainty cannot present one-sided efficacy.
  it('states the trial harms and its early stop wherever it states the benefit', () => {
    const review = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(review).toContain('higher rate of favourable outcome in the treated group');
    expect(review).toContain('stopped at 503 of a planned 800 patients');
    expect(review).toContain('never powered to measure harm');
    expect(review).toContain('parenchymal haematoma');
    const evidence = SCENARIO.timeline.find((entry) => entry.target === 'last-known-well-evidence')!.message;
    expect(evidence).toContain('numerically more deaths');
    expect(evidence).toContain('underpowered');
    const limitation = limitationsFor(SCENARIO.metadata.id)
      .find((entry) => entry.id.endsWith('trial-evidence-describes-a-population'))!;
    expect(limitation.correctUnderstanding).toContain('underpowered rather than negative');
    // She is never asserted into the enrolled population, on any surface.
    for (const text of [review, evidence, limitation.correctUnderstanding]) {
      expect(text).not.toContain('exactly this population');
      expect(text).not.toContain('precisely this population');
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(LAST_KNOWN_WELL_ACTIONS).size).toBe(LAST_KNOWN_WELL_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
