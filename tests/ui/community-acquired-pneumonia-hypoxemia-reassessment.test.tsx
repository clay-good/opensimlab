/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/community-acquired-pneumonia-hypoxemia-reassessment';

describe('hypoxemic pneumonia private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ supportAtTick: number; evidenceAtTick: number;
    severityAtTick: number; treatmentIntentAtTick: number; handoffAtTick: number }> = {}) => ({
    supportAtTick: ticks.supportAtTick ?? null, evidenceAtTick: ticks.evidenceAtTick ?? null,
    severityAtTick: ticks.severityAtTick ?? null,
    treatmentIntentAtTick: ticks.treatmentIntentAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null,
    hypoxemiaAuthored: true as const, pneumoniaPatternAuthored: true as const,
    oxygenDeliveredByLearner: false as const, supportDeviceSelected: false as const,
    antimicrobialSelected: false as const, testAcquiredByLearner: false as const,
    dispositionDetermined: false as const, outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        capHypoxemiaAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 32, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onCapHypoxemiaResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, and honest boundaries', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Corroborate hypoxemia + whole patient').disabled).toBe(false);
    for (const label of ['Review pneumonia pattern + alternatives',
      'Review severity + activate help', 'Record treatment + indicated tests',
      'Reassess + hand off active care']) expect(button(label).disabled).toBe(true);
    act(() => button('Corroborate hypoxemia + whole patient').click());
    expect(onAction).toHaveBeenCalledWith('corroborate-and-support-cap-hypoxemia');
    expect(container.textContent).toMatch(/Low oxygen, clear next steps/i);
    expect(container.textContent).toMatch(/do not automatically choose/i);
    expect(container.textContent).toMatch(/No antibiotic, dose, oxygen device/i);
  });

  it('opens treatment ownership and explains the elapsed handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      supportAtTick: 10, evidenceAtTick: 20, severityAtTick: 30 })))));
    expect(button('Record treatment + indicated tests').disabled).toBe(false);
    expect(button('Reassess + hand off active care').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      supportAtTick: 10, evidenceAtTick: 20, severityAtTick: 30,
      treatmentIntentAtTick: 40 })))));
    expect(button('Reassess + hand off active care').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
