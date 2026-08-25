/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_SEVERE_ASTHMA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-severe-asthma';

describe('acute severe-asthma calming response surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ treatmentAtTick: number; failureAtTick: number;
    escalationAtTick: number; risksAtTick: number; handoffAtTick: number }> = {}) => ({
    treatmentAtTick: ticks.treatmentAtTick ?? null,
    failureAtTick: ticks.failureAtTick ?? null,
    escalationAtTick: ticks.escalationAtTick ?? null,
    risksAtTick: ticks.risksAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null,
    respiratoryFailureAuthored: true as const,
    medicationDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
    airwayProcedurePerformedByLearner: false as const, ventilatorSettingSelected: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        acuteSevereAsthmaAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 360,
        respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onAcuteSevereAsthmaResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows 2 focused cards and only the first safe action initially', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile treatment + trajectory').disabled).toBe(false);
    for (const label of ['Recognize respiratory failure', 'Activate critical-care help',
      'Review causes + ventilation risks', 'Hand off active respiratory failure'])
      expect(button(label).disabled).toBe(true);
    act(() => button('Reconcile treatment + trajectory').click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-acute-severe-asthma-treatment-and-trajectory');
    expect(container.textContent).toMatch(/Quieter is not always better/i);
    expect(container.textContent).toMatch(/36 to 18 breaths\/min/i);
    expect(container.textContent).toMatch(/no repeat medication|No repeat medication/i);
  });

  it('opens review only after escalation and explains the elapsed handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      treatmentAtTick: 10, failureAtTick: 20, escalationAtTick: 30 })))));
    expect(button('Review causes + ventilation risks').disabled).toBe(false);
    expect(button('Hand off active respiratory failure').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      treatmentAtTick: 10, failureAtTick: 20, escalationAtTick: 30,
      risksAtTick: 40 })))));
    expect(button('Hand off active respiratory failure').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
