/**
 * The worked example and observed-state tutor for a support decision made by
 * what he is doing.
 *
 * A worked example is where a number gets memorized, so this one is careful
 * about which of them travel. The branch is chosen on the spontaneous breathing
 * rather than the gestation, and the 30% oxygen start is one qualified team's
 * choice inside a 30% to 100% range rather than a figure to carry to the next
 * bedside.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PRETERM_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/neonatology/scenarios/preterm-respiratory-distress';
import { PRETERM_RESPIRATORY_DISTRESS_FIXTURES as FIXTURES } from '../../src/modules/neonatology/preterm-respiratory-distress-fixtures';
import {
  PRETERM_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION, pretermRespiratoryDistressDemonstrationStep,
  supportsPretermRespiratoryDistressDemonstration,
} from '../../src/modules/neonatology/demo/preterm-respiratory-distress-demonstration';
import { pretermRespiratoryDistressInlinePrompt } from '../../src/modules/neonatology/tutor/preterm-respiratory-distress-guidance';
import type { PretermRespiratoryDistressAction } from '../../src/modules/neonatology/preterm-respiratory-distress';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neonatologyPretermRespiratoryDistressAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PretermRespiratoryDistressAction) => {
  engine.apply({ tick, type: 'preterm-respiratory-distress-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pretermRespiratoryDistressDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'preterm-respiratory-distress-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Chooses The Branch On The Breathing', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PRETERM_RESPIRATORY_DISTRESS_DEMONSTRATION_VERSION).toBe('0.1.1');
    expect(supportsPretermRespiratoryDistressDemonstration(SCENARIO)).toBe(true);
    expect(supportsPretermRespiratoryDistressDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
    expect(supportsPretermRespiratoryDistressDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'recognize', 'readiness', 'report', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names which finding decides the branch', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('The gestation describes him. The breathing decides this.');
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('rather than routine intubation');
    expect(recognize).toContain('not that he is twenty-nine weeks');
  });

  it('sends the range travelling rather than the number', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('30% to 100% is a reasonable initial range');
    expect(readiness).toContain('rather than a prescription to carry elsewhere');
  });

  it('names what would leave this branch', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('belongs to the positive-pressure branch');
  });

  it('operates nothing and excludes nothing', () => {
    expect(patient.cpapOxygenOrOtherDeviceOperatedByLearner).toBe(false);
    expect(patient.pressureFlowOxygenOrOtherSettingSelectedByLearner).toBe(false);
    expect(patient.suctionPerformedByLearner).toBe(false);
    expect(patient.airwayPlacedOrManagedByLearner).toBe(false);
    expect(patient.compressionsAccessFluidGlucoseSurfactantOrDrugDeliveredByLearner).toBe(false);
    expect(patient.adequateVentilationProven).toBe(false);
    expect(patient.respiratoryDiseaseExcluded).toBe(false);
    expect(patient.infectionExcluded).toBe(false);
    expect(patient.airLeakExcluded).toBe(false);
    expect(patient.congenitalDiseaseExcluded).toBe(false);
    expect(patient.durableStabilityProven).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he is stable now', 'he has respiratory distress syndrome', 'give surfactant', 'set the cpap to', 'infection is excluded']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('finishes on a working support over an undiagnosed newborn', () => {
    expect(narrations[beats.indexOf('handoff')]).toContain('The support is working and the disease is unnamed');
    expect(narration).toContain('nothing about his lungs named');
  });
});

describe('Requirement: The Tutor Keeps The Gestation Out Of The Decision', () => {
  it('treats the thermal plan as part of the respiratory care', () => {
    const engine = create(); engine.step();
    const prompt = pretermRespiratoryDistressInlinePrompt('guided', {
      scenarioVersion: '0.1.1', pretermRespiratoryDistress: snapshot(engine),
    })!;
    expect(prompt.id).toBe('preterm-respiratory-support');
    expect(prompt.because).toContain('it is part of it');
  });

  it('chooses the branch on the spontaneous breathing', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    advance(engine, 1, FIXTURES.expert[1][1]);
    const prompt = pretermRespiratoryDistressInlinePrompt('guided', {
      scenarioVersion: '0.1.1', pretermRespiratoryDistress: snapshot(engine),
    })!;
    expect(prompt.id).toBe('preterm-respiratory-recognize');
    expect(prompt.because).toContain('not that he is 29 weeks');
    expect(prompt.because).toContain('is not read alone');
  });

  it('refuses to send the 30% start travelling', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = pretermRespiratoryDistressInlinePrompt('guided', {
      scenarioVersion: '0.1.1', pretermRespiratoryDistress: snapshot(engine),
    })!;
    expect(prompt.id).toBe('preterm-respiratory-readiness');
    expect(prompt.because).toContain('rather than a prescription to carry elsewhere');
    expect(prompt.because).toContain('positive-pressure branch');
  });

  it('never operates the device nor names the disease', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pretermRespiratoryDistressInlinePrompt('guided', {
        scenarioVersion: '0.1.1', pretermRespiratoryDistress: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he is stable now', 'he has respiratory distress syndrome', 'give surfactant', 'set the cpap to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(pretermRespiratoryDistressInlinePrompt('guided', { scenarioVersion: '0.1.1', pretermRespiratoryDistress: patient })!.id)
      .toBe('preterm-respiratory-observe');
    expect(pretermRespiratoryDistressInlinePrompt('coached', { scenarioVersion: '0.1.1', pretermRespiratoryDistress: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pretermRespiratoryDistressInlinePrompt('unassisted', { scenarioVersion: '0.1.1', pretermRespiratoryDistress: patient })).toBeNull();
    expect(pretermRespiratoryDistressInlinePrompt('guided', { scenarioVersion: '0.1.0', pretermRespiratoryDistress: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pretermRespiratoryDistressInlinePrompt('guided', { scenarioVersion: '0.1.1', pretermRespiratoryDistress: snapshot(engine) })).toBeNull();
  });
});
