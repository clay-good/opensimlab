/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HYPERKALEMIC_CONDUCTION_DISTURBANCE as SCENARIO }
  from '../../src/modules/cardiology/scenarios/hyperkalemic-conduction-disturbance';

describe('Requirement: hyperkalemic conduction keeps reversible cause ahead of device conclusions', () => {
  it('presents serial reasoning without exposing treatment or pacing controls', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        hyperkalemicConductionAssessment: { reconciledAtTick: null,
          calciumResponseAtTick: null, shiftSurveillanceAtTick: null,
          removalDeviceAtTick: null, laterPanelAtTick: null, handoffAtTick: null,
          initialPulsePresent: true, treatmentDeliveredByLearner: false,
          pacingDelivered: false, captureAssessed: false, permanentDeviceSelected: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 440,
        respiratoryRateBpm: 16, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onHyperkalemicConductionResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('The rhythm changed. Check the chemistry.');
    expect(container.textContent).toContain('Calcium does not lower potassium');
    expect(container.textContent).toContain('Remove. Recheck. Hand off.');
    expect(container.textContent).toContain('Pacing does not treat hyperkalemia');
    expect(container.textContent).not.toMatch(/\d+\s*mg|\d+\s*mA|select device|declare capture|implant pacemaker|deliver calcium|start dialysis/i);
    const reconcile = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile rhythm'));
    act(() => reconcile?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-hyperkalemic-conduction-trajectory');
    act(() => root.unmount()); container.remove();
  });
});
