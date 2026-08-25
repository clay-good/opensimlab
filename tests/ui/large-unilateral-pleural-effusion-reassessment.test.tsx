/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { LARGE_UNILATERAL_PLEURAL_EFFUSION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/large-unilateral-pleural-effusion-reassessment';

describe('large pleural effusion private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ trajectoryAtTick: number; intentAtTick: number;
    responseAtTick: number; fluidAtTick: number; evaluationAtTick: number;
    handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, intentAtTick: ticks.intentAtTick ?? null,
    responseAtTick: ticks.responseAtTick ?? null, fluidAtTick: ticks.fluidAtTick ?? null,
    evaluationAtTick: ticks.evaluationAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    initialPulsePresent: true as const, largeUnilateralEffusionAuthored: true as const,
    tensionPhysiologyAuthored: false as const, hemodynamicCompromiseAuthored: false as const,
    examinationPerformedByLearner: false as const, imagingAcquiredByLearner: false as const,
    ultrasoundPerformedByLearner: false as const, pleuralFluidAcquiredByLearner: false as const,
    fluidInterpretedByLearner: false as const, thoracentesisPerformedByLearner: false as const,
    deviceOrSiteSelected: false as const, drainageVolumeSelected: false as const,
    treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        largePleuralEffusionAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 390,
        respiratoryRateBpm: 26, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onLargePleuralEffusionResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, and explicit nonprocedural limits', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Review patient + pleural pattern').disabled).toBe(false);
    for (const label of ['Record guided sampling + relief intent',
      'Review symptom-limited checkpoint', 'Review fluid pattern + open causes',
      'Coordinate definitive evaluation', 'Hand off unresolved effusion work']) {
      expect(button(label).disabled).toBe(true);
    }
    act(() => button('Review patient + pleural pattern').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-large-unilateral-pleural-effusion-trajectory');
    expect(container.textContent).toMatch(/fluid is real.*cause is still open/i);
    expect(container.textContent).toMatch(/850 mL is a case fact, not a target/i);
  });

  it('shows the authored checkpoint and later handoff status honestly', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, intentAtTick: 20 })))));
    expect(button('Review symptom-limited checkpoint').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance to the authored checkpoint/i);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, intentAtTick: 20, responseAtTick: 30, fluidAtTick: 40,
      evaluationAtTick: 50 })))));
    expect(button('Hand off unresolved effusion work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
