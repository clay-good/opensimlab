/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNDIFFERENTIATED_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/undifferentiated-shock';

type Assessment = NonNullable<ActionCockpitProps['resuscitation']['undifferentiatedShockAssessment']>;

const base = (over: Partial<Assessment>) => ({
  perfusionReviewedAtTick: null, lactateReviewedAtTick: null, focusedEchoReviewedAtTick: null,
  passiveLegRaiseAtTick: null, fluidChallengeAtTick: null, perfusionReassessedAtTick: null,
  escalationAtTick: null, ...over,
} as Assessment);

const EMPTY = base({});
const PERFUSION = base({ perfusionReviewedAtTick: 1 });
// The pair taken the other way round: the tray must open the same next step.
const LACTATE_FIRST = base({ lactateReviewedAtTick: 1 });
const PAIR = base({ perfusionReviewedAtTick: 1, lactateReviewedAtTick: 2 });
const ECHO = base({ ...PAIR, focusedEchoReviewedAtTick: 3 });
const PLR = base({ ...ECHO, passiveLegRaiseAtTick: 4 });
const FLUID = base({ ...PLR, fluidChallengeAtTick: 5 });
const REASSESSED = base({ ...FLUID, perfusionReassessedAtTick: 6 });
const DONE = base({ ...REASSESSED, escalationAtTick: 7 });
const STATES = [EMPTY, PERFUSION, LACTATE_FIRST, PAIR, ECHO, PLR, FLUID, REASSESSED, DONE];

const LABELS = ['Review tissue perfusion', 'Review fixed lactate', 'Review focused cardiac findings',
  'Review passive-leg-raise response', 'Give bounded 500 mL challenge', 'Reassess tissue perfusion',
  'Escalate ongoing shock workup'];

const props = (assessment: Assessment, extra: Partial<ActionCockpitProps> = {}): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, undifferentiatedShockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onUndifferentiatedShockAssessment: () => {}, ...extra,
});

const markup = (assessment: Assessment, extra: Partial<ActionCockpitProps> = {}) =>
  renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openLabels = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0]))
  .map((match) => match[1]!);

describe('Emergency undifferentiated shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/undifferentiated-shock"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/undifferentiated-shock' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasUndifferentiatedShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'shock-pattern'),
    }).hasUndifferentiatedShockResponse).toBe(false);
  });

  it('keeps all seven recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(7);
    }
  });

  it('opens the unordered pair together and then one step at a time', () => {
    expect(openLabels(markup(EMPTY))).toHaveLength(2);
    expect(openLabels(markup(PERFUSION))).toEqual(['Review fixed lactate']);
    expect(openLabels(markup(LACTATE_FIRST))).toEqual(['Review tissue perfusion']);
    for (const state of [PAIR, ECHO, PLR, FLUID, REASSESSED]) {
      expect(openLabels(markup(state))).toHaveLength(1);
    }
    expect(openLabels(markup(DONE))).toHaveLength(0);
  });

  it('never offers a cause, a vasopressor, or a repeat', () => {
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/sepsis|septic|norepinephrine|vasopress|repeat|diagnos|outcome/iu);
    }
    expect(markup(EMPTY)).toContain('No liberal repeat-fluid shortcut is offered');
  });
});

describe('Emergency undifferentiated shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { undifferentiatedShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { undifferentiatedShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the three organs you can assess without a machine');
    const lactate = markup(PERFUSION, { undifferentiatedShockGuidance: 'guided' });
    expect(lactate).toContain('confirmation of a decision you can already make');
    expect(lactate).not.toContain('the three organs you can assess without a machine');
  });

  it('names whichever half of the pair is still missing', () => {
    expect(markup(LACTATE_FIRST, { undifferentiatedShockGuidance: 'guided' }))
      .toContain('the three organs you can assess without a machine');
  });

  it('gives the reversibility argument at the leg raise', () => {
    expect(markup(ECHO, { undifferentiatedShockGuidance: 'guided' }))
      .toContain('volume you have given cannot be taken back');
  });

  it('goes quiet once the escalation is recorded', () => {
    expect(markup(DONE, { undifferentiatedShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { undifferentiatedShockGuidance: 'guided', undifferentiatedShockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
