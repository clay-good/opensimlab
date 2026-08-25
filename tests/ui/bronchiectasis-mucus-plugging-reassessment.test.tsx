/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { BRONCHIECTASIS_MUCUS_PLUGGING_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/bronchiectasis-mucus-plugging-reassessment';

describe('bronchiectasis mucus private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div');
  document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (ticks: Partial<{ trajectoryAtTick: number; evidenceAtTick: number;
    clearanceIntentAtTick: number; responseAtTick: number; escalationAtTick: number;
    handoffAtTick: number }> = {}) => ({
    trajectoryAtTick: ticks.trajectoryAtTick ?? null, evidenceAtTick: ticks.evidenceAtTick ?? null,
    clearanceIntentAtTick: ticks.clearanceIntentAtTick ?? null,
    responseAtTick: ticks.responseAtTick ?? null, escalationAtTick: ticks.escalationAtTick ?? null,
    handoffAtTick: ticks.handoffAtTick ?? null, initialPulsePresent: true as const,
    spontaneouslyBreathingAuthored: true as const, artificialAirwayPresent: false as const,
    focalCollapseAuthored: true as const, mucusImpactionWorkingPatternAuthored: true as const,
    mucusPlugEtiologyProven: false as const, examinationPerformedByLearner: false as const,
    imagingAcquiredByLearner: false as const, sputumAssessedByLearner: false as const,
    airwayClearancePerformedByLearner: false as const, suctionPerformedByLearner: false as const,
    bronchoscopyPerformedByLearner: false as const, deviceOrTechniqueSelected: false as const,
    oxygenDeliveredByLearner: false as const, treatmentDeliveredByLearner: false as const,
    diagnosisDetermined: false as const, dispositionDetermined: false as const,
    outcomePredicted: false as const,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        bronchiectasisMucusPluggingAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 380,
        respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onBronchiectasisMucusPluggingResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;

  it('shows two calm cards, one initial action, and explicit nonprocedural limits', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button('Review patient + clearance trajectory').disabled).toBe(false);
    for (const label of ['Review focal evidence + alternatives',
      'Record individualized clearance trial', 'Review later patient + focal response',
      'Connect persistent-collapse evaluation', 'Hand off unresolved focal work']) {
      expect(button(label).disabled).toBe(true);
    }
    act(() => button('Review patient + clearance trajectory').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-bronchiectasis-mucus-plugging-trajectory');
    expect(container.textContent).toMatch(/image says where.*trajectory says why/i);
    expect(container.textContent).toMatch(/No technique, device, position, duration, frequency/i);
  });

  it('shows the later response and handoff gates honestly', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, evidenceAtTick: 20, clearanceIntentAtTick: 30 })))));
    expect(button('Review later patient + focal response').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance to its response/i);
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, evidenceAtTick: 20, clearanceIntentAtTick: 30,
      responseAtTick: 40, escalationAtTick: 50 })))));
    expect(button('Hand off unresolved focal work').disabled).toBe(false);
    expect(container.textContent).toMatch(/advance time before handoff/i);
  });
});
