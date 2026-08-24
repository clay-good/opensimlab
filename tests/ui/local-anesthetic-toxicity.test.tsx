/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY } from '@anesthesia/scenarios/local-anesthetic-systemic-toxicity';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('bounded LAST crisis controls', () => {
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

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  function render(overrides: Partial<ActionCockpitProps> = {}) {
    const props: ActionCockpitProps = {
      scenario: LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY,
      region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        localAnestheticToxicityFraction: 0.9, seizureActivityFraction: 1,
        seizureSuppressed: false, lipidEmulsionTotalMl: 0,
        lipidEmulsionInfusionMlPerMin: 0, lipidEmulsionEffectFraction: 0,
        lastLipidEmulsionTick: null,
      },
      lastExposure: { agentId: 'bupivacaine', tick: 600 }, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 12, fio2: 0.21,
        peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 1,
      },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
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

  it('exposes exact 60 kg ASRA initial lipid dosing and the named avoid list', () => {
    render();
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('90 mL initial bolus over 3 modeled minutes, then 15.0 mL/min');
    expect(container.textContent).toContain('Safety ceiling 720 mL');
    expect(container.textContent).toContain('Vasopressin, beta blockers');
    expect(container.textContent).toContain('calcium-channel blockers');
    expect(container.textContent).toContain('further local anesthetic');
    expect(button('5 µg IV')).toBeInstanceOf(HTMLButtonElement);
  });

  it('requires confirmation and sends semantic seizure and lipid actions', () => {
    const onSeizureSuppression = vi.fn();
    const onLipidEmulsion = vi.fn();
    render({ onSeizureSuppression, onLipidEmulsion });
    act(() => button('Crisis response')!.click());

    act(() => button('Prepare IV benzodiazepine')!.click());
    expect(onSeizureSuppression).not.toHaveBeenCalled();
    act(() => button('Give benzodiazepine')!.click());
    expect(onSeizureSuppression).toHaveBeenCalledOnce();

    act(() => button('Start initial lipid protocol')!.click());
    expect(onLipidEmulsion).not.toHaveBeenCalled();
    act(() => button('Start 20% lipid')!.click());
    expect(onLipidEmulsion).toHaveBeenCalledOnce();
  });

  it('reflects accepted engine state instead of optimistically updating requests', () => {
    render({
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 50,
        lastEpinephrineTick: 610, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        localAnestheticToxicityFraction: 0.4, seizureActivityFraction: 0,
        seizureSuppressed: true, lipidEmulsionTotalMl: 120,
        lipidEmulsionInfusionMlPerMin: 15, lipidEmulsionEffectFraction: 0.4,
        lastLipidEmulsionTick: 620,
      },
    });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('suppressed after accepted treatment');
    expect(container.textContent).toContain('Accepted total: 120 mL · 15.0 mL/min running');
    expect(button('Start initial lipid protocol')?.disabled).toBe(true);
  });
});
