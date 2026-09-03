/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SPONTANEOUS_BREATHING_TRIAL as SCENARIO } from '../../src/modules/critical-care/scenarios/spontaneous-breathing-trial';

const base = (over: Record<string, unknown>) => ({
  readinessAtTick: null, startedAtTick: null, failureAtTick: null,
  recoveryAtTick: null, planAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['spontaneousBreathingTrialAssessment']>);

const EMPTY = base({});
const READY = base({ readinessAtTick: 0 });
const STARTED = base({ readinessAtTick: 0, startedAtTick: 1 });
const FAILED = base({ readinessAtTick: 0, startedAtTick: 1, failureAtTick: 2 });
const RECOVERED = base({ readinessAtTick: 0, startedAtTick: 1, failureAtTick: 2, recoveryAtTick: 3 });
const DONE = base({ readinessAtTick: 0, startedAtTick: 1, failureAtTick: 2, recoveryAtTick: 3, planAtTick: 4 });
const STATES = [EMPTY, READY, STARTED, FAILED, RECOVERED, DONE];

const LABELS = ['Review readiness without RSBI', 'Start SBT · keep FiO₂ unchanged',
  'Review 30-minute tolerance', 'Stop trial + restore prior support',
  'Review drivers + plan reassessment'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['spontaneousBreathingTrialAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, spontaneousBreathingTrialAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'pressure-control', tidalVolumeMl: 420, respiratoryRateBpm: 16, fio2: 0.35, peep: 5, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onSpontaneousBreathingTrialResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['spontaneousBreathingTrialAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Spontaneous breathing trial experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/spontaneous-breathing-trial"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/spontaneous-breathing-trial' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasSpontaneousBreathingTrialResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'spontaneous-breathing-trial'),
    }).hasSpontaneousBreathingTrialResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens exactly one step at a time, because the chain is the lesson', () => {
    const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0])).length;
    for (const state of [EMPTY, READY, STARTED, FAILED, RECOVERED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers an extubation, a ventilator setting, or a sedation dose', () => {
    expect(markup(EMPTY)).toContain('Earn the trial, not a number.');
    expect(markup(FAILED)).toContain('A trial can say “not yet.”');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/extubat|sedat|\bmcg\b|\bmg\b|diagnos|prognos/iu);
    }
  });
});

describe('Spontaneous breathing trial tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { spontaneousBreathingTrialGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { spontaneousBreathingTrialGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('delays extubation more often than it prevents one');
    const start = markup(READY, { spontaneousBreathingTrialGuidance: 'guided' });
    expect(start).toContain('raising it hides exactly the oxygenation change you are testing for');
    expect(start).not.toContain('delays extubation more often than it prevents one');
  });

  it('refuses single thresholds by taking the panel apart', () => {
    expect(markup(STARTED, { spontaneousBreathingTrialGuidance: 'guided' }))
      .toContain('That convergence is what makes this failure');
  });

  it('argues for stopping early rather than late', () => {
    expect(markup(FAILED, { spontaneousBreathingTrialGuidance: 'guided' }))
      .toContain('fatigue makes the next trial worse');
  });

  it('goes quiet once the plan is recorded', () => {
    expect(markup(DONE, { spontaneousBreathingTrialGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { spontaneousBreathingTrialGuidance: 'guided', spontaneousBreathingTrialDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
