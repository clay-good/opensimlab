/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STATUS_EPILEPTICUS } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';

describe('Requirement: status epilepticus opens a focused first-line surface', () => {
  it('centers the clock, stabilization, fixed lorazepam action, and escalation boundary', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: STATUS_EPILEPTICUS, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureActivityFraction: 1,
        seizureSuppressed: false, statusEpilepticusAssessment: {
          reviewedAtTick: null, supportedAtTick: null, lorazepamAtTick: null,
          reassessedAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 480, respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onStatusEpilepticusResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Five minutes changes the name');
    expect(container.textContent).toContain('6:20 elapsed · no recovery');
    expect(container.textContent).toContain('Stabilize + check glucose');
    expect(container.textContent).toContain('Give lorazepam 4 mg IV');
    expect(container.textContent).toContain('Persistent or recurrent seizure needs prompt second-line therapy');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review seizure + clock'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-convulsive-status');
    expect(container.textContent).not.toContain('20% lipid emulsion');
    act(() => root.unmount()); container.remove();
  });
});
