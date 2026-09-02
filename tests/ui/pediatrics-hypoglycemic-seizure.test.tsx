/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  seizureAuthored: true as const, hypoglycemiaAuthored: true as const,
  initialGlucoseMgPerDl: 34 as const, laterGlucoseMgPerDl: 86 as const,
  patientExaminedByLearner: false as const, glucoseAcquiredByLearner: false as const,
  glucoseInterpretedByLearner: false as const, diagnosisMadeByLearner: false as const,
  drugSelectedByLearner: false as const, glucoseFormulationSelectedByLearner: false as const,
  doseSelectedByLearner: false as const, concentrationSelectedByLearner: false as const,
  routeSelectedByLearner: false as const, volumeSelectedByLearner: false as const,
  rateSelectedByLearner: false as const, accessPlacedByLearner: false as const,
  deviceSelectedByLearner: false as const, drugDeliveredByLearner: false as const,
  glucoseDeliveredByLearner: false as const, airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  treatmentEffectProven: false as const, seizureCauseProven: false as const,
  durableEuglycemiaProven: false as const, neurologicRecoveryProven: false as const,
  recurrenceExcluded: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, rescueAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedRescueOwnershipActive: over.rescueAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricHypoglycemicSeizureAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const RESCUE_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2 });
const SAFETY_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, RESCUE_ONLY, SAFETY_ONLY, BOTH, LATER, DONE];

const LABELS = ['Review seizure + fixed glucose', 'Recognize hypoglycemic emergency',
  'Activate qualified glucose rescue', 'Review recovery + cause risks',
  'Review the 20-minute report', 'Hand off recurrence + cause risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricHypoglycemicSeizureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricHypoglycemicSeizureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 126, respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricHypoglycemicSeizureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricHypoglycemicSeizureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric hypoglycemic-seizure experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-hypoglycemic-seizure"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-hypoglycemic-seizure' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricHypoglycemicSeizureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-hypoglycemic-seizure-reassessment'),
    }).hasPediatricHypoglycemicSeizureResponse).toBe(false);
  });

  it('offers both halves of the unordered pair at once, and one action elsewhere', () => {
    expect(lessonButtons(markup(RECOGNIZED))).toHaveLength(2);
    expect(markup(RECOGNIZED)).toContain('Activate qualified glucose rescue');
    expect(markup(RECOGNIZED)).toContain('Review recovery + cause risks');
    for (const state of [EMPTY, TRAJECTORY, RESCUE_ONLY, SAFETY_ONLY, BOTH, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(RESCUE_ONLY)).toContain('Review recovery + cause risks');
    expect(markup(SAFETY_ONLY)).toContain('Activate qualified glucose rescue');
    expect(markup(BOTH)).toContain('Review the 20-minute report');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a formulation, a dose, a route, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read the seizure and the child.');
    expect(markup(BOTH)).toContain('Recovery needs another check.');
    expect(markup(EMPTY)).toContain('Give nothing by mouth while consciousness is impaired.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|dextrose|glucagon|juice|mL\/kg|dose|infusion|cannula|intraosseous|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric hypoglycemic-seizure tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricHypoglycemicSeizureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the rescue is not a cup of juice');
    const recognition = markup(TRAJECTORY, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(recognition).toContain('keep the cause open while you do');
    expect(recognition).not.toContain('the rescue is not a cup of juice');
  });

  it('holds the urgency and the open cause true at the same time', () => {
    const html = markup(TRAJECTORY, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(html).toContain('The rescue cannot wait for a cause');
    expect(html).toContain('the association is not the cause');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(RECOGNIZED, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(neither).toContain('the sugar, and the question of why');
    const rescueMissing = markup(SAFETY_ONLY, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(rescueMissing).toContain('His glucose is still 34');
    expect(rescueMissing).not.toContain('the sugar, and the question of why');
    const causeMissing = markup(RESCUE_ONLY, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(causeMissing).toContain('why a well child ran out of sugar');
    expect(causeMissing).not.toContain('His glucose is still 34');
  });

  it('is precise about what a glucose of 86 earned', () => {
    const html = markup(BOTH, { pediatricHypoglycemicSeizureGuidance: 'guided' });
    expect(html).toContain('check the child rather than the meter');
    expect(html).toContain('He is better. Nothing is explained.');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricHypoglycemicSeizureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricHypoglycemicSeizureGuidance: 'guided', pediatricHypoglycemicSeizureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
