/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { VENTILATOR_CIRCUIT_DISCONNECTION as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-circuit-disconnection';

describe('Requirement: ventilator circuit disconnection separates settings from delivery', () => {
  it('keeps bridge, source-to-patient inspection, restoration, and proof visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        ventilatorCircuitDisconnectionAssessment: { recognizedAtTick: null, bridgedAtTick: null,
          inspectedAtTick: null, restoredAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 420, respiratoryRateBpm: 20, fio2: 0.45, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onVentilatorCircuitDisconnectionResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Follow the breath, not the setting.');
    expect(container.textContent).toContain('Bridge first. Then reconnect. Then prove.');
    expect(container.textContent).toContain('commanded 420 mL · exhaled 0 · pressure lost');
    expect(container.textContent).toContain('oxygenate · inspect · restore · verify');
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize loss of delivered ventilation'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-ventilator-circuit-disconnection');
    act(() => root.unmount()); container.remove();
  });
});
