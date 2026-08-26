/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';

describe('pediatric dehydration private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    rehydrationAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function props(step = 0, onAction = vi.fn(), state = assessment(step)): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricDehydrationAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 84,
        respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricDehydrationResponse: onAction, onDrugCard: () => {} };
  }

  it('shows two calm named cards and only the intended actions at each state', () => {
    const labels = ['Review losses + whole child', 'Recognize dehydration + hypovolemia',
      'Activate qualified rehydration', 'Review losses + safety',
      'Review the 60-minute report', 'Hand off active rehydration risk'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, props(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-dehydration-pattern-title', 'pediatric-dehydration-response-title']);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 2, 1, 1, 1, 0][step]!);
      if (step !== 2 && step < labels.length) {
        expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      } else if (step === 2) {
        expect(buttons.map(({ textContent }) => textContent?.trim())).toEqual([
          'Activate qualified rehydration', 'Review losses + safety']);
      }
    }
  });

  it('keeps calculations, fluid recipes, routes, and discharge shortcuts off-screen', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(2, onAction))));
    const action = [...container.querySelectorAll('button')]
      .find(({ textContent }) => textContent?.includes('Activate qualified rehydration'));
    act(() => (action as HTMLButtonElement).click());
    expect(onAction).toHaveBeenCalledWith(
      'activate-pediatric-dehydration-qualified-rehydration-ownership');
    expect(container.textContent).toContain('This lab exposes no percentage, deficit, maintenance');
    expect(container.textContent).not.toMatch(/mL\/kg|mL\/h|0\.9%|intravenous|nasogastric|bolus|discharge now/i);
  });

  it('renders either parallel lane independently without exposing the later report early', () => {
    for (const [state, remaining, status] of [
      [{ ...assessment(2), rehydrationAtTick: 3 }, 'Review losses + safety',
        'Rehydration is active · review losses and safety'],
      [{ ...assessment(2), safetyAtTick: 3 }, 'Activate qualified rehydration',
        'Safety review is active · activate rehydration ownership'],
    ] as const) {
      act(() => root.render(createElement(ActionCockpit, props(2, vi.fn(), state))));
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent?.trim()).toBe(remaining);
      expect(container.textContent).toContain(status);
      expect(container.textContent).not.toContain('Review the 60-minute report');
    }
  });
});
