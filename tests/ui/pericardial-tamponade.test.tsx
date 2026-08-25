/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PERICARDIAL_TAMPONADE as SCENARIO } from '../../src/modules/cardiology/scenarios/pericardial-tamponade';

describe('Requirement: post-drainage pericardial tamponade has a calm reassessment surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  function props(assessment: NonNullable<ActionCockpitProps['resuscitation']['pericardialTamponadeAssessment']>,
    onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, pericardialTamponadeAssessment: assessment },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420,
        respiratoryRateBpm: 22, fio2: 0.35, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onPericardialTamponadeResponse: onAction, onDrugCard: () => {} };
  }

  const button = (container: HTMLElement, label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
  const invariants = { initialPulsePresent: true as const,
    treatmentDeliveredByLearner: false as const, imageAcquiredByLearner: false as const,
    procedurePerformedByLearner: false as const, catheterManipulatedByLearner: false as const };

  it('shows only two focused cards, opens with trajectory review, and offers no procedure controls', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props({ trajectoryAtTick: null,
      drainageResponseAtTick: null, etiologyAtTick: null, surveillanceAtTick: null,
      handoffAtTick: null, ...invariants }, onAction))));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(button(container, 'Reconcile serial circulation').disabled).toBe(false);
    expect(button(container, 'Review reported drainage response').disabled).toBe(true);
    expect(button(container, 'Review etiology + contributors').disabled).toBe(true);
    expect(button(container, 'Review recurrence surveillance').disabled).toBe(true);
    expect(button(container, 'Hand off open risks').disabled).toBe(true);
    act(() => button(container, 'Reconcile serial circulation').click());
    expect(onAction).toHaveBeenCalledWith('reconcile-pericardial-tamponade-trajectory');
    expect(container.textContent).toMatch(/reported drainage|post-drainage/i);
    expect(container.textContent).toMatch(/imaging skill|image acquisition/i);
    expect(container.textContent).toMatch(/procedural skill|drainage route/i);
    expect([...container.querySelectorAll('button')].map((entry) => entry.textContent).join(' '))
      .not.toMatch(/perform pericardiocentesis|place|advance|withdraw|flush|aspirate|acquire (?:pocus|echo)|drain \d/i);
  });

  it('unlocks etiology and surveillance in parallel but keeps handoff closed', () => {
    act(() => root.render(createElement(ActionCockpit, props({ trajectoryAtTick: 10,
      drainageResponseAtTick: 20, etiologyAtTick: null, surveillanceAtTick: null,
      handoffAtTick: null, ...invariants }))));
    expect(button(container, 'Reconcile serial circulation').disabled).toBe(true);
    expect(button(container, 'Review reported drainage response').disabled).toBe(true);
    expect(button(container, 'Review etiology + contributors').disabled).toBe(false);
    expect(button(container, 'Review recurrence surveillance').disabled).toBe(false);
    expect(button(container, 'Hand off open risks').disabled).toBe(true);
  });
});
