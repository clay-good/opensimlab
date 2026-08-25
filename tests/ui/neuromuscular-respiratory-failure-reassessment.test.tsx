/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/neuromuscular-respiratory-failure-reassessment';

describe('neuromuscular respiratory-failure private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ trajectoryAtTick: number; failureAtTick: number;
    escalationAtTick: number; reviewAtTick: number; ownershipAtTick: number;
    handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, failureAtTick: ticks.failureAtTick ?? null,
    escalationAtTick: ticks.escalationAtTick ?? null, reviewAtTick: ticks.reviewAtTick ?? null,
    ownershipAtTick: ticks.ownershipAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    establishedMotorNeuronDiseaseAuthored: true as const,
    neuromuscularRespiratoryFailureAuthored: true as const,
    respiratoryMeasurementsAuthored: true as const, daytimeHypercapniaAuthored: true as const,
    examinationPerformedByLearner: false as const,
    respiratoryStrengthMeasuredByLearner: false as const,
    bloodGasAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
    imagingAcquiredByLearner: false as const, airwayAssessedByLearner: false as const,
    coughAssessedByLearner: false as const, ventilationDeliveredByLearner: false as const,
    oxygenDeliveredByLearner: false as const, supportDeviceSelectedByLearner: false as const,
    coughAssistDeliveredByLearner: false as const,
    secretionProcedurePerformedByLearner: false as const,
    airwayProcedurePerformedByLearner: false as const, patientPreferenceInferred: false as const,
    nutritionSelectedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    diagnosisDetermined: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        neuromuscularRespiratoryFailureAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 340,
        respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onNeuromuscularRespiratoryFailureResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, and explicit nonprocedural limits', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Review breathing + weakness trajectory').disabled).toBe(false);
    for (const label of ['Recognize convergent failure pattern',
      'Connect ventilation + airway-ready owners', 'Review cough + bulbar + open causes',
      'Coordinate priorities + shared owners', 'Hand off active risk + open work']) {
      expect(button(label).disabled).toBe(true);
    }
    act(() => button('Review breathing + weakness trajectory').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-neuromuscular-respiratory-failure-trajectory');
    expect(container.textContent).toMatch(/Muscle strength can fade.*saturation/i);
    expect(container.textContent).toMatch(/No FVC.*NIV.*tracheostomy/i);
  });

  it('opens urgent escalation and safety review in parallel before ownership', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, failureAtTick: 20 })))));
    expect(button('Connect ventilation + airway-ready owners').disabled).toBe(false);
    expect(button('Review cough + bulbar + open causes').disabled).toBe(false);
    expect(button('Coordinate priorities + shared owners').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ trajectoryAtTick: 10,
      failureAtTick: 20, escalationAtTick: 30, reviewAtTick: 40, ownershipAtTick: 50 })))));
    expect(button('Hand off active risk + open work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
