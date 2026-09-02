/**
 * The worked example and observed-state tutor for a tracheostomy that has
 * stopped working.
 *
 * The four refusable choices here are not reflexes but harms, and the tutor
 * answers each by naming the specific damage: a scan he has no time for,
 * gas down a path with no waveform CO₂ behind it, a catheter forced past the
 * resistance that was telling you where the obstruction is, and a secure
 * outer tube given up for a harder problem.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/acute-tracheostomy-obstruction-fixtures';
import {
  ACUTE_TRACHEOSTOMY_OBSTRUCTION_DEMONSTRATION_VERSION, acuteTracheostomyObstructionDemonstrationStep,
  supportsAcuteTracheostomyObstructionDemonstration,
} from '../../src/modules/respiratory-medicine/demo/acute-tracheostomy-obstruction-demonstration';
import { acuteTracheostomyObstructionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/acute-tracheostomy-obstruction-guidance';
import type { AcuteTracheostomyObstructionAction } from '../../src/modules/respiratory-medicine/acute-tracheostomy-obstruction';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.acuteTracheostomyObstructionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AcuteTracheostomyObstructionAction) => {
  engine.apply({ tick, type: 'acute-tracheostomy-obstruction-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = acuteTracheostomyObstructionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-tracheostomy-obstruction-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Bedhead Sign First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ACUTE_TRACHEOSTOMY_OBSTRUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAcuteTracheostomyObstructionDemonstration(SCENARIO)).toBe(true);
    expect(supportsAcuteTracheostomyObstructionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAcuteTracheostomyObstructionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['recognition', 'support', 'pathway', 'innerCannula', 'restoration', 'handoff']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.devicePathwayAtTick!);
    expect(patient.devicePathwayAtTick).toBeLessThan(patient.innerCannulaAtTick!);
    // Two time gates: the two-minute review and the handoff each need a later tick.
    expect(patient.innerCannulaAtTick).toBeLessThan(patient.restorationAtTick!);
    expect(patient.restorationAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('takes none of the four harms', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.dualRouteOxygenIntentRecorded).toBe(true);
    expect(patient.expertDevicePathwayRecorded).toBe(true);
  });

  it('reads the sign, and does not let capnography stand alone', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('a tracheostomy and not a laryngectomy');
    expect(recognition).toContain('one strand of that, not the finding on its own');
    expect(patient.tracheostomyPresentAuthored).toBe(true);
    expect(patient.laryngectomyAuthored).toBe(false);
  });

  it('oxygenates both routes because the upper airway is patent', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('two ways in rather than one');
    expect(support).toContain('buys every other step its time');
    expect(patient.patentUpperAirwayAuthored).toBe(true);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
  });

  it('keeps the authored branch bounded to this device and anatomy', () => {
    const pathway = narrations[beats.indexOf('pathway')]!;
    expect(pathway).toContain('nothing to take off first');
    expect(pathway).toContain('not a universal pathway for a laryngectomy');
    expect(patient.removableInnerCannulaAuthored).toBe(true);
    expect(patient.innerCannulaObstructionAuthored).toBe(true);
  });

  it('takes the reversible step and leaves the stoma track intact', () => {
    const inner = narrations[beats.indexOf('innerCannula')]!;
    expect(inner).toContain('smallest intervention');
    expect(inner).toContain('immediately reversible');
    expect(patient.innerCannulaHandledByLearner).toBe(false);
    expect(patient.tracheostomyTubeHandledByLearner).toBe(false);
  });

  it('separates a patent tube from a recovered patient', () => {
    const restoration = narrations[beats.indexOf('restoration')]!;
    expect(restoration).toContain('A patent tube is not the same as a recovered patient');
    expect(patient.durablePatencyProven).toBe(false);
  });

  it('ends by naming what has not been fixed', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('has a cause, and that cause has not been fixed');
    expect(narration).toContain('a stoma track nobody had to fight for');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('touches nothing, ventilates nothing, and predicts nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.monitorInterpretedByLearner).toBe(false);
    expect(patient.deviceInspectedByLearner).toBe(false);
    expect(patient.catheterPassedByLearner).toBe(false);
    expect(patient.suctionPerformedByLearner).toBe(false);
    expect(patient.cuffChangedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.intubationPerformedByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['suction him', 'pass a catheter', 'take the tube out', 'deflate the cuff', 'intubate him', 'he is safe now', 'he will be fine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Names The Harm', () => {
  const V = '0.1.0';
  const atSupport = () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    return engine;
  };
  const atInnerCannula = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    return engine;
  };

  it('opens on the bedhead sign', () => {
    const engine = create(); engine.step();
    const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ato-recognition');
    expect(prompt.suggestion).toContain('It changes everything that follows');
  });

  it('answers waiting for imaging', () => {
    const engine = atSupport();
    advance(engine, 1, 'wait-for-acute-tracheostomy-obstruction-imaging');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('imaging');
    const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ato-imaging-refused');
    expect(prompt.because).toContain('the only thing he is actually short of');
  });

  it('answers ventilating an unverified tracheostomy with the specific harm', () => {
    const engine = atSupport();
    advance(engine, 1, 'ventilate-through-unverified-tracheostomy');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('unverified-ventilation');
    const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ato-unverified-refused');
    expect(prompt.suggestion).toContain('a path nobody has verified');
    expect(prompt.because).toContain('inflate tissue rather than lung');
  });

  it('answers forcing a catheter', () => {
    const engine = atInnerCannula();
    advance(engine, 3, 'force-acute-tracheostomy-obstruction-catheter');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('force-catheter');
    const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ato-catheter-refused');
    expect(prompt.suggestion).toContain('Resistance is information');
    expect(prompt.because).toContain('losing a stoma track that is currently intact');
  });

  it('answers whole-tube replacement without calling it wrong in general', () => {
    const engine = atInnerCannula();
    advance(engine, 3, 'replace-whole-tracheostomy-first');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('whole-tube');
    const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ato-whole-tube-refused');
    expect(prompt.because).toContain('a real and sometimes necessary step');
    expect(prompt.because).toContain('harder, bloodier problem');
  });

  it('stops answering the wrong choice once the right one is taken', () => {
    const engine = atSupport();
    advance(engine, 1, 'ventilate-through-unverified-tracheostomy');
    advance(engine, 2, 'activate-acute-tracheostomy-obstruction-help-and-oxygenation');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBeNull();
    expect(acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id).toBe('ato-pathway');
  });

  it('never suctions, removes a tube, or declares him safe', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(7);
    for (const text of seen) {
      for (const forbidden of ['suction him', 'take the tube out', 'deflate the cuff', 'he is safe now', 'he will be fine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(acuteTracheostomyObstructionInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(acuteTracheostomyObstructionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(acuteTracheostomyObstructionInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
