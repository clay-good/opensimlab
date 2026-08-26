/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OXYGEN_DEVICE_FAILURE as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/oxygen-device-failure';

describe('portable oxygen source private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ reconciledAtTick: number; bridgeAtTick: number;
    pathAtTick: number; restorationAtTick: number; responseAtTick: number; handoffAtTick: number;
    lastUnsupportedChoice: 'blood-gas' | 'continue-transport' | 'increase-source' | 'reseat-cannula' | null }> = {}) => ({
    reconciledAtTick: ticks.reconciledAtTick ?? null, bridgeAtTick: ticks.bridgeAtTick ?? null,
    pathAtTick: ticks.pathAtTick ?? null, restorationAtTick: ticks.restorationAtTick ?? null,
    responseAtTick: ticks.responseAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    lastUnsupportedChoice: ticks.lastUnsupportedChoice ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    trueHypoxemiaAuthored: true as const, pulseSignalCoherentAuthored: true as const,
    deliveredOxygenFailureAuthored: true as const, ventilationFailureAuthored: false as const,
    portableCylinderNoFlowAuthored: ticks.pathAtTick != null,
    alternateSourceIntentRecorded: ticks.bridgeAtTick != null,
    patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
    deviceInspectedByLearner: false as const, sourceSelectedByLearner: false as const,
    interfaceSelectedByLearner: false as const, flowSelectedByLearner: false as const,
    fio2SelectedByLearner: false as const, oxygenTargetSelectedByLearner: false as const,
    oxygenDeliveredByLearner: false as const, deviceOperatedByLearner: false as const,
    connectionHandledByLearner: false as const, repairPerformedByLearner: false as const,
    treatmentDeliveredByLearner: false as const, durableRestorationProven: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        oxygenDeviceFailureAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 400,
        respiratoryRateBpm: 30, fio2: 0.4, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onOxygenDeviceFailureResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('progressively prioritizes the person and bridge before the equipment trace', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    act(() => button('Review patient + signal')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-oxygen-device-failure-patient-signal-and-delivery');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ reconciledAtTick: 10 })))));
    expect(['Bridge to verified backup oxygen', 'Wait for a blood gas', 'Keep transport moving']
      .map((label) => button(label)?.disabled)).toEqual([false, false, false]);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(3);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ reconciledAtTick: 10,
      bridgeAtTick: 20 })))));
    expect(button('Trace patient-to-source path')).toBeDefined();
    expect(container.textContent).toMatch(/patient comes before troubleshooting/i);
  });

  it('keeps correction bounded and shows calm nonmutating feedback', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ reconciledAtTick: 10,
      bridgeAtTick: 20, pathAtTick: 30, lastUnsupportedChoice: 'increase-source' })))));
    expect(container.textContent).toMatch(/depleted source cannot deliver oxygen/i);
    expect(['Use checked replacement source', 'Turn the depleted source higher',
      'Reseat the patent cannula'].map((label) => button(label)?.disabled))
      .toEqual([false, false, false]);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ reconciledAtTick: 10,
      bridgeAtTick: 20, pathAtTick: 30, restorationAtTick: 40 })))));
    expect(button('Review 3-minute response')).toBeDefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ reconciledAtTick: 10,
      bridgeAtTick: 20, pathAtTick: 30, restorationAtTick: 40, responseAtTick: 50 })))));
    expect(button('Hand off source + reserve check')).toBeDefined();
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    expect(container.textContent).toMatch(/does not resolve the lung disease or declare transport safe/i);
    expect(container.textContent).not.toMatch(/flow selector|FiO₂ selector|cylinder pressure/i);
  });
});
