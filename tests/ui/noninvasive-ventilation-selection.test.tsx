/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NONINVASIVE_VENTILATION_SELECTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/noninvasive-ventilation-selection';

describe('noninvasive ventilation selection private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ trajectoryAtTick: number; suitabilityAtTick: number;
    selectionAtTick: number; responseAtTick: number; failureGuardsAtTick: number;
    handoffAtTick: number; lastUnsupportedChoice: 'cpap' | 'high-flow' | null }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null,
    suitabilityAtTick: ticks.suitabilityAtTick ?? null,
    selectionAtTick: ticks.selectionAtTick ?? null,
    responseAtTick: ticks.responseAtTick ?? null,
    failureGuardsAtTick: ticks.failureGuardsAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null,
    lastUnsupportedChoice: ticks.lastUnsupportedChoice ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    copdExacerbationAuthored: true as const, acuteHypercapnicAcidosisAuthored: true as const,
    standardInitialTherapyAuthored: true as const, immediateDeteriorationAuthored: false as const,
    airwayProtectionFailureAuthored: false as const, hemodynamicInstabilityAuthored: false as const,
    bilevelNivSelectedByLearner: ticks.selectionAtTick != null,
    patientExaminedByLearner: false as const, bloodGasAcquiredByLearner: false as const,
    bloodGasInterpretedByLearner: false as const, imagingAcquiredByLearner: false as const,
    oxygenSelectedByLearner: false as const, interfaceSelectedByLearner: false as const,
    pressureSelectedByLearner: false as const, backupRateSelectedByLearner: false as const,
    deviceOperatedByLearner: false as const, ventilationDeliveredByLearner: false as const,
    drugSelectedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    intubationPerformedByLearner: false as const, durableNivSuccessProven: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        noninvasiveVentilationSelectionAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 360,
        respiratoryRateBpm: 30, fio2: 0.28, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onNoninvasiveVentilationSelectionResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('keeps the first card minimal, then reveals exactly three support choices', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Review initial care + trajectory')?.disabled).toBe(false);
    expect(button('Review acidosis + NIV suitability')?.disabled).toBe(true);
    expect(button('Bilevel NIV trial')).toBeUndefined();
    act(() => button('Review initial care + trajectory')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-noninvasive-ventilation-selection-treatment-and-trajectory');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20 }), onAction))));
    expect(button('Review initial care + trajectory')).toBeUndefined();
    expect(['Bilevel NIV trial', 'CPAP alone', 'High-flow nasal oxygen']
      .map((label) => button(label)?.disabled)).toEqual([false, false, false]);
    expect(container.textContent).toMatch(/No device.*interface.*pressure.*treatment technique/i);
  });

  it('shows calm choice feedback and keeps later reassessment gated', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20, lastUnsupportedChoice: 'cpap' })) )));
    expect(container.textContent).toMatch(/CPAP alone does not provide.*ventilatory assistance/i);
    expect(button('Review 1-hour whole-patient response')?.disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20, selectionAtTick: 30, responseAtTick: 40,
      failureGuardsAtTick: 50 })) )));
    expect(button('Bilevel NIV trial')).toBeUndefined();
    expect(button('Continue trial + preserve rescue triggers')?.disabled).toBe(true);
    expect(button('Hand off active support + rescue plan')?.disabled).toBe(false);
    expect(container.textContent).toMatch(/Early improvement is not durable success/i);
  });
});
