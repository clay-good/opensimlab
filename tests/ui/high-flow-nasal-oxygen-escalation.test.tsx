/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HIGH_FLOW_NASAL_OXYGEN_ESCALATION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/high-flow-nasal-oxygen-escalation';

describe('high-flow nasal oxygen private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ trajectoryAtTick: number; suitabilityAtTick: number;
    selectionAtTick: number; responseAtTick: number; guardsAtTick: number; handoffAtTick: number;
    lastUnsupportedChoice: 'conventional' | 'bilevel' | 'resolved' | 'reduced-monitoring' | null }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, suitabilityAtTick: ticks.suitabilityAtTick ?? null,
    selectionAtTick: ticks.selectionAtTick ?? null, responseAtTick: ticks.responseAtTick ?? null,
    guardsAtTick: ticks.guardsAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    lastUnsupportedChoice: ticks.lastUnsupportedChoice ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    acuteHypoxemicRespiratoryFailureAuthored: true as const,
    acuteHypercapnicAcidosisAuthored: false as const,
    conventionalOxygenFunctionAuthored: true as const, immediateAirwayFailureAuthored: false as const,
    highFlowTrialIntentRecorded: ticks.selectionAtTick != null, patientExaminedByLearner: false as const,
    bloodGasAcquiredByLearner: false as const, bloodGasInterpretedByLearner: false as const,
    imagingAcquiredByLearner: false as const, deviceInspectedByLearner: false as const,
    deviceSelectedByLearner: false as const, cannulaSelectedByLearner: false as const,
    flowSelectedByLearner: false as const, fio2SelectedByLearner: false as const,
    oxygenTargetSelectedByLearner: false as const, deviceOperatedByLearner: false as const,
    oxygenDeliveredByLearner: false as const, treatmentDeliveredByLearner: false as const,
    intubationPerformedByLearner: false as const, durableSuccessProven: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        highFlowOxygenEscalationAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 390,
        respiratoryRateBpm: 34, fio2: 0.5, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onHighFlowOxygenEscalationResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('progressively reveals one setup action and then exactly three support choices', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    act(() => button('Review oxygen + work trend')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-high-flow-oxygen-conventional-support-trajectory');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10 })) )));
    expect(button('Review suitability + rescue')).toBeDefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20 })) )));
    expect(['High-flow nasal oxygen', 'Continue reservoir mask', 'Bilevel NIV']
      .map((label) => button(label)?.disabled)).toEqual([false, false, false]);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(3);
    expect(container.textContent).toMatch(/No source.*device.*flow.*FiO₂.*treatment technique/i);
  });

  it('shows calm feedback and reveals continuation choices only after response', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20, lastUnsupportedChoice: 'bilevel' })) )));
    expect(container.textContent).toMatch(/NIV can fit selected hypoxemia/i);
    expect(button('Review 30-minute response')).toBeUndefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20, selectionAtTick: 30, responseAtTick: 40,
      lastUnsupportedChoice: 'resolved' })) )));
    expect(container.textContent).toMatch(/Early improvement is partial/i);
    expect(['Continue + watch triggers', 'Mark respiratory failure resolved',
      'Reduce monitoring now'].map((label) => button(label)?.disabled)).toEqual([false, false, false]);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      suitabilityAtTick: 20, selectionAtTick: 30, responseAtTick: 40,
      guardsAtTick: 50 })) )));
    expect(button('Hand off active support + rescue plan')).toBeDefined();
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    expect(container.textContent).toMatch(/HFNO must not delay escalation/i);
  });
});
