/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { VENTILATOR_CIRCUIT_DISCONNECTION as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-circuit-disconnection';

const base = (over: Record<string, unknown>) => ({
  recognizedAtTick: null, bridgedAtTick: null, inspectedAtTick: null,
  restoredAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['ventilatorCircuitDisconnectionAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognizedAtTick: 0 });
const BRIDGED = base({ recognizedAtTick: 0, bridgedAtTick: 1 });
const INSPECTED = base({ recognizedAtTick: 0, bridgedAtTick: 1, inspectedAtTick: 2 });
const RESTORED = base({ recognizedAtTick: 0, bridgedAtTick: 1, inspectedAtTick: 2, restoredAtTick: 3 });
const DONE = base({ recognizedAtTick: 0, bridgedAtTick: 1, inspectedAtTick: 2, restoredAtTick: 3, reassessedAtTick: 4 });
const STATES = [EMPTY, RECOGNISED, BRIDGED, INSPECTED, RESTORED, DONE];

const LABELS = ['Recognize loss of delivered ventilation', 'Call help + bridge oxygenation',
  'Trace patient → airway → circuit → source', 'Restore continuity + established support',
  'Prove delivered breaths + patient response'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['ventilatorCircuitDisconnectionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, ventilatorCircuitDisconnectionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 420, respiratoryRateBpm: 20, fio2: 0.45, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onVentilatorCircuitDisconnectionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['ventilatorCircuitDisconnectionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Circuit-disconnection experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/ventilator-circuit-disconnection"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/ventilator-circuit-disconnection' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasVentilatorCircuitDisconnectionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventilator-circuit-disconnection'),
    }).hasVentilatorCircuitDisconnectionResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNISED, BRIDGED, INSPECTED, RESTORED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers to reconnect, bag, or change a setting', () => {
    expect(markup(EMPTY)).toContain('Follow the breath, not the setting.');
    expect(markup(INSPECTED)).toContain('Bridge first. Then reconnect. Then prove.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|bag-valve|\bmL\b|cm H|silence the alarm|diagnos|prognos/iu);
    }
  });
});

describe('Circuit-disconnection tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { ventilatorCircuitDisconnectionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { ventilatorCircuitDisconnectionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('two different facts and only the second one is about the patient');
    const bridge = markup(RECOGNISED, { ventilatorCircuitDisconnectionGuidance: 'guided' });
    expect(bridge).toContain('the one everybody skips');
    expect(bridge).not.toContain('two different facts and only the second one is about the patient');
  });

  it('gives the direction of the trace', () => {
    expect(markup(BRIDGED, { ventilatorCircuitDisconnectionGuidance: 'guided' }))
      .toContain('starting at the machine is how a team spends a minute on a device that is working perfectly');
  });

  it('restores without improving', () => {
    expect(markup(INSPECTED, { ventilatorCircuitDisconnectionGuidance: 'guided' }))
      .toContain('nothing to invent here and nothing to improve while you are at it');
  });

  it('goes quiet once the response is reassessed', () => {
    expect(markup(DONE, { ventilatorCircuitDisconnectionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { ventilatorCircuitDisconnectionGuidance: 'guided', ventilatorCircuitDisconnectionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
