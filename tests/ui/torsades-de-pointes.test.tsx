/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TORSADES_DE_POINTES as SCENARIO } from '../../src/modules/cardiology/scenarios/torsades-de-pointes';

describe('Requirement: torsades prioritizes calm unsynchronized rescue', () => {
  it('keeps pulse, shock mode, and long-QT prevention distinct without exposing treatment controls', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        torsadesAssessment: { recognitionAtTick: null, shockIntentAtTick: null,
          postShockAtTick: null, contextAtTick: null, recurrenceIntentAtTick: null,
          handoffAtTick: null, initialPulsePresent: true, shockDeliveredByLearner: false,
          treatmentDeliveredByLearner: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450,
        respiratoryRateBpm: 16, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onTorsadesResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Polymorphic means shock now.');
    expect(container.textContent).toContain('weak pulse');
    expect(container.textContent).toContain('immediate unsynchronized shock');
    expect(container.textContent).toContain('Correct. Protect. Reassess.');
    expect(container.textContent).not.toMatch(/synchronized cardioversion|\d+\s*J|\d+\s*mg|\d+\s*mA|procainamide|amiodarone|adenosine|select device|declare capture/i);
    const reconcile = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile pulse'));
    act(() => reconcile?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-torsades-pulse-and-pattern');
    act(() => root.unmount()); container.remove();
  });
});
