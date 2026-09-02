/**
 * The worked example and observed-state tutor for a child in whom every wrong
 * answer costs time.
 *
 * None of the four refusals is over-treatment. A measurement she cannot
 * perform, a film that answers a question nobody is asking, a conversation
 * that is owed to her but not in this hour, and a discharge read off a
 * saturation she is holding on oxygen.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_STATUS_ASTHMATICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';
import { PEDIATRIC_STATUS_ASTHMATICUS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-status-asthmaticus-fixtures';
import {
  PEDIATRIC_STATUS_ASTHMATICUS_DEMONSTRATION_VERSION, pediatricStatusAsthmaticusDemonstrationStep,
  supportsPediatricStatusAsthmaticusDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-status-asthmaticus-demonstration';
import { pediatricStatusAsthmaticusInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-status-asthmaticus-guidance';
import type { PediatricStatusAsthmaticusAction } from '../../src/modules/pediatrics/pediatric-status-asthmaticus';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricStatusAsthmaticusAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricStatusAsthmaticusAction) => {
  engine.apply({ tick, type: 'pediatric-status-asthmaticus-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricStatusAsthmaticusDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-status-asthmaticus-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Spend Her Time', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_STATUS_ASTHMATICUS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricStatusAsthmaticusDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricStatusAsthmaticusDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricStatusAsthmaticusDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'nonresponse', 'escalation', 'secondLine', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.nonresponseAtTick!);
    expect(patient.nonresponseAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.escalationAtTick).toBeLessThan(patient.secondLineIntentAtTick!);
    // Two time gates: the later response and the handoff.
    expect(patient.secondLineIntentAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('takes none of the four refusable choices', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.experiencedSecondLineCareAuthored).toBe(true);
  });

  it('starts from what an hour of correct treatment did not fix', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('a fact about this child rather than a universal threshold');
    expect(trajectory).toContain('That is what nonresponse looks like');
    expect(patient.treatmentRecordAuthored).toBe(true);
  });

  it('is careful about what the reassuring findings do not mean', () => {
    const nonresponse = narrations[beats.indexOf('nonresponse')]!;
    expect(nonresponse).toContain('not that she is safe from it');
    expect(nonresponse).toContain('anaphylaxis care must not wait behind this pathway');
    expect(patient.persistentSevereNonresponseAuthored).toBe(true);
    expect(patient.respiratoryFailureAuthored).toBe(false);
  });

  it('escalates on the nonresponse rather than on further deterioration', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('not waiting for her to deteriorate further to justify the call');
    expect(escalation).toContain('present before the moment they are needed');
    expect(patient.ivAccessPlacedByLearner).toBe(false);
  });

  it('names the owner and the monitoring as the available intervention', () => {
    const secondLine = narrations[beats.indexOf('secondLine')]!;
    expect(secondLine).toContain('naming the owner and the monitoring is the intervention available to you');
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.infusionOperatedByLearner).toBe(false);
  });

  it('separates a partial response from a resolved one', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('not the same as a resolved one');
    expect(patient.partialResponseAuthored).toBe(true);
  });

  it('ends with the trigger conversation recorded as work still owed', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('as work still owed to her');
    expect(narration).toContain('for an hour when she can take part in it');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('measures nothing, treats nothing, and predicts nothing', () => {
    expect(patient.pefMeasuredByLearner).toBe(false);
    expect(patient.scoreCalculatedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.nebulizerOperatedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give magnesium', 'start aminophylline', 'intubate her', 'blow into this', 'she can go home', 'she is over the worst']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers All Four Delays', () => {
  const V = '0.1.0';
  const atNonresponse = () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    return engine;
  };
  const atSecondLine = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    return engine;
  };
  const atHandoff = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 5)) advance(engine, tick, action);
    return engine;
  };

  it('opens from what the first hour did not fix', () => {
    const engine = create(); engine.step();
    const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psa-trajectory');
    expect(prompt.suggestion).toContain('Start from what it did not fix');
  });

  it('answers the forced peak flow with what trying would cost', () => {
    const engine = atNonresponse();
    advance(engine, 1, 'force-pediatric-status-asthmaticus-peak-flow');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('force-peak-flow');
    const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psa-peak-flow-refused');
    expect(prompt.because).toContain('spends the reserve she is using to stay conscious');
    expect(prompt.because).toContain('could not trust anyway');
  });

  it('answers the radiograph by naming what would justify one', () => {
    const engine = atNonresponse();
    advance(engine, 1, 'wait-for-pediatric-status-asthmaticus-routine-radiograph');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('radiograph-delay');
    const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psa-radiograph-refused');
    expect(prompt.because).toContain('a pneumothorax, a focal collapse, a foreign body');
  });

  it('answers the trigger review as sequencing rather than dismissal', () => {
    const engine = atSecondLine();
    advance(engine, 3, 'delay-pediatric-status-asthmaticus-escalation-for-trigger-review');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('trigger-review-delay');
    const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psa-trigger-refused');
    expect(prompt.suggestion).toContain('They do not belong in this hour');
    expect(prompt.because).toContain('a sequencing judgment rather than a dismissal');
    expect(prompt.because).toContain('the conversation is owed to her, just not while she is speaking one word at a time');
  });

  it('answers the discharge with what the saturation cannot tell you', () => {
    const engine = atHandoff();
    advance(engine, 5, 'discharge-pediatric-status-asthmaticus-from-saturation-alone');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('saturation-discharge');
    const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psa-discharge-refused');
    expect(prompt.because).toContain('on oxygen rather than air');
    expect(prompt.because).toContain('when the treatment interval lengthens');
  });

  it('returns to the ordinary beat once the engine clears the wrong turn', () => {
    const engine = atNonresponse();
    advance(engine, 1, 'force-pediatric-status-asthmaticus-peak-flow');
    advance(engine, 2, 'recognize-pediatric-status-asthmaticus-severe-nonresponse');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBeNull();
    expect(pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psa-escalation');
  });

  it('never measures, treats, or declares her over the worst', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give magnesium', 'intubate her', 'she can go home', 'she is over the worst']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricStatusAsthmaticusInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('stays silent after handoff even when a refusal is still recorded', () => {
    // The handoff does not clear lastUnsupportedChoice in this lesson, so the
    // silence has to come from the handoff check rather than a cleared value.
    const engine = create();
    for (const [tick, action] of FIXTURES.recovery) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('saturation-discharge');
    expect(pediatricStatusAsthmaticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricStatusAsthmaticusInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
