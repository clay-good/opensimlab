/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { BRONCHIOLITIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/bronchiolitis';

describe('bronchiolitis private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (value: Partial<{ recognitionAtTick: number; patternAtTick: number;
    supportAtTick: number; feedingHydrationAtTick: number; laterResponseAtTick: number;
    handoffAtTick: number; lastUnsupportedChoice: 'radiograph-first' | 'single-saturation'
      | 'routine-albuterol' | 'routine-antibiotic' | 'discharge-on-saturation' | null }> = {}) => ({
    recognitionAtTick: value.recognitionAtTick ?? null, patternAtTick: value.patternAtTick ?? null,
    supportAtTick: value.supportAtTick ?? null,
    feedingHydrationAtTick: value.feedingHydrationAtTick ?? null,
    laterResponseAtTick: value.laterResponseAtTick ?? null,
    handoffAtTick: value.handoffAtTick ?? null,
    lastUnsupportedChoice: value.lastUnsupportedChoice ?? null,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        bronchiolitisAssessment: value }, lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 70, respiratoryRateBpm: 58, fio2: 0.21,
        peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onBronchiolitisResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows 2 calm cards and never reveals more than 3 current choices', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    act(() => button('Review the whole-infant trajectory')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-bronchiolitis-risk-and-trajectory');
    act(() => root.render(createElement(
      ActionCockpit, props(assessment({ recognitionAtTick: 10 })),
    )));
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(3);
    expect(button('Record the supplied clinical pattern')).toBeDefined();
  });

  it('keeps treatment restraint contextual and ends in one calm handoff control', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      patternAtTick: 20, lastUnsupportedChoice: 'routine-albuterol' })))));
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(3);
    expect(button('Activate experienced supportive care')).toBeDefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      patternAtTick: 20, supportAtTick: 30, feedingHydrationAtTick: 40,
      laterResponseAtTick: 50 })))));
    expect(button('Hand off active bronchiolitis risk')).toBeDefined();
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    expect(container.textContent).not.toMatch(/\d+ ?L\/min|mL\/kg|suction depth|oxygen target/i);
  });
});
