/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';

const SCENARIO = {
  ...ROUTINE_INDUCTION,
  timeline: [{
    id: 'latent-susceptibility', type: 'malignant-hyperthermia' as const,
    atTick: 0, target: 'volatile-trigger', value: 1,
  }],
};

describe('Requirement: observable hypermetabolic crisis response controls', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'hypermetabolic-crisis';
    style.textContent = [
      readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8'),
    ].join('\n');
    document.head.appendChild(style);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.querySelector('style[data-test-styles="hypermetabolic-crisis"]')?.remove();
  });

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  function render(overrides: Partial<ActionCockpitProps> = {}) {
    const onDantrolene = vi.fn();
    const onActiveCooling = vi.fn();
    const props: ActionCockpitProps = {
      scenario: SCENARIO,
      region: UNITED_STATES,
      infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 175, dantroleneEffectFraction: 0.4,
        lastDantroleneTick: 900, activeCooling: false,
      },
      lastExposure: null,
      syringeRemaining: {},
      ventilator: {
        mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 1, peep: 5, delivering: true, sevofluranePercent: 0,
        freshGasFlowLPerMin: 10,
      },
      intubated: true,
      airwayAttempts: 1,
      lastGrade: 1,
      jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0.8,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene,
      onCallForHelp: () => {}, onAirwayDevice: () => {},
      onActiveCooling, onDrugCard: () => {},
      ...overrides,
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return { onDantrolene, onActiveCooling };
  }

  it('is scenario-gated and reports signs without naming a diagnosis', () => {
    render();
    expect(button('Crisis response')).toBeInstanceOf(HTMLButtonElement);
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('Muscle rigidity: marked.');
    expect(container.textContent).toContain('Accepted total: 175 mg IV · modeled effect active');
    expect(container.textContent?.toLowerCase()).not.toContain('malignant hyperthermia');

    render({ scenario: ROUTINE_INDUCTION });
    expect(button('Crisis response')).toBeUndefined();
  });

  it('shows both weight-based and computed dose before dispatch and permits a repeat', () => {
    const { onDantrolene } = render();
    act(() => button('Crisis response')!.click());
    act(() => button('Prepare 2.5 mg/kg IV')!.click());
    expect(onDantrolene).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Give 2.5 mg/kg IV = 170 mg?');
    act(() => button('Give dantrolene')!.click());
    expect(onDantrolene).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Accepted total: 175 mg IV');
    expect(button('Prepare 2.5 mg/kg IV')).toBeInstanceOf(HTMLButtonElement);
  });

  it('dispatches cooling from accepted status without optimistic state', () => {
    const { onActiveCooling } = render();
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('Active cooling: off.');
    act(() => button('Start active cooling')!.click());
    expect(onActiveCooling).toHaveBeenCalledWith(true);
    expect(container.textContent).toContain('Active cooling: off.');
  });

  it('shows and dispatches the engine-reported fresh gas flow range', () => {
    const onVentilator = vi.fn();
    render({ onVentilator });
    act(() => button('Airway & Vent')!.click());
    const field = container.querySelector(
      'input[type="range"][aria-valuetext="10.0 L/min"]',
    ) as HTMLInputElement | null;
    expect(field).not.toBeNull();
    expect(field!.min).toBe('0.5');
    expect(field!.max).toBe('15');
    expect(field!.step).toBe('0.5');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(field, '12.5');
      field!.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onVentilator).toHaveBeenCalledWith({ freshGasFlowLPerMin: 12.5 });
  });

  it('computes all time-critical controls to at least 44px at phone width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 780 });
    render();
    act(() => button('Crisis response')!.click());
    for (const label of ['Prepare 2.5 mg/kg IV', 'Start active cooling']) {
      expect(getComputedStyle(button(label)!).minBlockSize).toBe('44px');
    }
    act(() => button('Prepare 2.5 mg/kg IV')!.click());
    for (const label of ['Give dantrolene', 'Cancel']) {
      expect(getComputedStyle(button(label)!).minBlockSize).toBe('44px');
    }
    expect(button('Give dantrolene')!.closest('.actions__tray')).not.toBeNull();
    expect(getComputedStyle(container.querySelector('.actions__tray')!).overflow).toBe('auto');
  });
});
