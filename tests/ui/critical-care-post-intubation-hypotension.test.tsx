/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { POST_INTUBATION_HYPOTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/post-intubation-hypotension';

const base = (over: Record<string, unknown>) => ({
  pressureAtTick: null, dangerAtTick: null, mechanismAtTick: null,
  supportAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['postIntubationHypotensionAssessment']>);

const EMPTY = base({});
const PRESSURE = base({ pressureAtTick: 0 });
const DANGER = base({ pressureAtTick: 0, dangerAtTick: 1 });
const MECHANISM = base({ pressureAtTick: 0, dangerAtTick: 1, mechanismAtTick: 2 });
const SUPPORT = base({ pressureAtTick: 0, dangerAtTick: 1, mechanismAtTick: 2, supportAtTick: 3 });
const DONE = base({ pressureAtTick: 0, dangerAtTick: 1, mechanismAtTick: 2, supportAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, PRESSURE, DANGER, MECHANISM, SUPPORT, DONE];

const LABELS = ['Validate pressure + call help', 'Check airway + lungs + rhythm + bleeding',
  'Review dynamic response + classify', 'Record concurrent bounded support',
  'Review 5-minute whole-patient response'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postIntubationHypotensionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, postIntubationHypotensionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 440, respiratoryRateBpm: 18, fio2: 0.5, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPostIntubationHypotensionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postIntubationHypotensionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Post-intubation hypotension experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/post-intubation-hypotension"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/post-intubation-hypotension' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPostIntubationHypotensionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'post-intubation-hypotension'),
    }).hasPostIntubationHypotensionResponse).toBe(false);
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
    for (const state of [EMPTY, PRESSURE, DANGER, MECHANISM, SUPPORT]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a dose, a fluid volume, or a decompression', () => {
    expect(markup(EMPTY)).toContain('First, prove the pressure.');
    expect(markup(MECHANISM)).toContain('Support now. Keep asking why.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|noradren|norepine|\bmcg\b|needle|decompress|30 mL\/kg|diagnos|prognos/iu);
    }
  });
});

describe('Post-intubation hypotension tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { postIntubationHypotensionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { postIntubationHypotensionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the same panic for nothing');
    const danger = markup(PRESSURE, { postIntubationHypotensionGuidance: 'guided' });
    expect(danger).toContain('that story is probably right');
    expect(danger).not.toContain('the same panic for nothing');
  });

  it('uses the measurement rather than an impression', () => {
    expect(markup(DANGER, { postIntubationHypotensionGuidance: 'guided' }))
      .toContain('a measurement rather than a guess');
  });

  it('declines the fluid-versus-vasopressor argument', () => {
    expect(markup(MECHANISM, { postIntubationHypotensionGuidance: 'guided' }))
      .toContain('not a universal fluid-versus-vasopressor answer');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { postIntubationHypotensionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { postIntubationHypotensionGuidance: 'guided', postIntubationHypotensionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
