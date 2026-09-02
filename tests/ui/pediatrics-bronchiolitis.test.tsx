/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { BRONCHIOLITIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/bronchiolitis';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  bronchiolitisWorkingPatternAuthored: true as const, hypoxemiaAuthored: true as const,
  poorIntakeAuthored: true as const, preservedPerfusionAuthored: true as const,
  currentApneaAuthored: false as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, testAcquiredByLearner: false as const,
  oxygenSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
  deviceSelectedByLearner: false as const, flowSelectedByLearner: false as const,
  fio2SelectedByLearner: false as const, oxygenTargetSelectedByLearner: false as const,
  feedingDeliveredByLearner: false as const, fluidRouteSelectedByLearner: false as const,
  fluidDeliveredByLearner: false as const, suctionPerformedByLearner: false as const,
  drugDeliveredByLearner: false as const, ventilationDeliveredByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  durableRecoveryProven: false as const, dischargeReadinessProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, patternAtTick: null, supportAtTick: null,
  feedingHydrationAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null,
  experiencedSupportActivated: over.supportAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['bronchiolitisAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const AFTER_XRAY = base({ recognitionAtTick: 0, lastUnsupportedChoice: 'radiograph-first' });
const AFTER_SAT = base({ recognitionAtTick: 0, lastUnsupportedChoice: 'single-saturation' });
const PATTERN = base({ recognitionAtTick: 0, patternAtTick: 1 });
const AFTER_ALBUTEROL = base({ recognitionAtTick: 0, patternAtTick: 1, lastUnsupportedChoice: 'routine-albuterol' });
const AFTER_ANTIBIOTIC = base({ recognitionAtTick: 0, patternAtTick: 1, lastUnsupportedChoice: 'routine-antibiotic' });
const FEEDING = base({ recognitionAtTick: 0, patternAtTick: 1, supportAtTick: 2, feedingHydrationAtTick: 3 });
const AFTER_DISCHARGE = base({ recognitionAtTick: 0, patternAtTick: 1, supportAtTick: 2, feedingHydrationAtTick: 3, lastUnsupportedChoice: 'discharge-on-saturation' });
const DONE = base({ recognitionAtTick: 0, patternAtTick: 1, supportAtTick: 2, feedingHydrationAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECOGNIZED, AFTER_XRAY, AFTER_SAT, PATTERN, AFTER_ALBUTEROL, AFTER_ANTIBIOTIC, FEEDING, AFTER_DISCHARGE, DONE];

const LABELS = ['Review the whole-infant trajectory', 'Record the supplied clinical pattern',
  'Wait for a routine chest X-ray', 'Watch the saturation alone',
  'Activate experienced supportive care', 'Try routine albuterol', 'Start routine antibiotics',
  'Review feeding and hydration', 'Review the one-hour response',
  'Discharge from saturation alone', 'Hand off active bronchiolitis risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['bronchiolitisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, bronchiolitisAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 70, respiratoryRateBpm: 58, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onBronchiolitisResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['bronchiolitisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric bronchiolitis experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/bronchiolitis"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/bronchiolitis' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasBronchiolitisResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'bronchiolitis-reassessment'),
    }).hasBronchiolitisResponse).toBe(false);
  });

  it('offers each set of choices only at the moment it belongs to', () => {
    const opening = markup(EMPTY);
    expect(opening).not.toContain('Try routine albuterol');
    expect(opening).not.toContain('Discharge from saturation alone');
    const recognized = markup(RECOGNIZED);
    expect(recognized).toContain('Record the supplied clinical pattern');
    expect(recognized).toContain('Wait for a routine chest X-ray');
    expect(recognized).toContain('Watch the saturation alone');
    const pattern = markup(PATTERN);
    expect(pattern).toContain('Activate experienced supportive care');
    expect(pattern).toContain('Try routine albuterol');
    expect(pattern).toContain('Start routine antibiotics');
    const feeding = markup(FEEDING);
    expect(feeding).toContain('Review the one-hour response');
    expect(feeding).toContain('Discharge from saturation alone');
  });

  it('says what happened after every one of the five refusals', () => {
    expect(markup(AFTER_XRAY)).toContain('does not wait for routine imaging');
    expect(markup(AFTER_SAT)).toContain('One saturation cannot summarize the infant');
    // These two previously fell through to a generic line rather than saying
    // what had happened, unlike the other three.
    expect(markup(AFTER_ALBUTEROL)).toContain('A first wheezing illness is not asthma');
    expect(markup(AFTER_ANTIBIOTIC)).toContain('coinfection stays open, untreated');
    expect(markup(AFTER_DISCHARGE)).toContain('does not prove discharge readiness');
  });

  it('never offers a dose, a route, a test, or a discharge decision as ordinary care', () => {
    expect(markup(EMPTY)).toContain('Read the whole infant.');
    expect(markup(DONE)).toContain('Keep every lane in view.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|interpret|mg\/kg|dose|nebuli[sz]|steroid|dexamethasone|suction|NG tube|IV fluid|admit|diagnose|prognos/iu);
    }
  });
});

describe('Bronchiolitis tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { bronchiolitisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { bronchiolitisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the feeding history with it');
    const pattern = markup(RECOGNIZED, { bronchiolitisGuidance: 'guided' });
    expect(pattern).toContain('supportive-care pattern it is');
    expect(pattern).not.toContain('the feeding history with it');
  });

  it('answers the two ways of avoiding the pattern differently', () => {
    const xray = markup(AFTER_XRAY, { bronchiolitisGuidance: 'guided' });
    expect(xray).toContain('A film will not change what he needs today');
    expect(xray).not.toContain('Watching the number is not the same');
    const sat = markup(AFTER_SAT, { bronchiolitisGuidance: 'guided' });
    expect(sat).toContain('Watching the number is not the same as watching the baby');
    expect(sat).not.toContain('A film will not change what he needs today');
  });

  it('answers the two treatments differently', () => {
    const alb = markup(AFTER_ALBUTEROL, { bronchiolitisGuidance: 'guided' });
    expect(alb).toContain('It is not asthma, and this is his first episode');
    expect(alb).not.toContain('not a bacterial focus');
    const abx = markup(AFTER_ANTIBIOTIC, { bronchiolitisGuidance: 'guided' });
    expect(abx).toContain('is not a bacterial focus');
    expect(abx).not.toContain('It is not asthma, and this is his first episode');
  });

  it('answers discharge on a number', () => {
    const html = markup(AFTER_DISCHARGE, { bronchiolitisGuidance: 'guided' });
    expect(html).toContain('not a baby who is ready to go home');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { bronchiolitisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { bronchiolitisGuidance: 'guided', bronchiolitisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
