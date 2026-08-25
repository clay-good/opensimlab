/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-pulmonary-edema-respiratory-support-reassessment';

describe('pulmonary edema support private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ trajectoryAtTick: number; failureAtTick: number;
    wholePatientAtTick: number; escalationAtTick: number; handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, failureAtTick: ticks.failureAtTick ?? null,
    wholePatientAtTick: ticks.wholePatientAtTick ?? null,
    escalationAtTick: ticks.escalationAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    pulmonaryEdemaAuthored: true as const, supportAlreadyActiveAuthored: true as const,
    oxygenDeliveredByLearner: false as const, nivStartedByLearner: false as const,
    supportSettingSelected: false as const, medicationDeliveredByLearner: false as const,
    testAcquiredByLearner: false as const, airwayProcedurePerformedByLearner: false as const,
    treatmentDeliveredByLearner: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        apeSupportAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'pressure-control', tidalVolumeMl: 330,
        respiratoryRateBpm: 12, fio2: 0.6, peep: 8, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 15 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onApeSupportResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one available action, and honest boundaries', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile initial care + trajectory').disabled).toBe(false);
    for (const label of ['Review progressive respiratory failure',
      'Review perfusion + congestion + causes', 'Activate airway-capable escalation',
      'Hand off active respiratory failure']) expect(button(label).disabled).toBe(true);
    act(() => button('Reconcile initial care + trajectory').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-ape-initial-care-and-trajectory');
    expect(container.textContent).toMatch(/A quieter breath can be the warning/i);
    expect(container.textContent).toMatch(/not improvement or a universal threshold/i);
  });

  it('opens escalation and explains the elapsed handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      failureAtTick: 20, wholePatientAtTick: 30 })))));
    expect(button('Activate airway-capable escalation').disabled).toBe(false);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      failureAtTick: 20, wholePatientAtTick: 30, escalationAtTick: 40 })))));
    expect(button('Hand off active respiratory failure').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
