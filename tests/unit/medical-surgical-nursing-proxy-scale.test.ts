import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/proxy-scale-a-number-without-a-standard';
import { PROXY_SCALE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/proxy-scale-fixtures';
import { ProxyScale, PROXY_SCALE_ITEMS as ITEMS, PROXY_SCALE_TOTAL as TOTAL,
  PROXY_SCALE_FAMILY_TICKS as FAMILY, PROXY_SCALE_REVIEW_TICKS as REVIEW,
  PROXY_SCALE_TAKEOVER_TICKS as STOP,
  PROXY_SCALE_ACTIONS, type ProxyScaleAction } from '../../src/modules/medical-surgical-nursing/proxy-scale';

type Choices = readonly (readonly [number, ProxyScaleAction])[];

function drive(actions: Choices, until: number) {
  const model = new ProxyScale();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Nursing proxy pain scale contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'medical-surgical-nursing', 'ward', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The total must be derivable from the items, never a free-floating number.
  it('derives the total from the scored items', () => {
    expect(ITEMS).toHaveLength(5);
    expect(TOTAL).toBe(ITEMS.reduce((sum, item) => sum + item.points, 0));
    expect(TOTAL).toBe(4);
    expect(ITEMS.filter((item) => item.points === 0).map((item) => item.id)).toEqual(['consolability']);
  });

  it('never makes self-report available, in any state', () => {
    for (const until of [10, FAMILY + 10, REVIEW + 10, STOP - 10]) {
      const run = drive([[0, 'check-behaviours']], until);
      expect(run.snapshot.selfReportAvailable).toBe(false);
      expect(run.snapshot.behaviourRecord!.selfReportAvailable).toBe(false);
    }
  });

  it('requires the self-report attempt before scoring anyone', () => {
    const early = drive([[0, 'record-the-observed-behaviours']], 10);
    expect(early.ids).toContain('behaviours-refused');
    expect(early.snapshot.behavioursRecordedAtTick).toBeNull();
    expect(early.snapshot.choiceFeedback).toContain('a patient who could have answered is asked before anyone starts scoring');
    const ordered = drive([[0, 'attempt-self-report'], [1, 'record-the-observed-behaviours']], 10);
    expect(ordered.ids).toContain('behaviours-recorded');
  });

  it('records an unsuccessful attempt as distinct from a denial', () => {
    const text = drive([[0, 'attempt-self-report']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('attempted and unsuccessful');
    expect(text).toContain('different again from a denial of pain');
  });

  it('refuses an intensity reading in either direction', () => {
    const high = drive([[0, 'read-four-as-four-out-of-ten']], 10);
    expect(high.ids).toContain('intensity-refused');
    expect(high.snapshot.choiceFeedback).toContain('no validated conversion to an intensity score exists');
    const low = drive([[0, 'zero-would-mean-comfortable']], 10);
    expect(low.ids).toContain('zero-refused');
    expect(low.snapshot.choiceFeedback).toContain('A low total is weak evidence in the same direction as a high one');
  });

  it('refuses physiological confirmation and waiting to be asked', () => {
    const vitals = drive([[0, 'vitals-confirm-the-pain']], 10);
    expect(vitals.ids).toContain('vitals-refused');
    expect(vitals.snapshot.choiceFeedback).toContain('bottom of the assessment hierarchy');
    const waiting = drive([[0, 'wait-until-they-ask']], 10);
    expect(waiting.ids).toContain('waiting-refused');
    expect(waiting.snapshot.choiceFeedback).toContain('least protected by waiting to be asked');
  });

  it('has nobody to ask until somebody who knows him arrives', () => {
    const early = drive([[0, 'seek-the-proxy-history']], 10);
    expect(early.ids).toContain('proxy-refused');
    expect(early.snapshot.choiceFeedback).toContain('a person who knows this man, not a field on a form');
    const later = drive([[FAMILY + 10, 'seek-the-proxy-history']], FAMILY + 20);
    expect(later.ids).toContain('proxy-recorded');
    expect(later.snapshot.proxyHistoryAtTick).not.toBeNull();
  });

  it('keeps the proxy account in her words and above the scale', () => {
    const text = drive([[FAMILY + 10, 'seek-the-proxy-history']], FAMILY + 20).snapshot.choiceFeedback!;
    expect(text).toContain('goes quiet and still rather than restless');
    expect(text).toContain('above behavioural scoring in the assessment hierarchy and below his own report');
  });

  it('treats the treatment response as evidence rather than confirmation', () => {
    const intent = drive([[0, 'record-analgesic-intent']], 10).snapshot.choiceFeedback!;
    expect(intent).toContain('assessed as further evidence rather than treated as proof');
    const run = drive([[0, 'record-analgesic-intent'], [REVIEW + 20, 'reassess']], REVIEW + 30);
    expect(run.ids).toContain('review-arrived');
    expect(run.snapshot.reviewObserved).toBe(true);
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'attempt-self-report'], [1, 'record-the-observed-behaviours'],
      [2, 'record-what-the-score-is-not'], [3, 'review-boundaries'], [4, 'monitor'], [5, 'reassess'],
      [FAMILY + 10, 'seek-the-proxy-history'], [FAMILY + 11, 'record-analgesic-intent'],
      [FAMILY + 12, 'handoff']];
    expect(drive(stale, FAMILY + 20).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 39030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.reviewObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 39040);
    expect(recovered.snapshot.intensityReadAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'attempt-self-report'], [5000, 'attempt-self-report']], 5010);
    expect(twice.ids.filter((id) => id === 'self-report-attempted')).toHaveLength(1);
    expect(twice.snapshot.selfReportAttemptedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('family-arrived');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and sibling lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'morphine', doseMg: 2 } });
    engine.apply({ tick: 0, type: 'quiet-patient-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'proxy-scale-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'proxy-scale-response', payload: { action: 'give-analgesia' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('proxy-scale-generic-action-refused');
    expect(ids).toContain('proxy-scale-action-refused');
    expect(frame.equipment.resuscitation.proxyScale!.monitoringAtTick).toBeNull();
  });

  it('names no analgesic or dose after ANY action', () => {
    const forbidden = ['morphine', 'oxycodone', 'paracetamol', 'codeine', 'mg/kg', 'milligram'];
    for (const action of PROXY_SCALE_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'proxy-scale-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.proxyScale!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(PROXY_SCALE_ACTIONS).size).toBe(PROXY_SCALE_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
