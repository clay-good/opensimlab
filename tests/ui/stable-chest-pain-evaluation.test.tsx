/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STABLE_CHEST_PAIN_EVALUATION as SCENARIO } from '../../src/modules/cardiology/scenarios/stable-chest-pain-evaluation';

describe('Requirement: stable chest-pain evaluation stays calm, structured, and shared', () => {
  it('keeps stability, likelihood, test value, and safety net visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        stableChestPainAssessment: { stabilityAtTick: null, patternAtTick: null,
          likelihoodAtTick: null, testingAtTick: null, safetyNetAtTick: null,
          clinicalLikelihood: 'not-very-low', exactScoreCalculated: false, testPerformed: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 14, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onStableChestPainResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Stable is a trajectory, not a synonym for safe.');
    expect(container.textContent).toContain('3 months · exertional · 6 min · resolves with rest · no recent change');
    expect(container.textContent).toContain('Estimate before you investigate.');
    expect(container.textContent).toContain('Test only when the answer can change care.');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Verify stable vs acute change'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('verify-stable-chest-pain-trajectory');
    act(() => root.unmount()); container.remove();
  });
});
