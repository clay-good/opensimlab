/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HYPERKALEMIC_CONDUCTION_DISTURBANCE as SCENARIO } from '../../src/modules/cardiology/scenarios/hyperkalemic-conduction-disturbance';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  treatmentDeliveredByLearner: false as const,
  pacingDelivered: false as const,
  captureAssessed: false as const,
  permanentDeviceSelected: false as const,
};
const base = (over: Record<string, unknown>) => ({
  reconciledAtTick: null, calciumResponseAtTick: null, shiftSurveillanceAtTick: null,
  removalDeviceAtTick: null, laterPanelAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['hyperkalemicConductionAssessment']>);

const EMPTY = base({});
const RECONCILED = base({ reconciledAtTick: 0 });
const CALCIUM = base({ reconciledAtTick: 0, calciumResponseAtTick: 1 });
const TWO = base({ reconciledAtTick: 0, removalDeviceAtTick: 1, shiftSurveillanceAtTick: 2 });
const THREE = base({ reconciledAtTick: 0, calciumResponseAtTick: 1, shiftSurveillanceAtTick: 2, removalDeviceAtTick: 3 });
const PANEL = base({ reconciledAtTick: 0, calciumResponseAtTick: 1, shiftSurveillanceAtTick: 2, removalDeviceAtTick: 3, laterPanelAtTick: 4 });
const DONE = base({ reconciledAtTick: 0, calciumResponseAtTick: 1, shiftSurveillanceAtTick: 2, removalDeviceAtTick: 3, laterPanelAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECONCILED, CALCIUM, TWO, THREE, PANEL, DONE];

const LABELS = ['Reconcile rhythm + potassium trajectory', 'Review reported calcium response',
  'Review shifting + glucose surveillance', 'Review removal + device restraint',
  'Review later ECG + potassium panel', 'Hand off rhythm + rebound plan'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hyperkalemicConductionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, hyperkalemicConductionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHyperkalemicConductionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hyperkalemicConductionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Hyperkalemic conduction experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/hyperkalemic-conduction-disturbance"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/hyperkalemic-conduction-disturbance' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHyperkalemicConductionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hyperkalemic-conduction-disturbance'),
    }).hasHyperkalemicConductionResponse).toBe(false);
  });

  it('keeps all six steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('opens all three review lanes at once, and none before the trajectory', () => {
    const LANES = ['Review reported calcium response', 'Review shifting \\+ glucose surveillance',
      'Review removal \\+ device restraint'];
    const opening = markup(EMPTY);
    for (const lane of LANES) {
      expect(opening).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
    const ready = markup(RECONCILED);
    for (const lane of LANES) {
      expect(ready).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('keeps the later panel closed until all three lanes have landed', () => {
    for (const state of [RECONCILED, CALCIUM, TWO]) {
      expect(markup(state)).toMatch(/<button[^>]* disabled=""[^>]*>Review later ECG \+ potassium panel/);
    }
    expect(markup(THREE)).not.toMatch(/<button[^>]* disabled=""[^>]*>Review later ECG \+ potassium panel/);
  });

  it('never offers a dose, a rescue, or a device', () => {
    expect(markup(EMPTY)).toContain('The rhythm changed. Check the chemistry.');
    expect(markup(THREE)).toContain('Remove. Recheck. Hand off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|insulin|dialy|binder|implant|program|capture|mmol|units|diagnos|prognos/iu);
    }
  });
});

describe('Hyperkalemic conduction tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { hyperkalemicConductionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { hyperkalemicConductionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Three timepoints, not one');
    const lanes = markup(RECONCILED, { hyperkalemicConductionGuidance: 'guided' });
    expect(lanes).toContain('none of them queues behind the others');
    expect(lanes).not.toContain('Three timepoints, not one');
  });

  it('says what the calcium did not do', () => {
    expect(markup(TWO, { hyperkalemicConductionGuidance: 'guided' }))
      .toContain('calcium does not remove potassium and was never going to');
  });

  it('names both consequences of shifting treatment', () => {
    const html = markup(CALCIUM, { hyperkalemicConductionGuidance: 'guided' });
    expect(html).toContain('which is what rebound means');
    expect(html).toContain('the insulin outlasts the glucose');
  });

  it('reads the later panel as one point on a line', () => {
    expect(markup(THREE, { hyperkalemicConductionGuidance: 'guided' }))
      .toContain('a serial measurement rather than a result');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { hyperkalemicConductionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { hyperkalemicConductionGuidance: 'guided', hyperkalemicConductionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
