/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: a silent hypnotic-line failure must be inspected', () => {
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
    hypnoticLine: ActionCockpitProps['hypnoticLine'],
    onHypnoticLine = vi.fn(),
  ) => {
    act(() => {
      root.render(createElement(ActionCockpit, {
        scenario: ROUTINE_INDUCTION,
        region: UNITED_STATES,
        infusions: [{
          drugId: 'propofol', rate: 7, unit: 'mg/min', elapsedSeconds: 90,
        }],
        hypnoticLine,
        syringeRemaining: {},
        ventilator: {
          mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
          fio2: 0.5, peep: 5, delivering: true, sevofluranePercent: 0,
        },
        intubated: true,
        airwayAttempts: 1,
        lastGrade: 1,
        jawThrustCpapSecondsRemaining: 0,
        onBolus: () => {},
        onInfusion: () => {},
        onHypnoticLine,
        onFluid: () => {},
        onVentilator: () => {},
        onLaryngoscopy: () => {},
        onAirwayManeuver: () => {},
        onDrugCard: () => {},
      }));
    });
    return onHypnoticLine;
  };

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('labels the persistent rate as a pump setpoint without revealing delivery status', () => {
    renderCockpit({ connected: false, inspected: false });

    expect(container.textContent).toContain('Pump set: propofol 7.0 mg/min');
    expect(container.textContent).not.toContain('Disconnected');
    expect(container.textContent).not.toContain('not reaching the patient');
  });

  it('dispatches inspection before revealing whether the line is connected', () => {
    const onHypnoticLine = renderCockpit({ connected: false, inspected: false });
    act(() => button('Infusions')!.click());

    expect(container.textContent).toContain('Delivery status has not been inspected.');
    act(() => button('Inspect propofol line')!.click());
    expect(onHypnoticLine).toHaveBeenCalledWith('inspect');
  });

  it('offers an accessible reconnect action only after a disconnected line was inspected', () => {
    const onHypnoticLine = renderCockpit({ connected: false, inspected: true });
    act(() => button('Infusions')!.click());

    const reconnect = button('Reconnect propofol line');
    expect(reconnect).toBeInstanceOf(HTMLButtonElement);
    expect(reconnect!.disabled).toBe(false);
    expect(container.textContent).toContain('The pump setpoint is not reaching the patient.');
    act(() => reconnect!.click());
    expect(onHypnoticLine).toHaveBeenCalledWith('reconnect');
  });
});
