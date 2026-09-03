/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { DELAYED_VASOPRESSOR_DELIVERY as SCENARIO } from '../../src/modules/critical-care/scenarios/delayed-vasopressor-delivery';

const base = (over: Record<string, unknown>) => ({
  discordanceAtTick: null, pathAtTick: null, classifiedAtTick: null,
  protocolAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['delayedVasopressorDeliveryAssessment']>);

const EMPTY = base({});
const DISCORDANCE = base({ discordanceAtTick: 0 });
const PATH = base({ discordanceAtTick: 0, pathAtTick: 1 });
const CLASSIFIED = base({ discordanceAtTick: 0, pathAtTick: 1, classifiedAtTick: 2 });
const PROTOCOL = base({ discordanceAtTick: 0, pathAtTick: 1, classifiedAtTick: 2, protocolAtTick: 3 });
const DONE = base({ discordanceAtTick: 0, pathAtTick: 1, classifiedAtTick: 2, protocolAtTick: 3, reassessedAtTick: 4 });
const STATES = [EMPTY, DISCORDANCE, PATH, CLASSIFIED, PROTOCOL, DONE];

const LABELS = ['Separate command from delivery', 'Trace syringe → pump → line → patient',
  'Classify dead-space + startup delay', 'Activate local safe-start protocol',
  'Prove delivery + perfusion response'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['delayedVasopressorDeliveryAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, delayedVasopressorDeliveryAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 410, respiratoryRateBpm: 20, fio2: 0.4, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onDelayedVasopressorDeliveryResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['delayedVasopressorDeliveryAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Delayed vasopressor delivery experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/delayed-vasopressor-delivery"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/delayed-vasopressor-delivery' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasDelayedVasopressorDeliveryResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'delayed-vasopressor-delivery'),
    }).hasDelayedVasopressorDeliveryResponse).toBe(false);
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
    for (const state of [EMPTY, DISCORDANCE, PATH, CLASSIFIED, PROTOCOL]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a flush, a prime, a pump program, or a rate', () => {
    expect(markup(EMPTY)).toContain('Running is not arriving.');
    expect(markup(CLASSIFIED)).toContain('Move the drug, not the risk.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/flush|prime|purge|bolus|program|mL\/h|mcg|diagnos|prognos/iu);
    }
  });
});

describe('Delayed vasopressor delivery tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { delayedVasopressorDeliveryGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { delayedVasopressorDeliveryGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a claim about a motor');
    const path = markup(DISCORDANCE, { delayedVasopressorDeliveryGuidance: 'guided' });
    expect(path).toContain('Follow the drug from the syringe to her');
    expect(path).not.toContain('a claim about a motor');
  });

  it('says what a good fit does not exclude', () => {
    expect(markup(PATH, { delayedVasopressorDeliveryGuidance: 'guided' }))
      .toContain('a good fit is exactly when a list gets abandoned');
  });

  it('names the fix that hurts and refuses it', () => {
    expect(markup(CLASSIFIED, { delayedVasopressorDeliveryGuidance: 'guided' }))
      .toContain('an uncontrolled bolus into a woman with a MAP of 54');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { delayedVasopressorDeliveryGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { delayedVasopressorDeliveryGuidance: 'guided', delayedVasopressorDeliveryDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
