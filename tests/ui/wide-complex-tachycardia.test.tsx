/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { WIDE_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/wide-complex-tachycardia';

describe('Requirement: stable WCT opens a calm harm-aware monitored pathway', () => {
  it('shows pulse, uncertainty, and intent-only actions without unsafe controls', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        stableWideTachycardiaAssessment: { stabilityAtTick: null, contextAtTick: null,
          readinessAtTick: null, medicationAtTick: null, nonresponseAtTick: null,
          cardioversionAtTick: null, reassessmentAtTick: null, hemodynamicallyStable: true,
          mechanismProven: false, learnerTreatmentDelivered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onStableWideTachycardiaResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Wide rhythm. Steady patient.');
    expect(container.textContent).toContain('A wide rhythm is a pattern, not a final diagnosis.');
    expect(container.textContent).not.toMatch(/verapamil|diltiazem|6 mg|150 mg|J\/kg|VT confirmed|defibrillate|routine oxygen/);
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile pulse + stability'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-stable-wide-complex-tachycardia');
    act(() => root.unmount()); container.remove();
  });
});
