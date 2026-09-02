/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  gastrointestinalLossesAuthored: true as const, reducedIntakeAuthored: true as const,
  clinicalDehydrationAuthored: true as const, compensatedHypovolemiaAuthored: true as const,
  shockAuthored: false as const, bleedingAuthored: false as const,
  sepsisAuthored: false as const, diabeticKetoacidosisAuthored: false as const,
  patientExaminedByLearner: false as const, patientWeighedByLearner: false as const,
  dehydrationPercentageCalculatedByLearner: false as const,
  fluidDeficitCalculatedByLearner: false as const,
  maintenanceCalculatedByLearner: false as const,
  testAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, glucoseSelectedByLearner: false as const,
  electrolyteSelectedByLearner: false as const, drugSelectedByLearner: false as const,
  routeSelectedByLearner: false as const, accessPlacedByLearner: false as const,
  fluidSelectedByLearner: false as const, fluidVolumeSelectedByLearner: false as const,
  fluidRateSelectedByLearner: false as const, fluidDeliveredByLearner: false as const,
  feedingPlanSelectedByLearner: false as const, oxygenSelectedByLearner: false as const,
  deviceSelectedByLearner: false as const, airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  treatmentEffectProven: false as const, durableRecoveryProven: false as const,
  dischargeReadinessProven: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, rehydrationAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedRehydrationOwnershipActive: over.rehydrationAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricDehydrationAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const REHYDRATION_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rehydrationAtTick: 2 });
const SAFETY_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rehydrationAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rehydrationAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rehydrationAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, REHYDRATION_ONLY, SAFETY_ONLY, BOTH, LATER, DONE];

const LABELS = ['Review losses + whole child', 'Recognize dehydration + hypovolemia',
  'Activate qualified rehydration', 'Review losses + safety',
  'Review the 60-minute report', 'Hand off active rehydration risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricDehydrationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricDehydrationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 84, respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricDehydrationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricDehydrationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric dehydration experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-dehydration-with-hypovolemia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-dehydration-with-hypovolemia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricDehydrationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-dehydration-with-hypovolemia-reassessment'),
    }).hasPediatricDehydrationResponse).toBe(false);
  });

  it('offers both halves of the unordered pair at once, and one action elsewhere', () => {
    expect(lessonButtons(markup(RECOGNIZED))).toHaveLength(2);
    expect(markup(RECOGNIZED)).toContain('Activate qualified rehydration');
    expect(markup(RECOGNIZED)).toContain('Review losses + safety');
    for (const state of [EMPTY, TRAJECTORY, REHYDRATION_ONLY, SAFETY_ONLY, BOTH, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(REHYDRATION_ONLY)).toContain('Review losses + safety');
    expect(markup(SAFETY_ONLY)).toContain('Activate qualified rehydration');
    expect(markup(BOTH)).toContain('Review the 60-minute report');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a percentage, a solution, a rate, an access, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read losses through the whole child.');
    expect(markup(LATER)).toContain('Some signs improved. Completion is not established.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|weigh|percent|deficit|maintenance|bolus|mL\/kg|cannula|intravenous|nasogastric|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric dehydration tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricDehydrationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricDehydrationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Resist turning them into a percentage');
    const recognition = markup(TRAJECTORY, { pediatricDehydrationGuidance: 'guided' });
    expect(recognition).toContain('say plainly that this is not shock');
    expect(recognition).not.toContain('Resist turning them into a percentage');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(RECOGNIZED, { pediatricDehydrationGuidance: 'guided' });
    expect(neither).toContain('the watch for being wrong');
    const fluidMissing = markup(SAFETY_ONLY, { pediatricDehydrationGuidance: 'guided' });
    expect(fluidMissing).toContain('Nobody owns the fluid yet');
    expect(fluidMissing).not.toContain('the watch for being wrong');
    const watchMissing = markup(REHYDRATION_ONLY, { pediatricDehydrationGuidance: 'guided' });
    expect(watchMissing).toContain('Oral rehydration is the plan, not a guarantee');
    expect(watchMissing).not.toContain('Nobody owns the fluid yet');
  });

  it('names what improved and then what was never supplied', () => {
    const html = markup(BOTH, { pediatricDehydrationGuidance: 'guided' });
    expect(html).toContain('reassess before you reassure');
    expect(html).toContain('Partial improvement is the honest description');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricDehydrationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricDehydrationGuidance: 'guided', pediatricDehydrationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
