/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { HYPOTHERMIA_AND_REWARMING } from '@anesthesia/scenarios/hypothermia-and-rewarming';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: thermal care is focused, ordered, and device-agnostic', () => {
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

  const renderCockpit = (
    thermalResponse: NonNullable<ActionCockpitProps['resuscitation']['thermalResponse']>,
    onThermalResponse = vi.fn(),
  ) => {
    const props: ActionCockpitProps = {
      scenario: HYPOTHERMIA_AND_REWARMING,
      region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, thermalResponse,
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'volume-control', tidalVolumeMl: 450, respiratoryRateBpm: 12,
        fio2: 0.45, peep: 5, delivering: true, sevofluranePercent: 1.2,
        freshGasFlowLPerMin: 2,
      },
      intubated: true, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
      onThermalResponse, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onThermalResponse;
  };

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('opens to thermal care and unlocks both bounded warming intents after confirmation', () => {
    const onThermalResponse = renderCockpit({
      targetTemperatureC: 35.5, coreTemperatureConfirmedAtTick: null,
      forcedAirWarmingAtTick: null, warmedBulkFluidsAtTick: null,
    });
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Fluids');
    expect(button('Confirm core temperature')!.disabled).toBe(false);
    expect(button('Start active surface warming')!.disabled).toBe(true);
    expect(button('Warm remaining 700 mL crystalloid')!.disabled).toBe(true);
    expect(button('250 mL')).toBeUndefined();
    act(() => button('Confirm core temperature')!.click());
    expect(onThermalResponse).toHaveBeenCalledWith('confirm-core-temperature');

    renderCockpit({
      targetTemperatureC: 35.5, coreTemperatureConfirmedAtTick: 100,
      forcedAirWarmingAtTick: null, warmedBulkFluidsAtTick: null,
    }, onThermalResponse);
    expect(button('Start active surface warming')!.disabled).toBe(false);
    expect(button('Warm remaining 700 mL crystalloid')!.disabled).toBe(false);
    expect(button('Start active surface warming')!.classList).toContain('thermal-response__action');
    expect(container.textContent).toContain('Device settings, probe technique');
  });
});
