/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OXYGEN_DEVICE_FAILURE as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/oxygen-device-failure';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  trueHypoxemiaAuthored: true as const, pulseSignalCoherentAuthored: true as const,
  deliveredOxygenFailureAuthored: true as const, ventilationFailureAuthored: false as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  deviceInspectedByLearner: false as const, sourceSelectedByLearner: false as const,
  interfaceSelectedByLearner: false as const, flowSelectedByLearner: false as const,
  fio2SelectedByLearner: false as const, oxygenTargetSelectedByLearner: false as const,
  oxygenDeliveredByLearner: false as const, deviceOperatedByLearner: false as const,
  connectionHandledByLearner: false as const, repairPerformedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, durableRestorationProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  reconciledAtTick: null, bridgeAtTick: null, pathAtTick: null,
  restorationAtTick: null, responseAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null,
  portableCylinderNoFlowAuthored: over.pathAtTick != null,
  alternateSourceIntentRecorded: over.bridgeAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['oxygenDeviceFailureAssessment']>);

const EMPTY = base({});
const RECONCILED = base({ reconciledAtTick: 0 });
const AFTER_GAS = base({ reconciledAtTick: 0, lastUnsupportedChoice: 'blood-gas' });
const AFTER_TRANSPORT = base({ reconciledAtTick: 0, lastUnsupportedChoice: 'continue-transport' });
const PATH = base({ reconciledAtTick: 0, bridgeAtTick: 1, pathAtTick: 2 });
const AFTER_INCREASE = base({ reconciledAtTick: 0, bridgeAtTick: 1, pathAtTick: 2, lastUnsupportedChoice: 'increase-source' });
const AFTER_RESEAT = base({ reconciledAtTick: 0, bridgeAtTick: 1, pathAtTick: 2, lastUnsupportedChoice: 'reseat-cannula' });
const RESTORED = base({ reconciledAtTick: 0, bridgeAtTick: 1, pathAtTick: 2, restorationAtTick: 3 });
const DONE = base({ reconciledAtTick: 0, bridgeAtTick: 1, pathAtTick: 2, restorationAtTick: 3, responseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECONCILED, AFTER_GAS, AFTER_TRANSPORT, PATH, AFTER_INCREASE, AFTER_RESEAT, RESTORED, DONE];

const LABELS = ['Review patient + signal', 'Bridge to verified backup oxygen',
  'Wait for a blood gas', 'Keep transport moving', 'Trace patient-to-source path',
  'Use checked replacement source', 'Turn the depleted source higher',
  'Reseat the patent cannula', 'Review 3-minute response', 'Hand off source + reserve check'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['oxygenDeviceFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, oxygenDeviceFailureAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 30, fio2: 0.4, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onOxygenDeviceFailureResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['oxygenDeviceFailureAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory portable-oxygen-failure experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/oxygen-device-failure"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/oxygen-device-failure' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('offers each set of reflexes only at the moment it belongs to', () => {
    expect(crisisResponseAvailability(SCENARIO).hasOxygenDeviceFailureResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'oxygen-device-failure'),
    }).hasOxygenDeviceFailureResponse).toBe(false);
    const opening = markup(EMPTY);
    expect(opening).not.toContain('Wait for a blood gas');
    expect(opening).not.toContain('Turn the depleted source higher');
    const recognized = markup(RECONCILED);
    expect(recognized).toContain('Bridge to verified backup oxygen');
    expect(recognized).toContain('Wait for a blood gas');
    expect(recognized).toContain('Keep transport moving');
    const traced = markup(PATH);
    expect(traced).toContain('Use checked replacement source');
    expect(traced).toContain('Turn the depleted source higher');
    expect(traced).toContain('Reseat the patent cannula');
  });

  it('says what happened after each of the four reflexes', () => {
    expect(markup(AFTER_GAS)).toContain('support cannot wait for another test');
    expect(markup(AFTER_TRANSPORT)).toContain('restore reliable delivery before moving');
    expect(markup(AFTER_INCREASE)).toContain('cannot deliver oxygen by selecting a higher number');
    expect(markup(AFTER_RESEAT)).toContain('the fixed interruption is upstream');
  });

  it('never offers a repair, a flow, an FiO₂, or a transport decision', () => {
    expect(markup(EMPTY)).toContain('Confirm the person. Then follow the oxygen.');
    expect(markup(DONE)).toContain('Restored flow still needs proof.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|measure|acquire|interpret|repair|open the|attach|detach|reconnect|regulator|flowmeter|FiO|L\/min|oxygen target|prescri|diagnose|disposition|discharge|prognos/iu);
    }
  });
});

describe('Portable-oxygen-failure tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { oxygenDeviceFailureGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { oxygenDeviceFailureGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('before you believe the equipment');
    const bridging = markup(RECONCILED, { oxygenDeviceFailureGuidance: 'guided' });
    expect(bridging).toContain('get oxygen from somewhere else, now');
    expect(bridging).not.toContain('before you believe the equipment');
  });

  it('answers the specific reflex at the first decision point', () => {
    const gas = markup(AFTER_GAS, { oxygenDeviceFailureGuidance: 'guided' });
    expect(gas).toContain('A gas would only confirm it later');
    expect(gas).not.toContain('Stop the trolley');
    const transport = markup(AFTER_TRANSPORT, { oxygenDeviceFailureGuidance: 'guided' });
    expect(transport).toContain('Stop the trolley');
    expect(transport).toContain('the least monitored place in the hospital');
    expect(transport).not.toContain('A gas would only confirm it later');
  });

  it('answers the specific reflex at the second decision point', () => {
    const increase = markup(AFTER_INCREASE, { oxygenDeviceFailureGuidance: 'guided' });
    expect(increase).toContain('nothing behind the number to turn up');
    expect(increase).not.toContain('The problem is upstream of it');
    const reseat = markup(AFTER_RESEAT, { oxygenDeviceFailureGuidance: 'guided' });
    expect(reseat).toContain('The problem is upstream of it');
    expect(reseat).not.toContain('nothing behind the number to turn up');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { oxygenDeviceFailureGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { oxygenDeviceFailureGuidance: 'guided', oxygenDeviceFailureDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
