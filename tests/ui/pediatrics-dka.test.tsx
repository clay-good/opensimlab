/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  pediatricDkaAuthored: true as const, dehydrationAuthored: true as const,
  shockAuthored: false as const, cerebralInjuryAuthored: false as const,
  cerebralInjuryRiskActive: true as const, fixedBiochemicalPatternAuthored: true as const,
  patientExaminedByLearner: false as const, neurologicExamPerformedByLearner: false as const,
  dehydrationCalculatedByLearner: false as const, sodiumCalculatedByLearner: false as const,
  osmolalityCalculatedByLearner: false as const, anionGapCalculatedByLearner: false as const,
  testAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, severityCalculatedByLearner: false as const,
  fluidSelectedByLearner: false as const, insulinSelectedByLearner: false as const,
  electrolyteSelectedByLearner: false as const, glucoseSelectedByLearner: false as const,
  fluidDeliveredByLearner: false as const, drugSelectedByLearner: false as const,
  deviceSelectedByLearner: false as const, procedurePerformedByLearner: false as const,
  doseSelectedByLearner: false as const, concentrationSelectedByLearner: false as const,
  routeSelectedByLearner: false as const, accessPlacedByLearner: false as const,
  fluidVolumeSelectedByLearner: false as const, fluidRateSelectedByLearner: false as const,
  infusionOperatedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  cerebralInjuryExcluded: false as const, treatmentEffectProven: false as const,
  biochemicalResolutionProven: false as const, durableRecoveryProven: false as const,
  dischargeReadinessProven: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, careAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedCareOwnershipActive: over.careAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricDiabeticKetoacidosisAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const CARE_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2 });
const SAFETY_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, CARE_ONLY, SAFETY_ONLY, BOTH, LATER, DONE];

const LABELS = ['Review illness + fixed panel', 'Recognize pediatric DKA risk',
  'Activate qualified DKA care', 'Review neurologic + metabolic safety',
  'Review the 60-minute report', 'Hand off active DKA risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricDiabeticKetoacidosisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricDiabeticKetoacidosisAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 210, respiratoryRateBpm: 30, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricDiabeticKetoacidosisResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricDiabeticKetoacidosisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric DKA experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-diabetic-ketoacidosis"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-diabetic-ketoacidosis' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricDiabeticKetoacidosisResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-diabetic-ketoacidosis-reassessment'),
    }).hasPediatricDiabeticKetoacidosisResponse).toBe(false);
  });

  it('offers both halves of the unordered pair at once, and one action elsewhere', () => {
    expect(lessonButtons(markup(RECOGNIZED))).toHaveLength(2);
    expect(markup(RECOGNIZED)).toContain('Activate qualified DKA care');
    expect(markup(RECOGNIZED)).toContain('Review neurologic + metabolic safety');
    for (const state of [EMPTY, TRAJECTORY, CARE_ONLY, SAFETY_ONLY, BOTH, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(CARE_ONLY)).toContain('Review neurologic + metabolic safety');
    expect(markup(SAFETY_ONLY)).toContain('Activate qualified DKA care');
    expect(markup(BOTH)).toContain('Review the 60-minute report');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers an insulin, a rate, a correction, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read the child, not one number.');
    expect(markup(BOTH)).toContain('Make every reassessment count.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|insulin|dextrose|bicarbonate|potassium|bolus|mL\/kg|units\/kg|corrected sodium|osmolal|anion gap|cannula|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric DKA tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricDkaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricDkaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('They are one story');
    const recognition = markup(TRAJECTORY, { pediatricDkaGuidance: 'guided' });
    expect(recognition).toContain('Three findings make this, not one');
    expect(recognition).not.toContain('They are one story');
  });

  it('refuses to turn the absent warning cluster into an exclusion', () => {
    const html = markup(TRAJECTORY, { pediatricDkaGuidance: 'guided' });
    expect(html).toContain('a description of this minute and not an exclusion');
    expect(html).toContain('Cerebral injury stays possible in this child');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(RECOGNIZED, { pediatricDkaGuidance: 'guided' });
    expect(neither).toContain('the watch on her brain');
    const careMissing = markup(SAFETY_ONLY, { pediatricDkaGuidance: 'guided' });
    expect(careMissing).toContain('The protocol still has no owner');
    expect(careMissing).not.toContain('the watch on her brain');
    const watchMissing = markup(CARE_ONLY, { pediatricDkaGuidance: 'guided' });
    expect(watchMissing).toContain('This is the step the lesson exists for');
    expect(watchMissing).not.toContain('The protocol still has no owner');
  });

  it('treats uniformly improving numbers as the moment to be most careful', () => {
    const html = markup(BOTH, { pediatricDkaGuidance: 'guided' });
    expect(html).toContain('that is the moment to be most careful');
    expect(html).toContain('The surveillance does not relax because the numbers did');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricDkaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricDkaGuidance: 'guided', pediatricDkaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
