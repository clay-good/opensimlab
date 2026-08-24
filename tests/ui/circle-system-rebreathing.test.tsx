/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CIRCLE_SYSTEM_REBREATHING as SCENARIO } from '@anesthesia/scenarios/circle-system-rebreathing';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { MonitorRegion } from '@anesthesia/ui/MonitorRegion';
import { breathingCircuitSummary, waveformDescriptions } from '@anesthesia/ui/accessibility';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: circle-system controls stay focused, state-driven, and nonvisual', () => {
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
    breathingCircuit: {
      co2Absorbent: 'exhausted', inspiredCo2MmHg: 5.8,
      capnogramAssessed: false, absorbentReplaced: false,
    },
    resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
      dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false },
    lastExposure: null, syringeRemaining: {},
    ventilator: { mode: 'volume-control', tidalVolumeMl: 450, respiratoryRateBpm: 12,
      fio2: 0.5, peep: 0, delivering: true, sevofluranePercent: 1.6, freshGasFlowLPerMin: 1 },
    intubated: true, airwayAttempts: 1, lastGrade: 1,
    jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
    supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
    onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
    onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
    onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
    onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  });
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows one compact circuit tray, dispatches exact intent, and links to fresh-gas controls', () => {
    const onBreathingCircuit = vi.fn();
    act(() => root.render(createElement(ActionCockpit, { ...baseProps(), onBreathingCircuit })));
    act(() => button('Circuit').click());
    expect(container.textContent).toContain('Inspired CO₂ 5.8 mmHg');
    expect(container.textContent).toContain('Fresh gas 1.0 L/min');
    expect(button('Replace absorbent').disabled).toBe(true);
    act(() => button('Assess capnogram').click());
    expect(onBreathingCircuit).toHaveBeenCalledWith('assess-capnogram');
    act(() => button('Open Airway & Vent').click());
    expect(container.textContent).toContain('Fresh gas flow');
  });

  it('enables definitive correction only from accepted assessment state', () => {
    const onBreathingCircuit = vi.fn();
    act(() => root.render(createElement(ActionCockpit, {
      ...baseProps(), onBreathingCircuit,
      breathingCircuit: { ...baseProps().breathingCircuit!, capnogramAssessed: true },
    })));
    act(() => button('Circuit').click());
    expect(button('Assess capnogram').disabled).toBe(true);
    expect(button('Replace absorbent').disabled).toBe(false);
    act(() => button('Replace absorbent').click());
    expect(onBreathingCircuit).toHaveBeenCalledWith('replace-absorbent');
  });

  it('describes the raised inspiratory baseline and circuit state without color or canvas', () => {
    const descriptions = waveformDescriptions({
      rhythm: 'sinus', bronchospasmSeverity: 0, airwayPatencyFraction: 1,
      perfusionIndex: 1, artifacts: new Set(), inspiredCo2MmHg: 5.8,
      ventilating: true, mechanicalPulse: true,
    });
    expect(descriptions.find((entry) => entry.signal === 'capno')?.description)
      .toContain('inspiratory baseline remains about 5.8');
    expect(breathingCircuitSummary(baseProps().breathingCircuit!)).toContain('exhausted');

    const monitor = renderToStaticMarkup(createElement(MonitorRegion, {
      state: { respiratoryRateBpm: 12, perfusionIndex: 1 }, blocks: [], alarms: [], tick: 0,
      invalidParameters: new Set<string>(), artifactParameters: new Set<string>(),
      waveformArtifacts: new Set<string>(),
      inspiredCo2MmHg: 5.8, rhythm: 'sinus', airwayPatencyFraction: 1,
      bronchospasmSeverity: 0, mechanicalPulse: true, reducedMotion: true,
      colorblindSafe: false, showLimits: true, primaryTracesOnly: false, canvasHeight: 320,
      onSilence: () => undefined, onWhy: () => undefined,
    }));
    expect(monitor).toContain('inspiratory baseline remains about 5.8');
  });
});
