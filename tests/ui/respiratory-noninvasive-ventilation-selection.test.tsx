/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NONINVASIVE_VENTILATION_SELECTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/noninvasive-ventilation-selection';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  copdExacerbationAuthored: true as const,
  acuteHypercapnicAcidosisAuthored: true as const,
  standardInitialTherapyAuthored: true as const,
  immediateDeteriorationAuthored: false as const,
  airwayProtectionFailureAuthored: false as const,
  hemodynamicInstabilityAuthored: false as const,
  patientExaminedByLearner: false as const, bloodGasAcquiredByLearner: false as const,
  bloodGasInterpretedByLearner: false as const, imagingAcquiredByLearner: false as const,
  oxygenSelectedByLearner: false as const, interfaceSelectedByLearner: false as const,
  pressureSelectedByLearner: false as const, backupRateSelectedByLearner: false as const,
  deviceOperatedByLearner: false as const, ventilationDeliveredByLearner: false as const,
  drugSelectedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  intubationPerformedByLearner: false as const, durableNivSuccessProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, suitabilityAtTick: null, selectionAtTick: null,
  responseAtTick: null, failureGuardsAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null, bilevelNivSelectedByLearner: false,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['noninvasiveVentilationSelectionAssessment']>);

const EMPTY = base({});
const SUITABLE = base({ trajectoryAtTick: 0, suitabilityAtTick: 1 });
const AFTER_CPAP = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, lastUnsupportedChoice: 'cpap' });
const AFTER_HFNO = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, lastUnsupportedChoice: 'high-flow' });
const SELECTED = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, bilevelNivSelectedByLearner: true });
const GUARDED = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, failureGuardsAtTick: 4, bilevelNivSelectedByLearner: true });
const DONE = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, failureGuardsAtTick: 4, handoffAtTick: 5, bilevelNivSelectedByLearner: true });
const STATES = [EMPTY, SUITABLE, AFTER_CPAP, AFTER_HFNO, SELECTED, GUARDED, DONE];

const LABELS = ['Review initial care + trajectory', 'Review acidosis + NIV suitability',
  'Bilevel NIV trial', 'CPAP alone', 'High-flow nasal oxygen',
  'Review 1-hour whole-patient response', 'Continue trial + preserve rescue triggers',
  'Hand off active support + rescue plan'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['noninvasiveVentilationSelectionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, noninvasiveVentilationSelectionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 400, respiratoryRateBpm: 30, fio2: 0.28, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onNoninvasiveVentilationSelectionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['noninvasiveVentilationSelectionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory support-selection experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/noninvasive-ventilation-selection"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/noninvasive-ventilation-selection' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('offers all three support goals only once suitability is held', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNoninvasiveVentilationSelectionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'noninvasive-ventilation-selection'),
    }).hasNoninvasiveVentilationSelectionResponse).toBe(false);
    // The wrong answers are deliberately offered — a choice you cannot make
    // is not a choice — but not before the review that earns them.
    const opening = markup(EMPTY);
    expect(opening).not.toContain('CPAP alone');
    expect(opening).not.toContain('High-flow nasal oxygen');
    const ready = markup(SUITABLE);
    expect(ready).toContain('Bilevel NIV trial');
    expect(ready).toContain('CPAP alone');
    expect(ready).toContain('High-flow nasal oxygen');
  });

  it('says what happened after a wrong support goal', () => {
    expect(markup(AFTER_CPAP)).toContain('CPAP alone does not provide the same inspiratory ventilatory assistance here');
    expect(markup(AFTER_HFNO)).toContain('High-flow alone is not the selected first support for this acidotic hypercapnic pattern');
  });

  it('never offers a pressure, an interface, an oxygen target, or an intubation', () => {
    expect(markup(EMPTY)).toContain('Choose support from physiology, not familiarity.');
    expect(markup(DONE)).toContain('A trial earns its place through reassessment.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|acquire|interpret|IPAP|EPAP|PEEP|pressure|backup rate|FiO|oxygen target|intubat|sedat|suction|drug|dose|diagnose|disposition|discharge|prognos/iu);
    }
  });
});

describe('Support-selection tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { noninvasiveVentilationSelectionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { noninvasiveVentilationSelectionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('has already failed to fix');
    const ready = markup(SUITABLE, { noninvasiveVentilationSelectionGuidance: 'guided' });
    expect(ready).toContain('not just her oxygen');
    expect(ready).not.toContain('has already failed to fix');
  });

  it('answers the specific wrong device the learner just chose', () => {
    const cpap = markup(AFTER_CPAP, { noninvasiveVentilationSelectionGuidance: 'guided' });
    expect(cpap).toContain('It does not do the breathing');
    expect(cpap).toContain('cardiogenic pulmonary edema');
    expect(cpap).not.toContain('not her ventilation');
    const hfno = markup(AFTER_HFNO, { noninvasiveVentilationSelectionGuidance: 'guided' });
    expect(hfno).toContain('not her ventilation');
    expect(hfno).toContain('a saturation that looks better while the acidosis carries on');
    expect(hfno).not.toContain('It does not do the breathing');
  });

  it('will not let a trial run without a failure guard', () => {
    const html = markup(SELECTED, { noninvasiveVentilationSelectionGuidance: 'guided' });
    expect(html).toContain('read the response you were given');
    const guards = markup(base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, bilevelNivSelectedByLearner: true }),
      { noninvasiveVentilationSelectionGuidance: 'guided' });
    expect(guards).toContain('just an assumption with a mask on it');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { noninvasiveVentilationSelectionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { noninvasiveVentilationSelectionGuidance: 'guided', noninvasiveVentilationSelectionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
