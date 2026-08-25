/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HYPERTENSIVE_EMERGENCY as SCENARIO } from '../../src/modules/cardiology/scenarios/hypertensive-emergency';

describe('Requirement: hypertensive emergency has a calm intent-only surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
    document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ measurementAtTick: number; organInjuryAtTick: number;
    phenotypeAtTick: number; reductionIntentAtTick: number; laterPanelAtTick: number;
    handoffAtTick: number }> = {}) => ({ measurementAtTick: ticks.measurementAtTick ?? null,
    organInjuryAtTick: ticks.organInjuryAtTick ?? null,
    phenotypeAtTick: ticks.phenotypeAtTick ?? null,
    reductionIntentAtTick: ticks.reductionIntentAtTick ?? null,
    laterPanelAtTick: ticks.laterPanelAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    initialPulsePresent: true as const, acuteTargetOrganDamage: true as const,
    treatmentDeliveredByLearner: false as const, drugSelected: false as const,
    doseSelected: false as const, infusionRateSelected: false as const,
    universalTargetSelected: false as const, rapidNormalizationSelected: false as const,
    testAcquiredByLearner: false as const, procedurePerformed: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        hypertensiveEmergencyAssessment: value }, lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 16,
        fio2: 0.21, peep: 5, delivering: false, sevofluranePercent: 0,
        freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onHypertensiveEmergencyResponse: onAction,
      onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two focused cards, progressive gates, and no treatment recipe or procedure control', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile pressure trajectory').disabled).toBe(false);
    for (const label of ['Review acute organ injury', 'Review phenotype + causes',
      'Record controlled-reduction intent', 'Review later organ panel',
      'Hand off causes + owners']) expect(button(label).disabled).toBe(true);
    act(() => button('Reconcile pressure trajectory').click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-hypertensive-emergency-measurement-and-trajectory');
    expect(container.textContent).toContain('Pressure magnitude alone does not distinguish emergency');
    expect(container.textContent).toContain('No agent, dose, infusion, numeric goal');
    expect([...container.querySelectorAll('button')].map(({ textContent }) => textContent).join(' '))
      .not.toMatch(/labetalol|nicardipine|clevidipine|nitro|furosemide|give|administer|\d+\s*(?:mg|mcg|mL|%|mmHg)|infuse|place|perform/i);
  });

  it('opens phenotype and reduction in parallel, then the two reassessment controls in order', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      measurementAtTick: 10, organInjuryAtTick: 20 })))));
    expect(button('Review phenotype + causes').disabled).toBe(false);
    expect(button('Record controlled-reduction intent').disabled).toBe(false);
    expect(button('Review later organ panel').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      measurementAtTick: 10, organInjuryAtTick: 20, phenotypeAtTick: 30,
      reductionIntentAtTick: 30 })))));
    expect(button('Review later organ panel').disabled).toBe(false);
    expect(button('Hand off causes + owners').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      measurementAtTick: 10, organInjuryAtTick: 20, phenotypeAtTick: 30,
      reductionIntentAtTick: 30, laterPanelAtTick: 40 })))));
    expect(button('Review later organ panel').disabled).toBe(true);
    expect(button('Hand off causes + owners').disabled).toBe(false);
  });
});
