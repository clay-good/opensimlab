/** @vitest-environment jsdom */
import { act } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit } from '@anesthesia/ui/ActionCockpit';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: The fluids tray performs a real learner action', () => {
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

  it('requires confirmation and sends the selected product and volume', () => {
    const onFluid = vi.fn();
    const onBloodProduct = vi.fn();
    const onCoagulationLabs = vi.fn();
    const resuscitation = {
      epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 750,
      hemorrhageActive: false,
      dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
      lastDantroleneTick: null, activeCooling: false,
    } as const;
    const renderCockpit = (hemorrhageActive: boolean) => createElement(ActionCockpit, {
      scenario: UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE,
      region: UNITED_STATES,
      infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { ...resuscitation, hemorrhageActive },
      lastExposure: null,
      syringeRemaining: {},
      ventilator: {
        mode: 'manual' as const, tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2,
      },
      intubated: false,
      airwayAttempts: 0,
      lastGrade: null,
      jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask' as const, supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {},
      onInfusion: () => {},
      onHypnoticLine: () => {},
      onFluid,
      onBloodProduct,
      onCoagulationLabs,
      onVentilator: () => {},
      onLaryngoscopy: () => {},
      onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {},
      onEpinephrine: () => {},
      onDantrolene: () => {},
      onActiveCooling: () => {},
      onDrugCard: () => {},
    });
    act(() => {
      root.render(renderCockpit(false));
    });

    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;
    act(() => button('Fluids')!.click());
    expect(container.textContent).toContain('25% remains intravascular');
    expect(container.textContent).toContain('Accepted total: 750 mL');
    expect(container.textContent).not.toContain('Fresh frozen plasma');
    expect(container.textContent).not.toContain('Coagulation panel');
    act(() => root.render(renderCockpit(true)));
    act(() => button('1000 mL')!.click());
    expect(onFluid).not.toHaveBeenCalled();
    act(() => button('Give fluid')!.click());
    expect(onFluid).toHaveBeenCalledWith('balanced-crystalloid', 1000);
    expect(container.textContent).toContain('Accepted total: 750 mL');

    expect(container.textContent).toContain('1 unit adds 300 mL and 60 g hemoglobin');
    expect(container.textContent).toContain('Accepted: 0 units · all blood products 0 mL');
    act(() => button('2 units')!.click());
    expect(onBloodProduct).not.toHaveBeenCalled();
    act(() => button('Give packed red cells')!.click());
    expect(onBloodProduct).toHaveBeenCalledWith('packed-red-blood-cells', 2);

    expect(container.textContent).toContain('Fresh frozen plasma');
    act(() => button('4 units')!.click());
    act(() => button('Give plasma')!.click());
    expect(onBloodProduct).toHaveBeenCalledWith('fresh-frozen-plasma', 4);
    act(() => button('Request panel')!.click());
    expect(onCoagulationLabs).toHaveBeenCalledOnce();
  });
});
