/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION as SCENARIO } from '../../src/modules/cardiology/scenarios/post-infarction-cardiogenic-shock-escalation';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  pressureAloneUsed: false as const,
  routineDeviceSelected: false as const,
  treatmentDelivered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, causesAtTick: null, transferAtTick: null,
  bridgeAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['postInfarctionShockAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const CAUSES_ONLY = base({ trajectoryAtTick: 0, causesAtTick: 1 });
const TRANSFER_ONLY = base({ trajectoryAtTick: 0, transferAtTick: 1 });
const BOTH = base({ trajectoryAtTick: 0, causesAtTick: 1, transferAtTick: 2 });
const BRIDGE = base({ trajectoryAtTick: 0, causesAtTick: 1, transferAtTick: 2, bridgeAtTick: 3 });
const DONE = base({ trajectoryAtTick: 0, causesAtTick: 1, transferAtTick: 2, bridgeAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, TRAJECTORY, CAUSES_ONLY, TRANSFER_ONLY, BOTH, BRIDGE, DONE];

const LABELS = ['Reconcile failure to improve', 'Reopen causes + reported care',
  'Contact local + regional shock teams', 'Record individualized potential-transport bridge',
  'Reassess + hand off unresolved work'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postInfarctionShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, postInfarctionShockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 26, fio2: 0.4, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPostInfarctionShockResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postInfarctionShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Post-infarction cardiogenic shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/post-infarction-cardiogenic-shock-escalation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/post-infarction-cardiogenic-shock-escalation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPostInfarctionShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'post-infarction-cardiogenic-shock-escalation'),
    }).hasPostInfarctionShockResponse).toBe(false);
  });

  it('keeps all five steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('never offers a device, an agent, a MAP target, or a destination', () => {
    expect(markup(EMPTY)).toContain('Pressure moved. Perfusion did not.');
    expect(markup(BOTH)).toContain('Build the bridge. Keep the exit open.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/impella|balloon pump|ECMO|norepinephrine|dobutamine|MAP of|mcg|transfer to|diagnos|prognos/iu);
    }
  });
});

describe('Post-infarction shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { postInfarctionShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { postInfarctionShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('A MAP is a pressure, not a flow');
    const parallel = markup(TRAJECTORY, { postInfarctionShockGuidance: 'guided' });
    expect(parallel).toContain('phone people who can do more than you can');
    expect(parallel).not.toContain('A MAP is a pressure, not a flow');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(TRAJECTORY, { postInfarctionShockGuidance: 'guided' });
    expect(neither).toContain('phone people who can do more than you can');
    const causesMissing = markup(TRANSFER_ONLY, { postInfarctionShockGuidance: 'guided' });
    expect(causesMissing).toContain('The call is made');
    expect(causesMissing).not.toContain('phone people who can do more than you can');
    const callMissing = markup(CAUSES_ONLY, { postInfarctionShockGuidance: 'guided' });
    expect(callMissing).toContain('still in a hospital that cannot do this');
    expect(callMissing).not.toContain('The call is made');
  });

  it('refuses the pull toward a device', () => {
    const html = markup(BOTH, { postInfarctionShockGuidance: 'guided' });
    expect(html).toContain('no device is selected');
    expect(html).toContain('about whether, for whom, and by whom');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { postInfarctionShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { postInfarctionShockGuidance: 'guided', postInfarctionShockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
