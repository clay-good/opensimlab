/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NSTEMI_RISK_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/nstemi-risk-reassessment';

describe('Requirement: NSTEMI risk reassessment stays serial, calm, and region-aware', () => {
  it('keeps change, current danger, strategy, and ownership visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        nstemiRiskAssessment: { trajectoryAtTick: null, verificationAtTick: null,
          veryHighRiskAtTick: null, strategyAtTick: null, handoffAtTick: null,
          ischemicRisk: 'high', currentVeryHighRisk: false, exactScoreCalculated: false,
          procedurePerformed: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onNstemiRiskResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Risk is a moving picture.');
    expect(container.textContent).toContain('18 → 146 ng/L · ST depression → T-wave inversion · pain-free now');
    expect(container.textContent).toContain('Stable now does not erase high risk.');
    expect(container.textContent).toContain('Timing follows risk, patient, region, and system.');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile the serial trajectory'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-nstemi-serial-trajectory');
    act(() => root.unmount()); container.remove();
  });
});
