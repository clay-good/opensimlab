/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_STATUS_ASTHMATICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  asthmaHistoryAuthored: true as const, treatmentRecordAuthored: true as const,
  persistentSevereNonresponseAuthored: true as const,
  quietChestAuthored: false as const, respiratoryFailureAuthored: false as const,
  anaphylaxisPatternAuthored: false as const, upperAirwayPatternAuthored: false as const,
  foreignBodyPatternAuthored: false as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  pefMeasuredByLearner: false as const, scoreCalculatedByLearner: false as const,
  diagnosisMadeByLearner: false as const, testAcquiredByLearner: false as const,
  imagingAcquiredByLearner: false as const, drugSelectedByLearner: false as const,
  doseSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const,
  oxygenSelectedByLearner: false as const, deviceSelectedByLearner: false as const,
  flowSelectedByLearner: false as const, nebulizerOperatedByLearner: false as const,
  ivAccessPlacedByLearner: false as const, infusionOperatedByLearner: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, nonresponseAtTick: null, escalationAtTick: null,
  secondLineIntentAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null,
  experiencedSecondLineCareAuthored: over.secondLineIntentAtTick != null,
  partialResponseAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricStatusAsthmaticusAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const AFTER_PEF = base({ trajectoryAtTick: 0, lastUnsupportedChoice: 'force-peak-flow' });
const AFTER_XRAY = base({ trajectoryAtTick: 0, lastUnsupportedChoice: 'radiograph-delay' });
const ESCALATED = base({ trajectoryAtTick: 0, nonresponseAtTick: 1, escalationAtTick: 2 });
const AFTER_TRIGGER = base({ trajectoryAtTick: 0, nonresponseAtTick: 1, escalationAtTick: 2, lastUnsupportedChoice: 'trigger-review-delay' });
const LATER = base({ trajectoryAtTick: 0, nonresponseAtTick: 1, escalationAtTick: 2, secondLineIntentAtTick: 3, laterResponseAtTick: 4 });
const AFTER_DISCHARGE = base({ trajectoryAtTick: 0, nonresponseAtTick: 1, escalationAtTick: 2, secondLineIntentAtTick: 3, laterResponseAtTick: 4, lastUnsupportedChoice: 'saturation-discharge' });
const DONE = base({ trajectoryAtTick: 0, nonresponseAtTick: 1, escalationAtTick: 2, secondLineIntentAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, AFTER_PEF, AFTER_XRAY, ESCALATED, AFTER_TRIGGER, LATER, AFTER_DISCHARGE, DONE];

const LABELS = ['Review trajectory + prior care', 'Recognize severe nonresponse',
  'Activate pediatric critical-care help', 'Record qualified care + monitoring',
  'Review the later response', 'Hand off active severe asthma'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricStatusAsthmaticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricStatusAsthmaticusAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 220, respiratoryRateBpm: 40, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricStatusAsthmaticusResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricStatusAsthmaticusAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric status-asthmaticus experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-status-asthmaticus"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-status-asthmaticus' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricStatusAsthmaticusResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-status-asthmaticus-reassessment'),
    }).hasPediatricStatusAsthmaticusResponse).toBe(false);
  });

  it('shows one clear current action and never a competing wrong one', () => {
    // This tray is deliberately authored differently from croup and
    // bronchiolitis, which put their refusable choices on screen beside the
    // correct one. Here the engine still refuses four choices and the tray
    // still explains each when it happens, but a learner is shown a single
    // next action — a design tests/ui/pediatric-status-asthmaticus.test.tsx
    // pins, including that no button may read as a treatment or a discharge.
    for (const state of [EMPTY, TRAJECTORY, ESCALATED, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(TRAJECTORY)).toContain('Recognize severe nonresponse');
    expect(markup(ESCALATED)).toContain('Record qualified care + monitoring');
    expect(markup(LATER)).toContain('Hand off active severe asthma');
  });

  it('says what happened after each of the four refusals', () => {
    expect(markup(AFTER_PEF)).toContain('Use the whole child when peak flow is not feasible');
    expect(markup(AFTER_XRAY)).toContain('Routine imaging does not delay severe-asthma care');
    expect(markup(AFTER_TRIGGER)).toContain('Review causes in parallel with qualified care');
    expect(markup(AFTER_DISCHARGE)).toContain('A better saturation is not discharge readiness');
  });

  it('never offers a drug, a dose, an access, an intubation, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Read the whole child.');
    expect(markup(DONE)).toContain('Improvement must hold.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|magnesium|aminophylline|salbutamol|albuterol|epinephrine|mg\/kg|dose|infusion|cannula|intubat|ventilat|sedat|paralys|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Status-asthmaticus tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricStatusAsthmaticusGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricStatusAsthmaticusGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Start from what it did not fix');
    const nonresponse = markup(TRAJECTORY, { pediatricStatusAsthmaticusGuidance: 'guided' });
    expect(nonresponse).toContain('Say plainly that first-line treatment has not worked');
    expect(nonresponse).not.toContain('Start from what it did not fix');
  });

  it('answers the two measurement delays differently', () => {
    const pef = markup(AFTER_PEF, { pediatricStatusAsthmaticusGuidance: 'guided' });
    expect(pef).toContain('She cannot do it, and making her try costs her breath');
    expect(pef).not.toContain('answers a question you are not currently asking');
    const xray = markup(AFTER_XRAY, { pediatricStatusAsthmaticusGuidance: 'guided' });
    expect(xray).toContain('answers a question you are not currently asking');
    expect(xray).not.toContain('She cannot do it');
  });

  it('answers the trigger review without dismissing the questions', () => {
    const html = markup(AFTER_TRIGGER, { pediatricStatusAsthmaticusGuidance: 'guided' });
    expect(html).toContain('Those questions matter');
    expect(html).toContain('a sequencing judgment rather than a dismissal');
  });

  it('answers the discharge with what the saturation cannot tell you', () => {
    const html = markup(AFTER_DISCHARGE, { pediatricStatusAsthmaticusGuidance: 'guided' });
    expect(html).toContain('not a child ready to leave');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricStatusAsthmaticusGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricStatusAsthmaticusGuidance: 'guided', pediatricStatusAsthmaticusDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
