/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { stateSummary } from '@anesthesia/ui/accessibility';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: capnography sample-path controls are accessible and state-driven', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const baseProps = (): ActionCockpitProps => ({
    scenario: SCENARIO,
    region: UNITED_STATES,
    infusions: [],
    hypnoticLine: { connected: true, inspected: false },
    capnographyLine: { obstructed: true, ventilationCrossChecked: false },
    resuscitation: {
      epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0,
      dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
      lastDantroleneTick: null, activeCooling: false,
    },
    lastExposure: null,
    syringeRemaining: {},
    ventilator: {
      mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 12,
      fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0,
      freshGasFlowLPerMin: 1,
    },
    intubated: false, airwayAttempts: 0, lastGrade: null,
    airwayAttemptInProgress: false, airwayAttemptSecondsRemaining: 0,
    jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
    supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
    muscleRigidityFraction: 0,
    onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
    onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
    onAirwayManeuver: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
    onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {},
    onDrugCard: () => {},
  });

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('requires a deliberate confirmation and dispatches exact actions', () => {
    const onCapnographyLine = vi.fn();
    act(() => root.render(createElement(ActionCockpit, { ...baseProps(), onCapnographyLine })));
    act(() => button('Airway & Vent')!.click());

    expect(container.textContent).toContain('Patient ventilation and the sampled display are separate states.');
    act(() => button('Cross-check ventilation')!.click());
    expect(onCapnographyLine).toHaveBeenCalledWith('cross-check-ventilation');

    act(() => button('Reconnect sampling line')!.click());
    expect(onCapnographyLine).toHaveBeenCalledTimes(1);
    expect(button('Confirm reconnect')).toBeInstanceOf(HTMLButtonElement);
    act(() => button('Confirm reconnect')!.click());
    expect(onCapnographyLine).toHaveBeenLastCalledWith('reconnect');
  });

  it('disables completed actions from accepted engine state and names the state nonvisually', () => {
    act(() => root.render(createElement(ActionCockpit, {
      ...baseProps(),
      capnographyLine: { obstructed: false, ventilationCrossChecked: true },
    })));
    act(() => button('Airway & Vent')!.click());
    expect(button('Cross-check ventilation')!.disabled).toBe(true);
    expect(button('Reconnect sampling line')!.disabled).toBe(true);

    const summary = stateSummary({
      heartRateBpm: 70, meanArterialMmHg: 88, spo2Percent: 98,
      etco2MmHg: 38, depthIndex: 93, coreTemperatureC: 36.6, fio2: 0.21,
    } as never, {
      alarms: [], infusions: [], invalid: new Set(),
      ventilator: baseProps().ventilator,
      capnographyLine: { obstructed: true, ventilationCrossChecked: true },
    });
    expect(summary).toContain('Carbon-dioxide sampling line obstructed');
    expect(summary).toContain('Independent ventilation evidence has been cross-checked.');
  });
});
