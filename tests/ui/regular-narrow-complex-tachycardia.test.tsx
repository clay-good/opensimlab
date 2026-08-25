/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/regular-narrow-complex-tachycardia';

describe('Requirement: stable regular narrow tachycardia opens a calm monitored pathway', () => {
  it('shows whole-patient stability and intent-only actions without dose or shock controls', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        stableNarrowTachycardiaAssessment: { stabilityAtTick: null, contextAtTick: null,
          vagalAtTick: null, vagalResponseAtTick: null, adenosineAtTick: null,
          reassessmentAtTick: null, hemodynamicallyStable: true, mechanismProven: false,
          treatmentDelivered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onStableNarrowTachycardiaResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Fast rhythm. Steady patient.');
    expect(container.textContent).toContain('Heart rate alone does not define instability.');
    expect(container.textContent).not.toMatch(/6 mg|12 mg|cardioversion intent|shock energy|carotid massage|AVNRT confirmed/);
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile rhythm + stability'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-stable-regular-narrow-tachycardia');
    act(() => root.unmount()); container.remove();
  });
});
