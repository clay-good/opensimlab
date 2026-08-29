import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { MENINGITIS_IMAGING_A_RULE_THAT_DOES_NOT_AGREE as SCENARIO } from '../../src/modules/infectious-disease/scenarios/meningitis-imaging-a-rule-that-does-not-agree';
import { MENINGITIS_IMAGING_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/meningitis-imaging-fixtures';
import { MeningitisImaging, MENINGITIS_IMAGING_CRITERIA as CRITERIA,
  MENINGITIS_IMAGING_LOCAL_PATHWAY_TICKS as PATHWAY, MENINGITIS_IMAGING_CEILING_TICKS as CEILING,
  MENINGITIS_IMAGING_RESULT_TICKS as RESULT, MENINGITIS_IMAGING_TAKEOVER_TICKS as STOP,
  MENINGITIS_IMAGING_ACTIONS, type MeningitisImagingAction } from '../../src/modules/infectious-disease/meningitis-imaging';

type Choices = readonly (readonly [number, MeningitisImagingAction])[];

function drive(actions: Choices, until: number) {
  const model = new MeningitisImaging();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease meningitis imaging contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The whole lesson rests on the sets genuinely disagreeing about this one patient.
  it('carries five criteria sets that split two against three', () => {
    expect(CRITERIA).toHaveLength(5);
    expect(new Set(CRITERIA.map((set) => set.id)).size).toBe(5);
    expect(CRITERIA.filter((set) => set.indicated).map((set) => set.id)).toEqual(['escmid-2016', 'idsa-2004', 'who-2025']);
    expect(CRITERIA.filter((set) => !set.indicated).map((set) => set.id)).toEqual(['swedish', 'nice-ng240']);
    // Every set must say why, or the comparison is an assertion rather than a lesson.
    for (const set of CRITERIA) expect(set.reason.length).toBeGreaterThan(80);
  });

  it('names the archived status of the most expansive set', () => {
    const idsa = CRITERIA.find((set) => set.id === 'idsa-2004')!;
    expect(idsa.reason).toContain('archived');
    expect(idsa.reason).toContain('2004');
    expect(idsa.label).toContain('archived');
  });

  it('keeps the neurology still, so the disagreement cannot dissolve', () => {
    // If the features moved, the sets would start to agree and this would be a different lesson.
    for (const until of [10, PATHWAY + 10, RESULT + 10, STOP - 10]) {
      const run = drive([[0, 'check-features']], until);
      const view = run.snapshot.featureObservation!;
      expect(view.glasgowComaScale).toBe(14);
      expect(view.focalDeficit).toBe(false);
      expect(view.seizure).toBe(false);
      expect(view.papilloedema).toBe(false);
      expect(view.pupilsEqualReactive).toBe(true);
    }
  });

  it('has the unit apply its own rule set rather than the learner', () => {
    const run = drive([[0, 'record-triggering-features']], PATHWAY + 10);
    expect(run.ids).toContain('local-pathway-applied');
    expect(run.snapshot.localPathwayApplied).toBe(true);
    // No action in the lesson orders, requests, or declines imaging: the pathway is not the
    // learner's to choose, which is the point the authored progression is making.
    expect(MENINGITIS_IMAGING_ACTIONS.filter((action) => /^(order|request|decline|choose)-/.test(action)))
      .toEqual([]);
    expect(run.snapshot.criteriaCompared).toBe(false);
  });

  it('reports a scan that changed no management', () => {
    const run = drive([[0, 'record-antimicrobial-intent']], RESULT + 20);
    expect(run.ids).toContain('imaging-resulted');
    expect(run.snapshot.imagingResulted).toBe(true);
    expect(run.snapshot.imagingChangedManagement).toBe(false);
    // The imaging cannot result before the pathway that ordered it.
    expect(run.ids.indexOf('local-pathway-applied')).toBeLessThan(run.ids.indexOf('imaging-resulted'));
  });

  it('refuses a scan-first default with the measured cost, not a slogan', () => {
    const run = drive([[0, 'scan-first-is-safer']], 20);
    expect(run.ids).toContain('scan-default-refused');
    expect(run.snapshot.scanIsSaferAttempted).toBe(true);
    const text = run.snapshot.choiceFeedback!;
    expect(text).toContain('lower mortality');
    // The observational limitation is stated in the same breath as the finding.
    expect(text).toContain('confounding by indication is a real caveat');
  });

  it('refuses the antimicrobial delay and both rule-out shortcuts', () => {
    const delay = drive([[0, 'delay-antimicrobials-for-the-puncture']], 10);
    expect(delay.ids).toContain('delay-refused');
    expect(delay.snapshot.choiceFeedback).toContain('microbiological yield');
    const crp = drive([[0, 'normal-crp-excludes']], 10);
    expect(crp.ids).toContain('crp-refused');
    const gram = drive([[0, 'negative-gram-stain-excludes']], 10);
    expect(gram.ids).toContain('gram-stain-refused');
    expect(gram.snapshot.choiceFeedback).toContain('sensitivity is roughly half');
  });

  it('reports the one-hour target as a system margin without excusing it', () => {
    const run = drive([], CEILING + 10);
    expect(run.ids).toContain('ceiling-passed');
    const text = run.ids.includes('ceiling-passed') ? 'passed' : '';
    expect(text).toBe('passed');
    const boundaries = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(boundaries).toContain('very low to low quality');
    expect(boundaries).toContain('taken before antimicrobials, not reported before them');
    const late = drive([[CEILING + 50, 'record-antimicrobial-intent']], CEILING + 60);
    expect(late.snapshot.antimicrobialInsideCeiling).toBe(false);
    expect(late.snapshot.choiceFeedback).toContain('after the one-hour ceiling has passed');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-triggering-features'], [1, 'activate-time-critical-owners'],
      [2, 'record-antimicrobial-intent'], [3, 'compare-criteria-sets'], [4, 'review-boundaries'],
      [5, 'monitor'], [6, 'reassess'], [RESULT + 20, 'handoff']];
    expect(drive(stale, RESULT + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 46020);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.imagingObserved).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('changed no management');
    const recovered = drive(FIXTURES.recovery, 46030);
    expect(recovered.snapshot.scanIsSaferAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-triggering-features'], [PATHWAY + 20, 'record-triggering-features']], PATHWAY + 30);
    expect(twice.ids.filter((id) => id === 'features-recorded')).toHaveLength(1);
    expect(twice.snapshot.featuresRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(PATHWAY).toBeLessThan(CEILING);
    expect(CEILING).toBeLessThan(RESULT);
    expect(RESULT).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('ceiling-passed');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and the neighbouring meningitis lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'ceftriaxone', doseMg: 2000 } });
    // Two other lessons in this repo concern meningitis; neither may drive this one.
    engine.apply({ tick: 0, type: 'acute-bacterial-meningitis-first-hour-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'meningococcal-sepsis-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'meningitis-imaging-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'meningitis-imaging-response', payload: { action: 'order-the-scan' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('meningitis-imaging-generic-action-refused');
    expect(ids).toContain('meningitis-imaging-action-refused');
    expect(frame.equipment.resuscitation.meningitisImaging!.monitoringAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['ceftriaxone', 'vancomycin', 'amoxicillin', 'dexamethasone', 'mg/kg',
      'milligram', 'grams intravenously'];
    for (const action of MENINGITIS_IMAGING_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'meningitis-imaging-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.meningitisImaging!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(MENINGITIS_IMAGING_ACTIONS).size).toBe(MENINGITIS_IMAGING_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
