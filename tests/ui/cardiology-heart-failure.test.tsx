/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_DECOMPENSATED_HEART_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/acute-decompensated-heart-failure';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  residualCongestion: true as const,
  dischargeReady: false as const,
  doseCalculated: false as const,
  treatmentDelivered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  statusAtTick: null, responseAtTick: null, toleranceAtTick: null,
  transitionAtTick: null, readinessAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['heartFailureAssessment']>);

const EMPTY = base({});
const STATUS = base({ statusAtTick: 0 });
const RESPONSE = base({ statusAtTick: 0, responseAtTick: 1 });
const TOLERANCE = base({ statusAtTick: 0, responseAtTick: 1, toleranceAtTick: 2 });
const TRANSITION = base({ statusAtTick: 0, responseAtTick: 1, toleranceAtTick: 2, transitionAtTick: 3 });
const DONE = base({ statusAtTick: 0, responseAtTick: 1, toleranceAtTick: 2, transitionAtTick: 3, readinessAtTick: 4 });
const STATES = [EMPTY, STATUS, RESPONSE, TOLERANCE, TRANSITION, DONE];

const LABELS = ['Reconcile congestion + perfusion', 'Review serial decongestion response',
  'Review tolerance + precipitant', 'Record decongestion + transition intent',
  'Reassess readiness + ownership'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['heartFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, heartFailureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHeartFailureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['heartFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Decompensated heart-failure experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/acute-decompensated-heart-failure"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/acute-decompensated-heart-failure' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHeartFailureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-decompensated-heart-failure'),
    }).hasHeartFailureResponse).toBe(false);
  });

  it('keeps all five steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('never offers a dose, a dry weight, a regimen, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Decongestion is a trajectory.');
    expect(markup(TOLERANCE)).toContain('Warm is not the same as ready.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|furosemide|mg\b|dry weight|sacubitril|discharge|diagnos|prognos/iu);
    }
  });
});

describe('Heart-failure tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { heartFailureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { heartFailureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Is he wet, and is he cold?');
    const response = markup(STATUS, { heartFailureGuidance: 'guided' });
    expect(response).toContain('notice which one is lying to you');
    expect(response).not.toContain('Is he wet, and is he cold?');
  });

  it('puts the weight against a real baseline', () => {
    const html = markup(STATUS, { heartFailureGuidance: 'guided' });
    expect(html).toContain('still 3.8 kg above his own baseline');
  });

  it('reads the creatinine rise carefully', () => {
    const html = markup(RESPONSE, { heartFailureGuidance: 'guided' });
    expect(html).toContain('is not automatically kidney injury');
  });

  it('says plainly he is not ready to go', () => {
    const html = markup(TRANSITION, { heartFailureGuidance: 'guided' });
    expect(html).toContain('the single best predictor of coming straight back');
  });

  it('goes quiet once the readiness reassessment is recorded', () => {
    expect(markup(DONE, { heartFailureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { heartFailureGuidance: 'guided', heartFailureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
