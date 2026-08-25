/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SPONTANEOUS_BREATHING_TRIAL as SCENARIO } from '../../src/modules/critical-care/scenarios/spontaneous-breathing-trial';

describe('Requirement: spontaneous-breathing trial opens a focused readiness and recovery surface', () => {
  it('keeps RSBI restraint, unchanged oxygen, honest failure, and extubation boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        spontaneousBreathingTrialAssessment: { readinessAtTick: null, startedAtTick: null,
          failureAtTick: null, recoveryAtTick: null, planAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'pressure-control',
        tidalVolumeMl: 420, respiratoryRateBpm: 16, fio2: 0.35, peep: 5, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onSpontaneousBreathingTrialResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Earn the trial, not a number.');
    expect(container.textContent).toContain('RSBI not required');
    expect(container.textContent).toContain('A trial can say “not yet.”');
    expect(container.textContent).toContain('Do not push through failure');
    const readiness = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review readiness without RSBI'));
    act(() => readiness?.click());
    expect(onAction).toHaveBeenCalledWith('review-sbt-readiness');
    act(() => root.unmount()); container.remove();
  });
});
