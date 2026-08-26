/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_RESPIRATORY_DISTRESS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';

describe('pediatric respiratory distress private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ recognitionAtTick: number; supportAtTick: number;
    earlyResponseAtTick: number; laterPanelAtTick: number; rescueAtTick: number;
    handoffAtTick: number; lastUnsupportedChoice: 'history-first' | 'imaging-first'
      | 'single-number' | 'falling-rate' | null }> = {}) => ({
    recognitionAtTick: ticks.recognitionAtTick ?? null, supportAtTick: ticks.supportAtTick ?? null,
    earlyResponseAtTick: ticks.earlyResponseAtTick ?? null,
    laterPanelAtTick: ticks.laterPanelAtTick ?? null, rescueAtTick: ticks.rescueAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null,
    lastUnsupportedChoice: ticks.lastUnsupportedChoice ?? null,
    initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
    hypoxemiaAuthored: true as const, pulseSignalCoherentAuthored: true as const,
    progressiveInadequateBreathingAuthored: true as const,
    experiencedSupportActivated: ticks.supportAtTick != null,
    rescueReadinessActivated: ticks.rescueAtTick != null,
    patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
    diagnosisMadeByLearner: false as const, testAcquiredByLearner: false as const,
    oxygenSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
    deviceSelectedByLearner: false as const, flowSelectedByLearner: false as const,
    fio2SelectedByLearner: false as const, oxygenTargetSelectedByLearner: false as const,
    ventilationDeliveredByLearner: false as const,
    airwayManeuverPerformedByLearner: false as const,
    intubationPerformedByLearner: false as const, drugDeliveredByLearner: false as const,
    fluidDeliveredByLearner: false as const, procedurePerformedByLearner: false as const,
    treatmentDeliveredByLearner: false as const, durableRecoveryProven: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricRespiratoryDistressAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 120,
        respiratoryRateBpm: 46, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricRespiratoryDistressResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows 2 calm cards and reveals no more than 3 choices at a time', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    act(() => button('Review the whole-child trend')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-pediatric-respiratory-distress-whole-child');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10 })))));
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(3);
    expect(button('Activate experienced pediatric help')).toBeDefined();
    expect(container.textContent).toMatch(/support cannot wait|causes stay open/i);
  });

  it('makes the single-number trap calm, then replaces it with fatigue and rescue choices', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20, earlyResponseAtTick: 30, lastUnsupportedChoice: 'single-number' })))));
    expect(container.textContent).toMatch(/better saturation does not overrule the child/i);
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(2);
    expect(button('Review the later whole-child panel')).toBeDefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20, earlyResponseAtTick: 30, laterPanelAtTick: 40,
      lastUnsupportedChoice: 'falling-rate' })))));
    expect(container.textContent).toMatch(/lower rate is not recovery/i);
    expect(button('Activate airway-capable pediatric rescue')).toBeDefined();
    expect(button('Treat RR 28 as recovery')).toBeDefined();
    act(() => root.render(createElement(ActionCockpit, props(assessment({ recognitionAtTick: 10,
      supportAtTick: 20, earlyResponseAtTick: 30, laterPanelAtTick: 40,
      rescueAtTick: 50 })))));
    expect(button('Hand off active breathing risk')).toBeDefined();
    expect([...container.querySelectorAll('.tray-grid button')]).toHaveLength(1);
    expect(container.textContent).not.toMatch(/select cannula|tube size|ml\/kg|oxygen at \d/i);
  });
});
