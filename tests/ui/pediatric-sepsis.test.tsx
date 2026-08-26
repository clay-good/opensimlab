/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_SEPSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';

describe('pediatric sepsis private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (value: Partial<{ patternAtTick: number; shockBoundaryAtTick: number;
    careAtTick: number; sourceReviewAtTick: number; laterResponseAtTick: number;
    handoffAtTick: number }> = {}) => ({
    patternAtTick: value.patternAtTick ?? null,
    shockBoundaryAtTick: value.shockBoundaryAtTick ?? null,
    careAtTick: value.careAtTick ?? null,
    sourceReviewAtTick: value.sourceReviewAtTick ?? null,
    laterResponseAtTick: value.laterResponseAtTick ?? null,
    handoffAtTick: value.handoffAtTick ?? null,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricSepsisAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 140,
        respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricSepsisResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows 2 calm cards with exactly one clear current action', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    act(() => button('Review infection + organ dysfunction')?.click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-pediatric-sepsis-infection-and-organ-dysfunction');
    act(() => root.render(createElement(ActionCockpit,
      props(assessment({ patternAtTick: 10 })))));
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    expect(button('Separate sepsis from shock')).toBeDefined();
  });

  it('keeps recipes and unsafe distractors off-screen through handoff', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      patternAtTick: 10, shockBoundaryAtTick: 20, careAtTick: 30,
      sourceReviewAtTick: 40, laterResponseAtTick: 50 })))));
    expect(button('Hand off active sepsis risk')).toBeDefined();
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    expect(container.textContent).toContain('No cardiovascular Phoenix points are authored now');
    expect([...container.querySelectorAll('.tray-grid button')].map(({ textContent }) => textContent)
      .join(' ')).not.toMatch(/ceftriaxone|vancomycin|bolus|norepinephrine|discharge/i);
    expect(container.textContent).not.toMatch(/mg\/kg|mcg\/kg|mL\/h|tube size|PEEP \d/i);
  });
});
