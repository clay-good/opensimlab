/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_FEBRILE_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-febrile-seizure';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  stoppedSeizureAuthored: true as const, feverAuthored: true as const,
  statusEpilepticusAuthored: false as const,
  patientExaminedByLearner: false as const, temperatureAcquiredByLearner: false as const,
  testAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, classificationMadeByLearner: false as const,
  lumbarPuncturePerformedByLearner: false as const, eegAcquiredByLearner: false as const,
  imagingAcquiredByLearner: false as const, drugSelectedByLearner: false as const,
  antipyreticSelectedByLearner: false as const, anticonvulsantSelectedByLearner: false as const,
  antimicrobialSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  volumeSelectedByLearner: false as const, rateSelectedByLearner: false as const,
  accessPlacedByLearner: false as const, deviceSelectedByLearner: false as const,
  drugDeliveredByLearner: false as const, airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  simpleFebrileSeizureFinallyProven: false as const, benignCourseProven: false as const,
  seizureCauseProven: false as const, cnsInfectionExcluded: false as const,
  seriousInfectionExcluded: false as const, treatmentEffectProven: false as const,
  durableRecoveryProven: false as const, recurrenceExcluded: false as const,
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
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricFebrileSeizureAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const CARE_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2 });
const SAFETY_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, safetyAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, careAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, CARE_ONLY, SAFETY_ONLY, BOTH, LATER, DONE];

const LABELS = ['Review seizure + whole-child recovery', 'Recognize the febrile-seizure pattern',
  'Confirm qualified observation', 'Review red flags + recurrence',
  'Review the 30-minute report', 'Hand off safety + caregiver guidance'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricFebrileSeizureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricFebrileSeizureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 84, respiratoryRateBpm: 30, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricFebrileSeizureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricFebrileSeizureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric febrile-seizure experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-febrile-seizure"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-febrile-seizure' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricFebrileSeizureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-febrile-seizure-reassessment'),
    }).hasPediatricFebrileSeizureResponse).toBe(false);
  });

  it('offers both halves of the unordered pair at once, and one action elsewhere', () => {
    expect(lessonButtons(markup(RECOGNIZED))).toHaveLength(2);
    expect(markup(RECOGNIZED)).toContain('Confirm qualified observation');
    expect(markup(RECOGNIZED)).toContain('Review red flags + recurrence');
    for (const state of [EMPTY, TRAJECTORY, CARE_ONLY, SAFETY_ONLY, BOTH, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(CARE_ONLY)).toContain('Review red flags + recurrence');
    expect(markup(SAFETY_ONLY)).toContain('Confirm qualified observation');
    expect(markup(BOTH)).toContain('Review the 30-minute report');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a test, an antipyretic, a puncture, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read the event, then the child.');
    expect(markup(BOTH)).toContain('Reassurance needs boundaries.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|lumbar|puncture|EEG|imaging|paracetamol|ibuprofen|antipyretic|midazolam|dose|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric febrile-seizure tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricFebrileSeizureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('that absence is deliberate rather than an oversight');
    const recognition = markup(TRAJECTORY, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(recognition).toContain('Say the careful version: simple features to date');
    expect(recognition).not.toContain('that absence is deliberate rather than an oversight');
  });

  it('refuses the over-reaction and the under-reaction on the same beat', () => {
    const html = markup(TRAJECTORY, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(html).toContain('what makes an aggressive workup the wrong reflex here');
    expect(html).toContain('is not a formality');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(RECOGNIZED, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(neither).toContain('looking after him, and keeping looking');
    const careMissing = markup(SAFETY_ONLY, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(careMissing).toContain('Nobody is looking after him');
    expect(careMissing).not.toContain('looking after him, and keeping looking');
    const watchMissing = markup(CARE_ONLY, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(watchMissing).toContain('keep the dangerous things open');
    expect(watchMissing).not.toContain('Nobody is looking after him');
  });

  it('bounds the reassuring half-hour rather than banking it', () => {
    const html = markup(BOTH, { pediatricFebrileSeizureGuidance: 'guided' });
    expect(html).toContain('check him again rather than concluding');
    expect(html).toContain('Reassurance with boundaries is more useful to this family');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricFebrileSeizureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricFebrileSeizureGuidance: 'guided', pediatricFebrileSeizureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
