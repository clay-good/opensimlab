/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { RIGHT_VENTRICULAR_INFARCTION as SCENARIO } from '../../src/modules/cardiology/scenarios/right-ventricular-infarction';

describe('Requirement: right-ventricular infarction has a calm focused surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ reconciledAtTick: number; phenotypeAtTick: number;
    supportAtTick: number; reperfusionAtTick: number; handoffAtTick: number }> = {}) => ({
    reconciledAtTick: ticks.reconciledAtTick ?? null, phenotypeAtTick: ticks.phenotypeAtTick ?? null,
    supportAtTick: ticks.supportAtTick ?? null, reperfusionAtTick: ticks.reperfusionAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, initialPulsePresent: true as const,
    treatmentDeliveredByLearner: false as const, medicationDeliveredByLearner: false as const,
    reperfusionPerformedByLearner: false as const, deviceSelected: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, rightVentricularInfarctionAssessment: value },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onRightVentricularInfarctionResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two focused cards, opens in order, and offers no treatment or procedure control', () => {
    const onAction = vi.fn(); act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile RV trajectory').disabled).toBe(false);
    expect(button('Review RV phenotype + harms').disabled).toBe(true);
    expect(button('Record cautious support intent').disabled).toBe(true);
    expect(button('Keep reperfusion moving').disabled).toBe(true);
    expect(button('Hand off later trajectory').disabled).toBe(true);
    act(() => button('Reconcile RV trajectory').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-right-ventricular-infarction');
    expect(container.textContent).toContain('not acquired skills');
    expect(container.textContent).toContain('no nitrate or reflex diuretic is selected');
    expect(container.textContent).toContain('no universal prohibition is taught');
    expect([...container.querySelectorAll('button')].map((entry) => entry.textContent).join(' '))
      .not.toMatch(/nitro|nitrate|furosemide|diuretic|give|administer|\d+\s*(?:mL|L|mg|mcg)|perform PCI|acquire (?:ECG|echo)|place|device/i);
  });

  it('keeps reperfusion open before phenotype review and support gated until after it', () => {
    act(() => root.render(createElement(ActionCockpit,
      props(assessment({ reconciledAtTick: 10 })))));
    expect(button('Review RV phenotype + harms').disabled).toBe(false);
    expect(button('Record cautious support intent').disabled).toBe(true);
    expect(button('Keep reperfusion moving').disabled).toBe(false);
    expect(button('Hand off later trajectory').disabled).toBe(true);

    act(() => root.render(createElement(ActionCockpit,
      props(assessment({ reconciledAtTick: 10, phenotypeAtTick: 20 })))));
    expect(button('Review RV phenotype + harms').disabled).toBe(true);
    expect(button('Record cautious support intent').disabled).toBe(false);
    expect(button('Keep reperfusion moving').disabled).toBe(false);
    expect(button('Hand off later trajectory').disabled).toBe(true);
  });
});
