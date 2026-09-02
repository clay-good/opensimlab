/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  initialOngoingConvulsionAuthored: true as const, statusThresholdAuthored: true as const,
  firstLineCareAuthored: true as const,
  patientExaminedByLearner: false as const, seizureTimedByLearner: false as const,
  monitoringAcquiredByLearner: false as const, glucoseAcquiredByLearner: false as const,
  glucoseInterpretedByLearner: false as const, testAcquiredByLearner: false as const,
  testInterpretedByLearner: false as const, diagnosisMadeByLearner: false as const,
  drugSelectedByLearner: false as const, benzodiazepineSelectedByLearner: false as const,
  antiseizureDrugSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  volumeSelectedByLearner: false as const, rateSelectedByLearner: false as const,
  accessPlacedByLearner: false as const, deviceSelectedByLearner: false as const,
  drugDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  seizureCauseProven: false as const, treatmentEffectProven: false as const,
  electrographicSeizureControlProven: false as const,
  durableSeizureControlProven: false as const, neurologicRecoveryProven: false as const,
  recurrenceExcluded: false as const, dischargeReadinessProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, secondLineAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedSecondLineOwnershipActive: over.secondLineAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricStatusEpilepticusAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const DRUG_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, secondLineAtTick: 2 });
const SAFETY_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, recognitionAtTick: 1, secondLineAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, secondLineAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, secondLineAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, DRUG_ONLY, SAFETY_ONLY, BOTH, LATER, DONE];

const LABELS = ['Review clock + first-line care', 'Recognize ongoing convulsive status',
  'Activate qualified second-line ownership', 'Review airway + causes + boundaries',
  'Review the minute-25 response', 'Hand off active status risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricStatusEpilepticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricStatusEpilepticusAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricStatusEpilepticusResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricStatusEpilepticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric status-epilepticus experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-status-epilepticus"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-status-epilepticus' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricStatusEpilepticusResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-status-epilepticus-reassessment'),
    }).hasPediatricStatusEpilepticusResponse).toBe(false);
  });

  it('offers both halves of the unordered pair at once, and one action elsewhere', () => {
    expect(lessonButtons(markup(RECOGNIZED))).toHaveLength(2);
    expect(markup(RECOGNIZED)).toContain('Activate qualified second-line ownership');
    expect(markup(RECOGNIZED)).toContain('Review airway + causes + boundaries');
    for (const state of [EMPTY, TRAJECTORY, DRUG_ONLY, SAFETY_ONLY, BOTH, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(DRUG_ONLY)).toContain('Review airway + causes + boundaries');
    expect(markup(SAFETY_ONLY)).toContain('Activate qualified second-line ownership');
    expect(markup(BOTH)).toContain('Review the minute-25 response');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers an agent, a dose, an intubation, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read the clock and the child.');
    expect(markup(BOTH)).toContain('Persistence changes the plan.');
    expect(markup(LATER)).toContain('Stopped visible movements do not prove electrographic seizure control');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|midazolam|lorazepam|levetiracetam|phenytoin|valproate|mg\/kg|dose|intubat|cannula|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric status-epilepticus tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricStatusEpilepticusGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the clock is what decides the next drug');
    const recognition = markup(TRAJECTORY, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(recognition).toContain('it changes the drug class');
    expect(recognition).not.toContain('the clock is what decides the next drug');
  });

  it('stops the third benzodiazepine by name', () => {
    const html = markup(TRAJECTORY, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(html).toContain('reaching for a third benzodiazepine');
    expect(html).toContain('More of the same is not the next step');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(RECOGNIZED, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(neither).toContain('do not queue behind each other');
    const drugMissing = markup(SAFETY_ONLY, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(drugMissing).toContain('She is still convulsing');
    expect(drugMissing).not.toContain('do not queue behind each other');
    const airwayMissing = markup(DRUG_ONLY, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(airwayMissing).toContain('hold the airway, the causes, and the refractory line');
    expect(airwayMissing).not.toContain('She is still convulsing');
  });

  it('is careful about what stillness means', () => {
    const html = markup(BOTH, { pediatricStatusEpilepticusGuidance: 'guided' });
    expect(html).toContain('be careful about what stillness means');
    expect(html).toContain('the most over-read finding in this lesson');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricStatusEpilepticusGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricStatusEpilepticusGuidance: 'guided', pediatricStatusEpilepticusDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
