/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/neuromuscular-respiratory-failure-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  establishedMotorNeuronDiseaseAuthored: true as const,
  neuromuscularRespiratoryFailureAuthored: true as const,
  respiratoryMeasurementsAuthored: true as const,
  daytimeHypercapniaAuthored: true as const,
  examinationPerformedByLearner: false as const,
  respiratoryStrengthMeasuredByLearner: false as const,
  bloodGasAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
  imagingAcquiredByLearner: false as const, airwayAssessedByLearner: false as const,
  coughAssessedByLearner: false as const,
  ventilationDeliveredByLearner: false as const,
  oxygenDeliveredByLearner: false as const, supportDeviceSelectedByLearner: false as const,
  coughAssistDeliveredByLearner: false as const,
  secretionProcedurePerformedByLearner: false as const,
  airwayProcedurePerformedByLearner: false as const,
  nutritionSelectedByLearner: false as const, patientPreferenceInferred: false as const,
  treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = {
  trajectoryAtTick: null, failureAtTick: null, escalationAtTick: null,
  reviewAtTick: null, ownershipAtTick: null, handoffAtTick: null, ...NEVER,
};
const LABELS = ['Review breathing + weakness trajectory', 'Recognize convergent failure pattern',
  'Connect ventilation + airway-ready owners', 'Review cough + bulbar + open causes',
  'Coordinate priorities + shared owners', 'Hand off active risk + open work'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1, escalationAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1, escalationAtTick: 2, reviewAtTick: 3 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1, escalationAtTick: 2, reviewAtTick: 3, ownershipAtTick: 4 },
  { trajectoryAtTick: 0, failureAtTick: 1, escalationAtTick: 2, reviewAtTick: 3, ownershipAtTick: 4, handoffAtTick: 5, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['neuromuscularRespiratoryFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neuromuscularRespiratoryFailureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 340, respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onNeuromuscularRespiratoryFailureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['neuromuscularRespiratoryFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory neuromuscular respiratory-failure experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/neuromuscular-respiratory-failure-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/neuromuscular-respiratory-failure-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers ventilation, a setting, suction, or an airway procedure', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeuromuscularRespiratoryFailureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'neuromuscular-respiratory-failure-reassessment'),
    }).hasNeuromuscularRespiratoryFailureResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(6);
    expect(markup(STATES[0]!)).toContain('Muscle strength can fade before saturation tells the story.');
    expect(markup(STATES[6]!)).toContain('Preparation can be urgent and still remain deeply personal.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|spirometr|order the|acquire|interpret|suction|intubat|tracheostom|NIV|BiPAP|CPAP|oxygen|setting|drug|dose|nutrition|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Neuromuscular respiratory-failure tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neuromuscularRespiratoryFailureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neuromuscularRespiratoryFailureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('three months of decline against two weeks of new symptoms');
    const next = markup(STATES[1]!, { neuromuscularRespiratoryFailureGuidance: 'guided' });
    expect(next).toContain('not one cutoff');
    expect(next).not.toContain('three months of decline against two weeks of new symptoms');
  });

  it('will not let the cause review delay experienced help', () => {
    const html = markup(STATES[2]!, { neuromuscularRespiratoryFailureGuidance: 'guided' });
    expect(html).toContain('before the cause review is finished');
    expect(html).toContain('runs in parallel with this, not after it');
  });

  it('asks him rather than assuming what he would want', () => {
    const html = markup(STATES[4]!, { neuromuscularRespiratoryFailureGuidance: 'guided' });
    expect(html).toContain('ask him rather than assume');
    expect(html).toContain('rather than a courtesy');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { neuromuscularRespiratoryFailureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neuromuscularRespiratoryFailureGuidance: 'guided', neuromuscularRespiratoryFailureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
