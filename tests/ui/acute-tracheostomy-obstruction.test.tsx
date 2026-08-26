/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';

describe('acute tracheostomy obstruction private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ recognitionAtTick: number; supportAtTick: number;
    devicePathwayAtTick: number; innerCannulaAtTick: number; restorationAtTick: number;
    handoffAtTick: number; lastUnsupportedChoice: 'imaging' | 'unverified-ventilation'
      | 'force-catheter' | 'whole-tube' | null }> = {}) => ({
    recognitionAtTick: ticks.recognitionAtTick ?? null, supportAtTick: ticks.supportAtTick ?? null,
    devicePathwayAtTick: ticks.devicePathwayAtTick ?? null,
    innerCannulaAtTick: ticks.innerCannulaAtTick ?? null,
    restorationAtTick: ticks.restorationAtTick ?? null, handoffAtTick: ticks.handoffAtTick ?? null,
    lastUnsupportedChoice: ticks.lastUnsupportedChoice ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    tracheostomyPresentAuthored: true as const, laryngectomyAuthored: false as const,
    patentUpperAirwayAuthored: true as const, matureStomaAuthored: true as const,
    removableInnerCannulaAuthored: true as const,
    innerCannulaObstructionAuthored: ticks.devicePathwayAtTick != null,
    dualRouteOxygenIntentRecorded: ticks.supportAtTick != null,
    expertDevicePathwayRecorded: ticks.innerCannulaAtTick != null,
    patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
    deviceInspectedByLearner: false as const, catheterPassedByLearner: false as const,
    suctionPerformedByLearner: false as const, innerCannulaHandledByLearner: false as const,
    tracheostomyTubeHandledByLearner: false as const, cuffChangedByLearner: false as const,
    oxygenSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
    ventilationDeliveredByLearner: false as const, intubationPerformedByLearner: false as const,
    procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    durablePatencyProven: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        acuteTracheostomyObstructionAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450,
        respiratoryRateBpm: 34, fio2: 0.4, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onAcuteTracheostomyObstructionResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows two calm cards and progressively prioritizes anatomy, support, then device review', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    act(() => button('Review person + airway map')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-acute-tracheostomy-obstruction-anatomy-and-patency');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10 })))));
    expect(['Call airway help + support both routes', 'Wait for imaging',
      'Ventilate through the tube now'].map((label) => button(label)?.disabled))
      .toEqual([false, false, false]);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(3);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20 })))));
    expect(button('Review declared device pathway')).toBeDefined();
    expect(container.textContent).toMatch(/does not generalize to laryngectomy/i);
  });

  it('keeps qualified correction bounded and gives calm nonmutating feedback', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20, devicePathwayAtTick: 30, lastUnsupportedChoice: 'force-catheter' })))));
    expect(container.textContent).toMatch(/never force past resistance/i);
    expect(['Connect qualified inner-cannula action', 'Force the catheter through',
      'Replace the whole tube first'].map((label) => button(label)?.disabled))
      .toEqual([false, false, false]);
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20, devicePathwayAtTick: 30, innerCannulaAtTick: 40 })))));
    expect(button('Review 2-minute response')).toBeDefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20, devicePathwayAtTick: 30, innerCannulaAtTick: 40,
      restorationAtTick: 50 })))));
    expect(button('Hand off active airway risk')).toBeDefined();
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    expect(container.textContent).toMatch(/does not inspect, handle, remove, suction, exchange/i);
    expect(container.textContent).not.toMatch(/catheter size|suction pressure|tube depth/i);
  });
});
