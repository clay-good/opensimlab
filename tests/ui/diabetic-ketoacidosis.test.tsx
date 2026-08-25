/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';

describe('Requirement: DKA opens a focused potassium-gated clearance surface', () => {
  it('centers the triad, potassium gate, dextrose continuation, and real resolution criteria', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        diabeticKetoacidosisAssessment: { presentationReviewedAtTick: null, fluidsAtTick: null,
          potassiumAtTick: null, insulinAtTick: null, dextroseAtTick: null,
          transitionAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 560, respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDiabeticKetoacidosisResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Three signals name the crisis.');
    expect(container.textContent).toContain('486 · β-OHB 5.4 · pH 7.16');
    expect(container.textContent).toContain('Replace K + recheck before insulin');
    expect(container.textContent).toContain('Add dextrose + continue insulin');
    expect(container.textContent).toContain('not anion gap or urine ketones alone');
    expect(container.textContent).not.toContain('tenecteplase');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review DKA triad + cause'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-dka-presentation');
    act(() => root.unmount()); container.remove();
  });
});
