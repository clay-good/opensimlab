/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_DECOMPENSATED_HEART_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/acute-decompensated-heart-failure';

describe('Requirement: decompensated heart failure stays serial and transition-focused', () => {
  it('keeps response, tolerance, residual congestion, and ownership visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        heartFailureAssessment: { statusAtTick: null, responseAtTick: null,
          toleranceAtTick: null, transitionAtTick: null, readinessAtTick: null,
          residualCongestion: true, dischargeReady: false, doseCalculated: false,
          treatmentDelivered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onHeartFailureResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Decongestion is a trajectory.');
    expect(container.textContent).toContain('77.2 → 75.8 kg · net −1.6 L · still orthopneic');
    expect(container.textContent).toContain('A creatinine change needs context.');
    expect(container.textContent).toContain('Warm is not the same as ready.');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile congestion + perfusion'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-heart-failure-congestion-and-perfusion');
    act(() => root.unmount()); container.remove();
  });
});
