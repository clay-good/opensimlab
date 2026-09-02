/**
 * The worked example and observed-state tutor for a STEMI in the wrong
 * building.
 *
 * The lesson is a sequencing argument: the call goes out while the screening
 * happens. The tutor needs a beat for the state where the screen is done and
 * nobody has been called, because that is the failure this exists to catch.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS as SCENARIO } from '../../src/modules/cardiology/scenarios/stemi-recognition-and-first-actions';
import { CLINIC_STEMI_FIXTURES as FIXTURES } from '../../src/modules/cardiology/clinic-stemi-fixtures';
import {
  CLINIC_STEMI_DEMONSTRATION_VERSION, clinicStemiDemonstrationStep,
  supportsClinicStemiDemonstration,
} from '../../src/modules/cardiology/demo/clinic-stemi-demonstration';
import { clinicStemiInlinePrompt } from '../../src/modules/cardiology/tutor/clinic-stemi-guidance';
import type { ClinicStemiAction } from '../../src/modules/cardiology/clinic-stemi';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.clinicStemiAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ClinicStemiAction) => {
  engine.apply({ tick, type: 'clinic-stemi-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = clinicStemiDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'clinic-stemi-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before It Finishes Screening', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CLINIC_STEMI_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsClinicStemiDemonstration(SCENARIO)).toBe(true);
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(supportsClinicStemiDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
    expect(supportsClinicStemiDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('activates before it screens, which is one valid order and the argued one', () => {
    expect(beats).toEqual(['pattern', 'transfer', 'danger', 'bridge', 'handoff']);
    expect(patient.patternAtTick).toBeLessThan(patient.transferAtTick!);
    expect(patient.transferAtTick).toBeLessThan(patient.dangerAtTick!);
    expect(patient.dangerAtTick).toBeLessThan(patient.bridgeAtTick!);
    expect(patient.bridgeAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('starts the clock and disowns the ECG', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('the tissue clock started before she arrived');
    expect(pattern).toContain('You did not acquire that ECG');
  });

  it('refuses private transport and biomarker delay by name', () => {
    const transfer = narrations[beats.indexOf('transfer')]!;
    expect(transfer).toContain('The screening happens while the phone is ringing');
    expect(transfer).toContain('a troponin an hour from now will tell you what you already know');
    expect(patient.biomarkerDelayUsed).toBe(false);
  });

  it('treats the open questions as pre-alert items rather than conclusions', () => {
    const danger = narrations[beats.indexOf('danger')]!;
    expect(danger).toContain('belong in the pre-alert rather than in your conclusions');
    expect(danger).toContain('nitrates are somebody else');
    expect(danger).toContain('Escalation continues while you do this');
  });

  it('calls routine oxygen a habit rather than a treatment', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('a habit rather than a treatment');
    expect(bridge).toContain('a reperfusion strategy you do not know yet');
    expect(patient.downstreamTherapySelected).toBe(false);
    expect(patient.pciCapableSetting).toBe(false);
  });

  it('hands over what the receiving team cannot reconstruct', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('What they cannot reconstruct is what you know');
    expect(narration).toContain('nothing was given that somebody down the road will have to work around');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never gives a drug, orders oxygen, or names a destination', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give her aspirin', 'give 300 mg', 'start oxygen', 'give ticagrelor', 'give heparin', 'send her to', 'give fibrinolysis']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Has A Beat For The Uncalled Screen', () => {
  const V = '0.1.1';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['cst-pattern', 'cst-parallel', 'cst-danger', 'cst-bridge', 'cst-handoff']);
  });

  it('says nobody has been called when the screen went first', () => {
    const engine = create();
    advance(engine, 0, 'reconcile-clinic-stemi-pattern');
    advance(engine, 1, 'screen-clinic-stemi-danger');
    expect(snapshot(engine)!.dangerAtTick).not.toBeNull();
    expect(snapshot(engine)!.transferAtTick).toBeNull();
    const prompt = clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('cst-transfer');
    expect(prompt.suggestion).toContain('Nobody has been called');
    expect(prompt.because).toContain('moves her no closer to a catheter laboratory');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-clinic-stemi-bridge');
    expect(snapshot(engine)!.patternAtTick).toBeNull();
    expect(snapshot(engine)!.bridgeAtTick).toBeNull();
    expect(clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('cst-pattern');
  });

  it('does not move on when the handoff is refused for time', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'clinic-stemi-response', payload: { action: 'record-clinic-stemi-bridge' } });
    engine.apply({ tick: 3, type: 'clinic-stemi-response', payload: { action: 'reassess-clinic-stemi-handoff' } });
    engine.step();
    expect(snapshot(engine)!.bridgeAtTick).not.toBeNull();
    expect(snapshot(engine)!.handoffAtTick).toBeNull();
    expect(clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('cst-handoff');
  });

  it('never names a drug, a dose, or a destination', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give her aspirin', 'give 300 mg', 'start oxygen', 'send her to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(clinicStemiInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(clinicStemiInlinePrompt('guided', { scenarioVersion: '0.1.0', patient })).toBeNull();
    expect(clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(clinicStemiInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(clinicStemiInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
