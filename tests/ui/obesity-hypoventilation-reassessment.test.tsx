/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OBESITY_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/obesity-hypoventilation-reassessment';

describe('obesity hypoventilation private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ phenotypeAtTick: number; awakeEvidenceAtTick: number;
    sleepEvidenceAtTick: number; recognitionAtTick: number; coordinatedPlanAtTick: number;
    handoffAtTick: number }> = {}) => ({
    phenotypeAtTick: ticks.phenotypeAtTick ?? null,
    awakeEvidenceAtTick: ticks.awakeEvidenceAtTick ?? null,
    sleepEvidenceAtTick: ticks.sleepEvidenceAtTick ?? null,
    recognitionAtTick: ticks.recognitionAtTick ?? null,
    coordinatedPlanAtTick: ticks.coordinatedPlanAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    obesityAuthored: true as const, daytimeHypercapniaAuthored: true as const,
    sleepDisorderedBreathingAuthored: true as const, acuteRespiratoryFailureAuthored: false as const,
    examinationPerformedByLearner: false as const, bmiCalculatedByLearner: false as const,
    serumBicarbonateAcquiredByLearner: false as const, bloodGasAcquiredByLearner: false as const,
    sleepStudyAcquiredByLearner: false as const, sleepStudyScoredByLearner: false as const,
    sleepStudyInterpretedByLearner: false as const, testInterpretedByLearner: false as const,
    otherCausesExcludedByLearner: false as const, diagnosisDeterminedByLearner: false as const,
    obesityCausalityProven: false as const, oxygenSelectedByLearner: false as const,
    supportDeviceSelectedByLearner: false as const, deviceOperatedByLearner: false as const,
    drugSelectedByLearner: false as const, weightInterventionSelectedByLearner: false as const,
    treatmentDeliveredByLearner: false as const, patientPreferenceInferred: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        obesityHypoventilationAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onObesityHypoventilationResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, and explicit non-treatment limits', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Review symptoms + daytime state').disabled).toBe(false);
    for (const label of ['Review awake CO₂ + bicarbonate', 'Review sleep evidence + open causes',
      'Recognize convergent OHS pattern', 'Connect respiratory + sleep + weight-health owners',
      'Hand off evidence + open work']) expect(button(label).disabled).toBe(true);
    act(() => button('Review symptoms + daytime state').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-obesity-hypoventilation-phenotype-and-trajectory');
    expect(container.textContent).toMatch(/Awake carbon dioxide completes the sleep story/i);
    expect(container.textContent).toMatch(/No PAP.*weight intervention.*outcome/i);
  });

  it('opens awake and sleep evidence in parallel before recognition and ownership', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ phenotypeAtTick: 10 })) )));
    expect(button('Review awake CO₂ + bicarbonate').disabled).toBe(false);
    expect(button('Review sleep evidence + open causes').disabled).toBe(false);
    expect(button('Recognize convergent OHS pattern').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ phenotypeAtTick: 10,
      awakeEvidenceAtTick: 20, sleepEvidenceAtTick: 30, recognitionAtTick: 40,
      coordinatedPlanAtTick: 50 })) )));
    expect(button('Hand off evidence + open work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
