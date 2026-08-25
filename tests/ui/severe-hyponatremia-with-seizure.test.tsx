/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';

describe('Requirement: severe hyponatremia opens a focused symptom-led rescue surface', () => {
  it('keeps the small early target, correction ceiling, urine signal, and cause plan visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        hyponatremiaAssessment: { patternReviewedAtTick: null, stabilizedAtTick: null,
          hypertonicAtTick: null, reassessedAtTick: null, guardrailsAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 470, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onHyponatremiaResponse: onAction, onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Treat the brain, not the number.');
    expect(container.textContent).toContain('Seizure ended · Na 112 · deeply somnolent');
    expect(container.textContent).toContain('Aim small. Guard the next 24 hours.');
    expect(container.textContent).toContain('Record hypertonic bolus + 5 target');
    expect(container.textContent).toContain('caps total rise at 10 mmol/L in the first 24 hours');
    expect(container.textContent).not.toContain('tenecteplase');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review seizure + Na + exclusions'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-hyponatremia-pattern');
    act(() => root.unmount()); container.remove();
  });
});
