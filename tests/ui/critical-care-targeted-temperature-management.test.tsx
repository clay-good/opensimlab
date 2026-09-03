/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TARGETED_TEMPERATURE_MANAGEMENT as SCENARIO } from '../../src/modules/critical-care/scenarios/targeted-temperature-management';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, contextAtTick: null, protocolAtTick: null,
  guardrailsAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['postArrestTemperatureAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const CONTEXT = base({ recognitionAtTick: 0, contextAtTick: 1 });
const PROTOCOL = base({ recognitionAtTick: 0, contextAtTick: 1, protocolAtTick: 2 });
const GUARDRAILS = base({ recognitionAtTick: 0, contextAtTick: 1, protocolAtTick: 2, guardrailsAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, contextAtTick: 1, protocolAtTick: 2, guardrailsAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNIZED, CONTEXT, PROTOCOL, GUARDRAILS, DONE];

const LABELS = ['Recognize indication + activate help', 'Review brain + systemic context',
  'Activate individualized temperature protocol', 'Record cooling + rewarming guardrails',
  'Review temperature + organ trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postArrestTemperatureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, postArrestTemperatureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 440, respiratoryRateBpm: 18, fio2: 0.4, peep: 5, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPostArrestTemperatureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postArrestTemperatureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Post-arrest temperature control experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/targeted-temperature-management"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/targeted-temperature-management' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPostArrestTemperatureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'targeted-temperature-management'),
    }).hasPostArrestTemperatureResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNIZED, CONTEXT, PROTOCOL, GUARDRAILS]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a target temperature, a device, or a prognosis', () => {
    expect(markup(EMPTY)).toContain('Control temperature. No early prognosis.');
    expect(markup(CONTEXT)).toContain('Choose a range. Protect the patient.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/33 ?°|blanket|catheter|cold saline|paralytic|diagnos|prognos/iu);
    }
  });
});

describe('Post-arrest temperature control tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { postArrestTemperatureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { postArrestTemperatureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the least reliable thing in the room');
    const context = markup(RECOGNIZED, { postArrestTemperatureGuidance: 'guided' });
    expect(context).toContain('refuse to let any one sign mean something on its own');
    expect(context).not.toContain('the least reliable thing in the room');
  });

  it('names the remembered number and says what replaced it', () => {
    expect(markup(CONTEXT, { postArrestTemperatureGuidance: 'guided' }))
      .toContain('the decision here is not which number');
  });

  it('names the two classic harms as harms', () => {
    expect(markup(PROTOCOL, { postArrestTemperatureGuidance: 'guided' }))
      .toContain('a large volume into a heart that just arrested');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { postArrestTemperatureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { postArrestTemperatureGuidance: 'guided', postArrestTemperatureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
