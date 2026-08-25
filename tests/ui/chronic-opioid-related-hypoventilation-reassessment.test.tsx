/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CHRONIC_OPIOID_RELATED_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/chronic-opioid-related-hypoventilation-reassessment';

describe('chronic opioid hypoventilation private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ trajectoryAtTick: number; evidenceAtTick: number;
    alternativesAtTick: number; coordinatedPlanAtTick: number; handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, evidenceAtTick: ticks.evidenceAtTick ?? null,
    alternativesAtTick: ticks.alternativesAtTick ?? null,
    coordinatedPlanAtTick: ticks.coordinatedPlanAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, initialPulsePresent: true as const,
    chronicOpioidExposureAuthored: true as const, spontaneouslyBreathingAuthored: true as const,
    acuteOpioidOverdoseAuthored: false as const, postoperativeRecoveryAuthored: false as const,
    sleepRelatedHypoventilationPatternAuthored: true as const, opioidCausalityProven: false as const,
    examinationPerformedByLearner: false as const, bloodGasAcquiredByLearner: false as const,
    sleepStudyAcquiredByLearner: false as const, sleepStudyInterpretedByLearner: false as const,
    drugOrDoseSelected: false as const, taperSelected: false as const,
    opioidChangedByLearner: false as const, naloxoneSelectedByLearner: false as const,
    naloxoneDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
    supportDeviceSelectedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    diagnosisDetermined: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        chronicOpioidHypoventilationAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onChronicOpioidHypoventilationResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, parallel reviews, and explicit limits', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Review exposure + sleep trajectory').disabled).toBe(false);
    for (const label of ['Review awake + sleep evidence', 'Review contributors + alternatives',
      'Connect shared safety + pain plan', 'Hand off evidence + open work']) {
      expect(button(label).disabled).toBe(true);
    }
    act(() => button('Review exposure + sleep trajectory').click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-chronic-opioid-related-hypoventilation-exposure-and-trajectory');
    expect(container.textContent).toMatch(/Daytime can look quiet.*fuller story/i);
    expect(container.textContent).toMatch(/No diagnosis.*abrupt stop.*PAP mode/i);
  });

  it('opens both evidence lanes before the shared plan and explains the handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit,
      props(assessment({ trajectoryAtTick: 10 })))));
    expect(button('Review awake + sleep evidence').disabled).toBe(false);
    expect(button('Review contributors + alternatives').disabled).toBe(false);
    expect(button('Connect shared safety + pain plan').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      evidenceAtTick: 20, alternativesAtTick: 30, coordinatedPlanAtTick: 40 })))));
    expect(button('Hand off evidence + open work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
