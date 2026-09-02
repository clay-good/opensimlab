/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OBESITY_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/obesity-hypoventilation-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  obesityAuthored: true as const, daytimeHypercapniaAuthored: true as const,
  sleepDisorderedBreathingAuthored: true as const,
  acuteRespiratoryFailureAuthored: false as const,
  examinationPerformedByLearner: false as const, bmiCalculatedByLearner: false as const,
  serumBicarbonateAcquiredByLearner: false as const,
  bloodGasAcquiredByLearner: false as const, sleepStudyAcquiredByLearner: false as const,
  sleepStudyScoredByLearner: false as const, sleepStudyInterpretedByLearner: false as const,
  testInterpretedByLearner: false as const, otherCausesExcludedByLearner: false as const,
  diagnosisDeterminedByLearner: false as const, obesityCausalityProven: false as const,
  oxygenSelectedByLearner: false as const, supportDeviceSelectedByLearner: false as const,
  deviceOperatedByLearner: false as const, drugSelectedByLearner: false as const,
  weightInterventionSelectedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, patientPreferenceInferred: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = {
  phenotypeAtTick: null, awakeEvidenceAtTick: null, sleepEvidenceAtTick: null,
  recognitionAtTick: null, coordinatedPlanAtTick: null, handoffAtTick: null, ...NEVER,
};
const LABELS = ['Review symptoms + daytime state', 'Review awake CO₂ + bicarbonate',
  'Review sleep evidence + open causes', 'Recognize convergent OHS pattern',
  'Connect respiratory + sleep + weight-health owners', 'Hand off evidence + open work'];
const STATES = [EMPTY,
  { ...EMPTY, phenotypeAtTick: 0 },
  { ...EMPTY, phenotypeAtTick: 0, awakeEvidenceAtTick: 1 },
  { ...EMPTY, phenotypeAtTick: 0, awakeEvidenceAtTick: 1, sleepEvidenceAtTick: 2 },
  { ...EMPTY, phenotypeAtTick: 0, awakeEvidenceAtTick: 1, sleepEvidenceAtTick: 2, recognitionAtTick: 3 },
  { ...EMPTY, phenotypeAtTick: 0, awakeEvidenceAtTick: 1, sleepEvidenceAtTick: 2, recognitionAtTick: 3, coordinatedPlanAtTick: 4 },
  { phenotypeAtTick: 0, awakeEvidenceAtTick: 1, sleepEvidenceAtTick: 2, recognitionAtTick: 3, coordinatedPlanAtTick: 4, handoffAtTick: 5, ...NEVER },
  // The sleep lane read first, which is legitimate here.
  { ...EMPTY, phenotypeAtTick: 0, sleepEvidenceAtTick: 1 }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obesityHypoventilationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obesityHypoventilationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onObesityHypoventilationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obesityHypoventilationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory obesity-hypoventilation experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/obesity-hypoventilation-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/obesity-hypoventilation-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers CPAP, a pressure, a drug, or a weight target', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObesityHypoventilationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'obesity-hypoventilation-reassessment'),
    }).hasObesityHypoventilationResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(6);
    expect(markup(STATES[0]!)).toContain('Awake carbon dioxide completes the sleep story.');
    expect(markup(STATES[6]!)).toContain('A clear pattern deserves a joined-up plan.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|calculat|order the|acquire|score|interpret|CPAP|BiPAP|NIV|pressure|oxygen|drug|dose|weight target|bariatric|nutrition|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Obesity-hypoventilation tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { obesityHypoventilationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { obesityHypoventilationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('not her body size');
    const next = markup(STATES[1]!, { obesityHypoventilationGuidance: 'guided' });
    expect(next).toContain('be careful what you let the bicarbonate mean');
    expect(next).not.toContain('not her body size');
  });

  it('asks for the lane that is still empty, whichever one that is', () => {
    // Sleep study read first is legitimate, so the tutor should ask for the
    // awake gas rather than repeat itself.
    const sleepFirst = markup(STATES[7]!, { obesityHypoventilationGuidance: 'guided' });
    expect(sleepFirst).toContain('be careful what you let the bicarbonate mean');
    expect(sleepFirst).not.toContain('how much the clean results do not exclude');
  });

  it('refuses to conclude from any single number', () => {
    const html = markup(STATES[3]!, { obesityHypoventilationGuidance: 'guided' });
    expect(html).toContain('do not diagnose from any single number');
    expect(html).toContain('however striking');
  });

  it('keeps the respect in the plan', () => {
    const html = markup(STATES[4]!, { obesityHypoventilationGuidance: 'guided' });
    expect(html).toContain('keep the respect in it');
    expect(html).toContain('is not a plan');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { obesityHypoventilationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { obesityHypoventilationGuidance: 'guided', obesityHypoventilationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
