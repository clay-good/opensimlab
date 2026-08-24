/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { PERSISTENT_VF_CARDIAC_ARREST } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('keyboard-reachable cardiac-arrest controls', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  function render(overrides: Partial<ActionCockpitProps> = {}) {
    const props: ActionCockpitProps = {
      scenario: PERSISTENT_VF_CARDIAC_ARREST, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        cardiacArrestActive: true, chestCompressionsActive: false,
        chestCompressionSeconds: 0, compressionPerfusionFraction: 0,
        arrestEpinephrineTotalMg: 0, lastArrestEpinephrineTick: null,
        defibrillationShockCount: 0, lastDefibrillationEnergyJ: null, roscAtTick: null,
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 10,
        fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: true, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
      ...overrides,
    };
    act(() => root.render(createElement(ActionCockpit, props)));
  }

  it('makes compressions, 1 mg epinephrine, and energy selection operable by keyboard', () => {
    const onChestCompressions = vi.fn();
    const onArrestEpinephrine = vi.fn();
    const onDefibrillation = vi.fn();
    render({ onChestCompressions, onArrestEpinephrine, onDefibrillation });
    act(() => button('Crisis response')!.focus());
    act(() => button('Crisis response')!.click());

    act(() => { button('Start compressions')!.focus(); button('Start compressions')!.click(); });
    expect(onChestCompressions).toHaveBeenCalledWith(true);
    act(() => button('Prepare 1 mg IV')!.click());
    act(() => button('Give 1 mg IV')!.click());
    expect(onArrestEpinephrine).toHaveBeenCalledOnce();
    act(() => button('200 J')!.click());
    act(() => button('Deliver 200 J')!.click());
    expect(onDefibrillation).toHaveBeenCalledWith(200);
  });

  it('renders accepted treatment state and disables actions after ROSC', () => {
    render({ resuscitation: {
      epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
      dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
      cardiacArrestActive: false, chestCompressionsActive: false,
      chestCompressionSeconds: 42, compressionPerfusionFraction: 0,
      arrestEpinephrineTotalMg: 1, lastArrestEpinephrineTick: 720,
      defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200, roscAtTick: 730,
    } });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('ROSC recorded');
    expect(container.textContent).toContain('Accepted total: 1 mg');
    expect(container.textContent).toContain('Shocks: 1 · last 200 J');
    expect(button('Start compressions')?.disabled).toBe(true);
  });
});
