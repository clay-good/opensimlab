/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PACEMAKER_CAPTURE_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';

describe('Requirement: pacemaker capture failure has a focused rescue surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
    document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ recognitionAtTick: number; rescueAtTick: number;
    deviceSystemAtTick: number; causesAtTick: number; laterPanelAtTick: number;
    handoffAtTick: number }> = {}) => ({ recognitionAtTick: ticks.recognitionAtTick ?? null,
    rescueAtTick: ticks.rescueAtTick ?? null, deviceSystemAtTick: ticks.deviceSystemAtTick ?? null,
    causesAtTick: ticks.causesAtTick ?? null, laterPanelAtTick: ticks.laterPanelAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, initialPulsePresent: true as const,
    electricalCaptureFailureAuthored: true as const, pacingDeliveredByLearner: false as const,
    captureAssessedByLearner: false as const, deviceInterrogatedByLearner: false as const,
    deviceProgrammedByLearner: false as const, outputSelectedByLearner: false as const,
    leadManipulatedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    outcomePredicted: false as const });

  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pacemakerCaptureFailureAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500,
        respiratoryRateBpm: 16, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPacemakerCaptureFailureResponse: onAction, onDrugCard: () => {} };
  }

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows 2 calm cards and no programming, magnet, output, or treatment recipe', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile pulse + capture pattern').disabled).toBe(false);
    for (const label of ['Activate pacing-capable rescue', 'Review device + lead system',
      'Review reversible causes', 'Review later capture panel',
      'Hand off capture-failure plan']) expect(button(label).disabled).toBe(true);
    act(() => button('Reconcile pulse + capture pattern').click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-pacemaker-capture-failure-pulse-and-pattern');
    expect(container.textContent).toMatch(/spikes?.*(?:not followed|without).*(?:QRS|depolarization)/i);
    expect(container.textContent).toMatch(/intrinsic|escape/i);
    expect(container.textContent).toMatch(/pulse/i);
    const allControls = [...container.querySelectorAll('button')]
      .map(({ textContent }) => textContent).join(' ');
    expect(allControls).not.toMatch(/\d+\s*mA|pulse width|increase output|apply magnet|program|revise lead|interrogate|give|administer|implant|perform/i);
  });

  it('opens rescue immediately and both reviews in parallel after recognition', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10 })))));
    expect(button('Activate pacing-capable rescue').disabled).toBe(false);
    expect(button('Review device + lead system').disabled).toBe(false);
    expect(button('Review reversible causes').disabled).toBe(false);
    expect(button('Review later capture panel').disabled).toBe(true);
  });

  it('requires rescue and both reviews before later panel, then opens only handoff', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10, deviceSystemAtTick: 20, causesAtTick: 20 })))));
    expect(button('Review later capture panel').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10, rescueAtTick: 20, deviceSystemAtTick: 20,
      causesAtTick: 20 })))));
    expect(button('Review later capture panel').disabled).toBe(false);
    expect(button('Hand off capture-failure plan').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10, rescueAtTick: 20, deviceSystemAtTick: 20,
      causesAtTick: 20, laterPanelAtTick: 30 })))));
    expect(button('Review later capture panel').disabled).toBe(true);
    expect(button('Hand off capture-failure plan').disabled).toBe(false);
  });
});
