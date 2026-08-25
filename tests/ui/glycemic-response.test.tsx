/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { PERIOPERATIVE_HYPERGLYCEMIA } from '@anesthesia/scenarios/perioperative-hyperglycemia';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: glucose care is focused, ordered, and dose-agnostic', () => {
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

  it('opens to glucose care and unlocks one ordered action at a time', () => {
    const onGlycemicResponse = vi.fn();
    const props: ActionCockpitProps = {
      scenario: PERIOPERATIVE_HYPERGLYCEMIA, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        glycemicResponse: {
          pointOfCareGlucoseMgPerDl: 238, pointOfCareConfirmedAtTick: null,
          insulinProtocolIntentAtTick: null, repeatEligible: false,
          repeatPointOfCareAtTick: null, repeatPointOfCareGlucoseMgPerDl: null,
        },
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'volume-control', tidalVolumeMl: 480, respiratoryRateBpm: 12,
        fio2: 0.4, peep: 5, delivering: true, sevofluranePercent: 1.2,
        freshGasFlowLPerMin: 2,
      },
      intubated: true, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
      onGlycemicResponse, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Fluids');
    expect(button('Confirm point-of-care glucose').disabled).toBe(false);
    expect(button('Use institutional insulin protocol').disabled).toBe(true);
    expect(button('Repeat glucose at 30 min').disabled).toBe(true);
    expect(container.textContent).toContain('238 mg/dL · 13.2 mmol/L');
    expect(container.textContent).not.toContain('Thermal care');
    expect(button('250 mL')).toBeUndefined();
    act(() => button('Confirm point-of-care glucose').click());
    expect(onGlycemicResponse).toHaveBeenCalledWith('confirm-point-of-care-glucose');
    expect(button('Confirm point-of-care glucose').classList).toContain('glycemic-response__action');
    expect(container.textContent).toContain('dose selection, delivery');
  });
});
