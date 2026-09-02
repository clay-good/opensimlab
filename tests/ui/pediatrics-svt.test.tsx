/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-supraventricular-tachycardia';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  abruptRegularNarrowTachycardiaAuthored: true as const,
  probableSvtPatternAuthored: true as const, perfusionCompromiseAuthored: true as const,
  patientExaminedByLearner: false as const, monitoringAcquiredByLearner: false as const,
  ecgAcquiredByLearner: false as const, ecgInterpretedByLearner: false as const,
  testAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, mechanismAssignedByLearner: false as const,
  maneuverPerformedByLearner: false as const, accessPlacedByLearner: false as const,
  modalitySelectedByLearner: false as const, drugSelectedByLearner: false as const,
  adenosineSelectedByLearner: false as const, productSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  routeSelectedByLearner: false as const, volumeSelectedByLearner: false as const,
  rateSelectedByLearner: false as const, deviceSelectedByLearner: false as const,
  energySelectedByLearner: false as const, sedationSelectedByLearner: false as const,
  oxygenDeliveredByLearner: false as const, drugDeliveredByLearner: false as const,
  cardioversionPerformedByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  svtFinallyProven: false as const, sinusTachycardiaExcluded: false as const,
  mechanismProven: false as const, causeProven: false as const,
  treatmentEffectProven: false as const, durableConversionProven: false as const,
  durableRecoveryProven: false as const, heartFailureExcluded: false as const,
  deteriorationExcluded: false as const, recurrenceExcluded: false as const,
  dischargeReadinessProven: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, careAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedRhythmCareOwnershipActive: over.careAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  laterSinusRhythmAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricSupraventricularTachycardiaAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const OWNED = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2 });
const REVIEWED = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, OWNED, REVIEWED, LATER, DONE];

const LABELS = ['Review rhythm + whole-child trajectory', 'Recognize SVT with perfusion risk',
  'Activate qualified pediatric SVT care', 'Review support + deterioration risks',
  'Review the minute-12 response', 'Hand off recurrence + cardiology risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricSupraventricularTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricSupraventricularTachycardiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricSupraventricularTachycardiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricSupraventricularTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric SVT experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-supraventricular-tachycardia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-supraventricular-tachycardia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricSupraventricularTachycardiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-supraventricular-tachycardia-reassessment'),
    }).hasPediatricSupraventricularTachycardiaResponse).toBe(false);
  });

  it('shows one clear current action at every recorded step', () => {
    for (const state of STATES.slice(0, -1)) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(RECOGNIZED)).toContain('Activate qualified pediatric SVT care');
    expect(markup(OWNED)).toContain('Review support + deterioration risks');
    expect(markup(REVIEWED)).toContain('Review the minute-12 response');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a maneuver, a drug, an energy, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read the rhythm through the child.');
    expect(markup(REVIEWED)).toContain('Conversion is a checkpoint.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|adenosine|vagal|ice|valsalva|cardiovert|joule|J\/kg|mg\/kg|dose|sedat|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric SVT tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricSvtGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricSvtGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('start the clock at forty-five minutes');
    const recognition = markup(TRAJECTORY, { pediatricSvtGuidance: 'guided' });
    expect(recognition).toContain('not the same as adequate perfusion');
    expect(recognition).not.toContain('start the clock at forty-five minutes');
  });

  it('names the reassuring number as the trap', () => {
    const html = markup(TRAJECTORY, { pediatricSvtGuidance: 'guided' });
    expect(html).toContain('right up until they stop');
  });

  it('argues the ordering it is enforced by', () => {
    const html = markup(RECOGNIZED, { pediatricSvtGuidance: 'guided' });
    expect(html).toContain('before you review anything else');
    expect(html).toContain('not a thing to think about for another ten');
  });

  it('raises pre-excitation once the rhythm is owned', () => {
    const html = markup(OWNED, { pediatricSvtGuidance: 'guided' });
    expect(html).toContain('Pre-excitation matters here because it changes what is safe');
  });

  it('refuses to credit the conversion to anybody in the room', () => {
    const html = markup(REVIEWED, { pediatricSvtGuidance: 'guided' });
    expect(html).toContain('you delivered none');
    expect(html).toContain('where the cardiology question starts, not where it stops');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricSvtGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricSvtGuidance: 'guided', pediatricSvtDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
