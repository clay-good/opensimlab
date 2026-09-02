/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_ANAPHYLAXIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  plausibleExposureAuthored: true as const, multisystemCompromiseAuthored: true as const,
  firstLineCareAuthored: true as const,
  patientExaminedByLearner: false as const, exposureVerifiedByLearner: false as const,
  monitoringAcquiredByLearner: false as const, testAcquiredByLearner: false as const,
  testInterpretedByLearner: false as const, diagnosisMadeByLearner: false as const,
  classificationMadeByLearner: false as const, positioningPerformedByLearner: false as const,
  triggerRemovedByLearner: false as const, drugSelectedByLearner: false as const,
  epinephrineSelectedByLearner: false as const, productSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  routeSelectedByLearner: false as const, intervalSelectedByLearner: false as const,
  volumeSelectedByLearner: false as const, rateSelectedByLearner: false as const,
  accessPlacedByLearner: false as const, deviceSelectedByLearner: false as const,
  drugDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
  fluidDeliveredByLearner: false as const, airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  anaphylaxisFinallyProven: false as const, triggerConfirmed: false as const,
  treatmentEffectProven: false as const, airwayRiskResolved: false as const,
  shockResolved: false as const, refractoryAnaphylaxisExcluded: false as const,
  biphasicReactionExcluded: false as const, recurrenceExcluded: false as const,
  durableRecoveryProven: false as const, dischargeReadinessProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, firstLineAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedFirstLineOwnershipActive: over.firstLineAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricAnaphylaxisAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const DOSED = base({ trajectoryAtTick: 0, recognitionAtTick: 1, firstLineAtTick: 2 });
const REVIEWED = base({ trajectoryAtTick: 0, recognitionAtTick: 1, firstLineAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, firstLineAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, firstLineAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, DOSED, REVIEWED, LATER, DONE];

const LABELS = ['Review exposure + whole-child trajectory', 'Recognize persistent ABC compromise',
  'Activate qualified anaphylaxis rescue', 'Review airway + asthma + causes',
  'Review the minute-18 response', 'Hand off active anaphylaxis risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricAnaphylaxisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricAnaphylaxisAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 34, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricAnaphylaxisResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricAnaphylaxisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric anaphylaxis experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-anaphylaxis"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-anaphylaxis' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricAnaphylaxisResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-anaphylaxis-reassessment'),
    }).hasPediatricAnaphylaxisResponse).toBe(false);
  });

  it('shows one clear current action at every recorded step', () => {
    for (const state of STATES.slice(0, -1)) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(RECOGNIZED)).toContain('Activate qualified anaphylaxis rescue');
    expect(markup(DOSED)).toContain('Review airway + asthma + causes');
    expect(markup(REVIEWED)).toContain('Review the minute-18 response');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers an epinephrine dose, a device, or a discharge', () => {
    expect(markup(EMPTY)).toContain('See the whole allergic pattern.');
    expect(markup(REVIEWED)).toContain('Improvement needs watchfulness.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|epinephrine|adrenaline|autoinjector|1:1000|mg\/kg|dose|salbutamol|chlorphenamine|cannula|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric anaphylaxis tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricAnaphylaxisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricAnaphylaxisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('There are no hives');
    const recognition = markup(TRAJECTORY, { pediatricAnaphylaxisGuidance: 'guided' });
    expect(recognition).toContain('Sudden onset, more than one system, after a plausible exposure');
    expect(recognition).not.toContain('There are no hives');
  });

  it('treats the absent skin findings as a known presentation', () => {
    const html = markup(TRAJECTORY, { pediatricAnaphylaxisGuidance: 'guided' });
    expect(html).toContain('one of the reasons the diagnosis gets missed');
  });

  it('argues the ordering it is enforced by', () => {
    const html = markup(RECOGNIZED, { pediatricAnaphylaxisGuidance: 'guided' });
    expect(html).toContain('The second one does not wait for anything else');
    expect(html).toContain('the interval is the treatment');
  });

  it('names the asthma trap once the dose is owned', () => {
    const html = markup(DOSED, { pediatricAnaphylaxisGuidance: 'guided' });
    expect(html).toContain('invites the comfortable explanation');
  });

  it('treats improvement after epinephrine as the dangerous moment', () => {
    const html = markup(REVIEWED, { pediatricAnaphylaxisGuidance: 'guided' });
    expect(html).toContain('where this diagnosis is most dangerous');
    expect(html).toContain('does not exclude a biphasic reaction');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricAnaphylaxisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricAnaphylaxisGuidance: 'guided', pediatricAnaphylaxisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
