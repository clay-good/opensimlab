/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT as SCENARIO }
  from '../../src/modules/cardiology/scenarios/symptomatic-sinus-bradycardia-reassessment';

describe('Requirement: stable symptomatic bradycardia opens a calm longitudinal review', () => {
  it('centers correlation and shared planning without acute rescue or threshold claims', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        symptomaticBradycardiaAssessment: { stabilityAtTick: null, contextAtTick: null,
          correlationAtTick: null, pacingEvaluationAtTick: null, handoffAtTick: null,
          hemodynamicallyStable: true, mechanismProven: false, treatmentDelivered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onSymptomaticBradycardiaResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Slow rhythm. Match the symptom.');
    expect(container.textContent).toContain('Review causes. Plan together.');
    expect(container.textContent).not.toMatch(/atropine|oxygen|implant|heart rate (?:of|below) \d|pause (?:of|over) \d|mg IV/i);
    const reconcile = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile rate + stability'));
    act(() => reconcile?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-symptomatic-bradycardia-stability');
    act(() => root.unmount()); container.remove();
  });
});
