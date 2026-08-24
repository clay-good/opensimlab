/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT as SCENARIO } from '@anesthesia/scenarios/arterial-pressure-transducer-artifact';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { arterialLineSummary, waveformDescriptions } from '@anesthesia/ui/accessibility';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: arterial-system controls are state-driven and accessible', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const baseProps = (): ActionCockpitProps => ({
    scenario: SCENARIO, region: UNITED_STATES, infusions: [],
    hypnoticLine: { connected: true, inspected: false },
    arterialLine: {
      displayedMeanArterialMmHg: 63, mislevelingCm: 20, dynamicResponse: 'overdamped',
      waveformAssessed: false, leveledAndZeroed: false,
      cuff: { status: 'idle', secondsRemaining: 0, meanArterialMmHg: null, measuredAtTick: null },
    },
    resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
      dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false },
    lastExposure: null, syringeRemaining: {},
    ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12,
      fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 1 },
    intubated: false, airwayAttempts: 0, lastGrade: null,
    jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
    supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
    onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
    onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
    onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
    onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  });
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows the compact monitor tray and dispatches exact diagnostic actions', () => {
    const onArterialLine = vi.fn();
    act(() => root.render(createElement(ActionCockpit, { ...baseProps(), onArterialLine })));
    act(() => button('Monitor').click());
    expect(container.textContent).toContain('Displayed MAP 63 mmHg');
    expect(container.textContent).toContain('No independent cuff result');
    act(() => button('Assess waveform').click());
    act(() => button('Level & zero').click());
    act(() => button('Cycle cuff').click());
    expect(onArterialLine.mock.calls.map(([action]) => action)).toEqual([
      'assess-waveform', 'level-zero', 'cycle-cuff',
    ]);
    expect(button('Replace pressure tubing').disabled).toBe(true);
  });

  it('names over-damping when the caller passes signal ids rather than artifact ids', () => {
    const descriptions = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 1,
      perfusionIndex: 1, artifacts: new Set(['arterial']), arterialDamped: true,
      ventilating: true, mechanicalPulse: true,
    });
    expect(descriptions.find((entry) => entry.signal === 'arterial')?.description)
      .toContain('Damped');
    expect(arterialLineSummary(baseProps().arterialLine!)).toContain(
      '20 centimeters above its reference level',
    );
  });
});
