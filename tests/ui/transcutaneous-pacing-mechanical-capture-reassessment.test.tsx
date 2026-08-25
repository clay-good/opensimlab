/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/transcutaneous-pacing-mechanical-capture-reassessment';

describe('Requirement: electrical pacing capture never substitutes for a pulse', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
    document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ recognitionAtTick: number;
    pulselessResponseAtTick: number; causesBridgeAtTick: number;
    handoffAtTick: number }> = {}) => ({ recognitionAtTick: ticks.recognitionAtTick ?? null,
    pulselessResponseAtTick: ticks.pulselessResponseAtTick ?? null,
    causesBridgeAtTick: ticks.causesBridgeAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, initialPulsePresent: false as const,
    electricalCaptureAuthored: true as const, mechanicalCaptureAbsent: true as const,
    nonshockableArrestPathwayActivated: ticks.pulselessResponseAtTick != null,
    pacingDeliveredByLearner: false as const, captureAssessedByLearner: false as const,
    cprDeliveredByLearner: false as const, roscReported: false as const,
    procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    outcomePredicted: false as const });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        transcutaneousPacingCaptureAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500,
        respiratoryRateBpm: 0, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onTranscutaneousPacingCaptureResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows a calm 2-card pulseless-response surface without treatment controls', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile electrical + mechanical capture').disabled).toBe(false);
    for (const label of ['Activate pulseless response', 'Review open causes + bridge',
      'Hand off active resuscitation']) expect(button(label).disabled).toBe(true);
    act(() => button('Reconcile electrical + mechanical capture').click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture');
    expect(container.textContent).toMatch(/paced QRS|electrical capture/i);
    expect(container.textContent).toMatch(/no pulse|pulseless/i);
    expect(container.textContent).toMatch(/pleth|arterial/i);
    expect(container.textContent).toMatch(/PEA|pulseless electrical activity/i);
    expect(container.textContent).toMatch(/no invented ROSC|ROSC.*(?:unreported|unknown)/i);
    expect([...container.querySelectorAll('button')].map(({ textContent }) => textContent).join(' '))
      .not.toMatch(/\d+\s*mA|pulse width|set rate|increase current|sedat|give|administer|place wire|perform|declare capture|declare ROSC/i);
  });

  it('opens only pulseless response after recognition, then causes and later handoff', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10 })))));
    expect(button('Activate pulseless response').disabled).toBe(false);
    expect(button('Review open causes + bridge').disabled).toBe(true);
    expect(button('Hand off active resuscitation').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10, pulselessResponseAtTick: 20 })))));
    expect(button('Activate pulseless response').disabled).toBe(true);
    expect(button('Review open causes + bridge').disabled).toBe(false);
    expect(button('Hand off active resuscitation').disabled).toBe(true);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      recognitionAtTick: 10, pulselessResponseAtTick: 20,
      causesBridgeAtTick: 30 })))));
    expect(button('Review open causes + bridge').disabled).toBe(true);
    expect(button('Hand off active resuscitation').disabled).toBe(false);
  });
});
