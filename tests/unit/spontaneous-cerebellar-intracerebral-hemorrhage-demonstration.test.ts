/**
 * The worked example and observed-state tutor for a patient who looks well and
 * cannot sit up.
 *
 * Everything reassuring here is a timestamp: the intact conversation, the small
 * volume, and a first scan reporting no hydrocephalus and no brainstem
 * compression. Both the tutor and the example treat location rather than volume
 * as the risk, and both escalate while she still looks like she does not need
 * it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE as SCENARIO } from '../../src/modules/neurology/scenarios/spontaneous-cerebellar-intracerebral-hemorrhage';
import { CEREBELLAR_ICH_FIXTURES as FIXTURES } from '../../src/modules/neurology/spontaneous-cerebellar-intracerebral-hemorrhage-fixtures';
import {
  CEREBELLAR_ICH_DEMONSTRATION_VERSION, cerebellarIchDemonstrationStep,
  supportsCerebellarIchDemonstration,
} from '../../src/modules/neurology/demo/spontaneous-cerebellar-intracerebral-hemorrhage-demonstration';
import { cerebellarIchInlinePrompt } from '../../src/modules/neurology/tutor/spontaneous-cerebellar-intracerebral-hemorrhage-guidance';
import type { CerebellarIchAction } from '../../src/modules/neurology/spontaneous-cerebellar-intracerebral-hemorrhage';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyCerebellarIchAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CerebellarIchAction) => {
  engine.apply({ tick, type: 'spontaneous-cerebellar-intracerebral-hemorrhage-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = cerebellarIchDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'spontaneous-cerebellar-intracerebral-hemorrhage-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Escalates While She Looks Well', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CEREBELLAR_ICH_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCerebellarIchDemonstration(SCENARIO)).toBe(true);
    expect(supportsCerebellarIchDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCerebellarIchDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'imaging', 'boundary', 'ownership', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.imagingAtTick!);
    expect(patient.imagingAtTick).toBeLessThan(patient.boundaryAtTick!);
    expect(patient.boundaryAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('puts a fully alert patient beside her inability to sit up', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('cannot sit or stand unsupported');
    expect(opening).toContain('the most reassuring thing at this bedside and the least predictive');
  });

  it('makes the scan rather than the syndrome decide what this is', () => {
    const imaging = narrations[beats.indexOf('imaging')]!;
    expect(imaging).toContain('the syndrome does not tell you');
    expect(imaging).toContain('blood changes who is called');
    expect(imaging).toContain('the fourth ventricle is already effaced');
    expect(beats.indexOf('imaging')).toBeLessThan(beats.indexOf('boundary'));
  });

  it('reads the first scan’s negatives as a clock reading rather than a reassurance', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('a clock reading rather than a reassurance');
    expect(boundary).toContain('not the moment to wait for it to declare itself');
    expect(patient.posteriorFossaEscalationBoundaryAuthored).toBe(true);
  });

  it('escalates while she still looks like she does not need it', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('still looks like she does not need it');
    expect(ownership).toContain('short and one-directional');
    expect(patient.qualifiedNeurosurgicalOwnershipActive).toBe(true);
    expect(patient.qualifiedNeurocriticalOwnershipActive).toBe(true);
    expect(patient.qualifiedAirwayCapableOwnershipActive).toBe(true);
  });

  it('names the order the deterioration arrived in', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('The alertness went before the airway did');
    expect(handoff).toContain('new obstructive hydrocephalus and brainstem compression');
    expect(narration).toContain('called before she changed');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.etiologyProven).toBe(false);
    expect(patient.anticoagulantExposureExcluded).toBe(false);
    expect(patient.futureExpansionExcluded).toBe(false);
    expect(patient.herniationExcluded).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durablePressureControlProven).toBe(false);
    expect(patient.durableAirwayProtectionProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is an infarct', 'the bleed has stopped', 'her airway is secure', 'she does not need surgery']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('measures no hematoma and selects no drug, airway, drain, or operation anywhere', () => {
    expect(patient.scoreCalculatedByLearner).toBe(false);
    expect(patient.hematomaVolumeCalculatedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.reversalProductSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.bloodPressureTargetSelectedByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.drainSelectedByLearner).toBe(false);
    expect(patient.surgerySelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give andexanet', 'intubate her now', 'place an external ventricular drain', 'target a pressure of']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Treats Reassurance As A Timestamp', () => {
  it('opens on an alert patient who cannot sit up', () => {
    const engine = create(); engine.step();
    const prompt = cerebellarIchInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cerebellarIch: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cerebellar-ich-trajectory');
    expect(prompt.because).toContain('the most reassuring thing at this bedside and the least predictive');
  });

  it('makes the scan rather than the syndrome decide what this is', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = cerebellarIchInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cerebellarIch: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cerebellar-ich-imaging');
    expect(prompt.suggestion).toContain('the syndrome does not tell you');
    expect(prompt.because).toContain('blood changes who is called');
    expect(prompt.because).toContain('the fourth ventricle is already effaced');
  });

  it('reads the first scan’s negatives as a clock reading', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = cerebellarIchInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cerebellarIch: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cerebellar-ich-boundary');
    expect(prompt.because).toContain('a clock reading rather than a reassurance');
    expect(prompt.because).toContain('not the moment to wait for it to declare itself');
  });

  it('escalates before anything changes and keeps the airway alongside', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = cerebellarIchInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cerebellarIch: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cerebellar-ich-ownership');
    expect(prompt.because).toContain('still looks like she does not need it');
    expect(prompt.because).toContain('alongside the surgical conversation rather than after it');
  });

  it('never determines an etiology, excludes exposure, or picks an operation', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = cerebellarIchInlinePrompt('guided', {
        scenarioVersion: '0.1.0', cerebellarIch: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is an infarct', 'the bleed has stopped', 'she does not need surgery', 'place an external ventricular drain']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(cerebellarIchInlinePrompt('guided', { scenarioVersion: '0.1.0', cerebellarIch: patient })!.id)
      .toBe('cerebellar-ich-later');
    expect(cerebellarIchInlinePrompt('coached', { scenarioVersion: '0.1.0', cerebellarIch: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(cerebellarIchInlinePrompt('unassisted', { scenarioVersion: '0.1.0', cerebellarIch: patient })).toBeNull();
    expect(cerebellarIchInlinePrompt('guided', { scenarioVersion: '0.1.1', cerebellarIch: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(cerebellarIchInlinePrompt('guided', { scenarioVersion: '0.1.0', cerebellarIch: snapshot(engine) })).toBeNull();
  });
});
