/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/spontaneous-tension-pneumothorax-post-drainage-reassessment';

describe('post-drainage pneumothorax private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const assessment = (ticks: Partial<{ trajectoryAtTick: number; drainageResponseAtTick: number;
    systemAtTick: number; etiologyAtTick: number; handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null,
    drainageResponseAtTick: ticks.drainageResponseAtTick ?? null,
    systemAtTick: ticks.systemAtTick ?? null, etiologyAtTick: ticks.etiologyAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, initialPulsePresent: true as const,
    priorTensionPhysiologyAuthored: true as const, experiencedTeamDrainageAuthored: true as const,
    decompressionPerformedByLearner: false as const, chestDrainPlacedByLearner: false as const,
    drainManipulatedByLearner: false as const, suctionOrClampSelected: false as const,
    deviceOrSiteSelected: false as const, oxygenDeliveredByLearner: false as const,
    medicationDeliveredByLearner: false as const, testAcquiredByLearner: false as const,
    procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
    dispositionDetermined: false as const, recurrencePredicted: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        postTensionPneumothoraxAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 410,
        respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPostTensionPneumothoraxResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, and no procedural controls', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Reconcile tension event + prior care').disabled).toBe(false);
    for (const label of ['Review post-drainage response', 'Review drain system + complications',
      'Review causes + definitive planning', 'Hand off unresolved pleural work']) {
      expect(button(label).disabled).toBe(true);
    }
    act(() => button('Reconcile tension event + prior care').click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-spontaneous-tension-pneumothorax-trajectory-and-prior-care');
    expect(container.textContent).toMatch(/Relief is the start of the next watch/i);
    expect(container.textContent).toMatch(/No drain inspection or manipulation/i);
  });

  it('opens both parallel lanes and explains the later handoff gate', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, drainageResponseAtTick: 20 })))));
    expect(button('Review drain system + complications').disabled).toBe(false);
    expect(button('Review causes + definitive planning').disabled).toBe(false);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, drainageResponseAtTick: 20, systemAtTick: 30,
      etiologyAtTick: 30 })))));
    expect(button('Hand off unresolved pleural work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
