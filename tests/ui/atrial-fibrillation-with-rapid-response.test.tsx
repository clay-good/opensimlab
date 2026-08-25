/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE as SCENARIO } from '../../src/modules/cardiology/scenarios/atrial-fibrillation-with-rapid-response';

describe('Requirement: AF with rapid response keeps rate and stroke prevention separate', () => {
  it('keeps stability, duration, rate, stroke risk, and persistent AF visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        afRvrAssessment: { stabilityAtTick: null, contextAtTick: null, rateIntentAtTick: null,
          strokePreventionAtTick: null, reassessmentAtTick: null, hemodynamicallyStable: true,
          durationCertain: false, exactScoreCalculated: false, treatmentDelivered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onAfRvrResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Treat the patient before the number.');
    expect(container.textContent).toContain('142/min irregular · stable pressure · no shock, ischemia, or acute HF');
    expect(container.textContent).toContain('Rate is one lane. Stroke prevention is another.');
    expect(container.textContent).toContain('Better can still be AF.');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile rhythm + stability'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-af-rvr-rhythm-and-stability');
    act(() => root.unmount()); container.remove();
  });
});
