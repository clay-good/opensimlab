/**
 * The worked example and observed-state tutor for a decision the evidence cannot make.
 *
 * The risk specific to this lesson is a demonstration that looks decisive. The
 * panel's recommendation is conditional on very low certainty, so an example that
 * chose to anticoagulate — or chose not to — would be inventing confidence nobody
 * has. These tests hold the example to assembling the decision and handing it over
 * open.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { INCIDENTAL_CLOT_A_DECISION_THE_EVIDENCE_CANNOT_MAKE as SCENARIO } from '../../src/modules/oncology/scenarios/incidental-clot-a-decision-the-evidence-cannot-make';
import { INCIDENTAL_CLOT_FIXTURES as FIXTURES } from '../../src/modules/oncology/incidental-clot-fixtures';
import {
  INCIDENTAL_CLOT_DEMONSTRATION_VERSION, incidentalClotDemonstrationStep,
  supportsIncidentalClotDemonstration,
} from '../../src/modules/oncology/demo/incidental-clot-demonstration';
import { incidentalClotInlinePrompt } from '../../src/modules/oncology/incidental-clot-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.incidentalClot;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = incidentalClotDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) {
      engine.apply({ tick, type: 'incidental-clot-response', payload: { action: step.action } });
    }
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Assembles The Decision And Leaves It Open', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(INCIDENTAL_CLOT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsIncidentalClotDemonstration(SCENARIO)).toBe(true);
    expect(supportsIncidentalClotDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through the real engine', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats.at(-1)).toBe('handoff');
  });

  it('records both directions of the trade before contacting anyone', () => {
    expect(beats.indexOf('tradeoff')).toBeLessThan(beats.indexOf('escalate'));
    expect(beats.indexOf('bleeding-risk')).toBeLessThan(beats.indexOf('escalate'));
    expect(beats.indexOf('certainty')).toBeLessThan(beats.indexOf('escalate'));
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.dismissalAttempted).toBe(false);
    expect(patient.reflexTreatmentAttempted).toBe(false);
    expect(patient.waitForSymptomsAttempted).toBe(false);
    expect(patient.deferralAttempted).toBe(false);
  });

  it('never narrates a choice to treat or not to treat', () => {
    // The panel found no randomised trial addressing the question. An example that
    // resolved it would be modelling confidence the evidence does not support.
    const text = narrations.join(' ').toLowerCase();
    for (const decisive of ['we should anticoagulate', 'do not anticoagulate', 'start anticoagulation',
      'withhold anticoagulation', 'the right answer is']) {
      expect(text, decisive).not.toContain(decisive);
    }
    expect(narrations.at(-1)!.toLowerCase()).toContain('without choosing for him');
  });
});

describe('Requirement: The Tutor Does Not Resolve What The Panel Could Not', () => {
  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(incidentalClotInlinePrompt('unassisted', { scenarioVersion: '0.1.0', incidentalClot: patient })).toBeNull();
    expect(incidentalClotInlinePrompt('guided', { scenarioVersion: '0.1.1', incidentalClot: patient })).toBeNull();
  });

  it('points at what the decision needs, never at which way it goes', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-the-finding-and-how-it-was-found',
      'record-the-certainty-of-the-recommendation', 'record-the-benefit-and-the-harm-together',
      'record-this-patients-bleeding-risk'] as const) {
      const prompt = incidentalClotInlinePrompt('guided', {
        scenarioVersion: '0.1.0', incidentalClot: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'incidental-clot-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['should be anticoagulated', 'do not treat', 'the answer is', 'mg']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the non-urgent listening beat at the coached level', () => {
    const engine = create();
    for (const action of ['record-the-finding-and-how-it-was-found',
      'record-the-certainty-of-the-recommendation', 'record-the-benefit-and-the-harm-together',
      'record-this-patients-bleeding-risk'] as const) {
      engine.apply({ tick: 0, type: 'incidental-clot-response', payload: { action } });
    }
    engine.step();
    const patient = snapshot(engine);
    expect(incidentalClotInlinePrompt('coached', { scenarioVersion: '0.1.0', incidentalClot: patient })).toBeNull();
    expect(incidentalClotInlinePrompt('guided', { scenarioVersion: '0.1.0', incidentalClot: patient })?.id)
      .toBe('incidental-clot-listen');
  });
});
