/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/post-pulmonary-embolism-persistent-dyspnea';

describe('post-PE persistent-dyspnea private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ trajectoryAtTick: number; safetyAtTick: number;
    evidenceAtTick: number; referralAtTick: number; handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, safetyAtTick: ticks.safetyAtTick ?? null,
    evidenceAtTick: ticks.evidenceAtTick ?? null, referralAtTick: ticks.referralAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, acutePeConfirmedAuthored: true as const,
    anticoagulationDeliveredByLearner: false as const, testAcquiredByLearner: false as const,
    ctepdDiagnosed: false as const, treatmentSelected: false as const,
    procedurePerformedByLearner: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        postPeDyspneaAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPostPeDyspneaResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards with one available action and honest boundaries', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile course + symptoms').disabled).toBe(false);
    for (const label of ['Review function + current safety', 'Review evidence + open causes',
      'Coordinate expert evaluation', 'Hand off unresolved post-PE work']) {
      expect(button(label).disabled).toBe(true);
    }
    act(() => button('Reconcile course + symptoms').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-post-pe-symptoms-and-anticoagulation-course');
    expect(container.textContent).toMatch(/Recovery deserves a real comparison/i);
    expect(container.textContent).toMatch(/no single report makes a CTEPD or CTEPH diagnosis/i);
  });

  it('opens referral and explains the elapsed handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, safetyAtTick: 20, evidenceAtTick: 30 })))));
    expect(button('Coordinate expert evaluation').disabled).toBe(false);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, safetyAtTick: 20, evidenceAtTick: 30, referralAtTick: 40 })))));
    expect(button('Hand off unresolved post-PE work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
