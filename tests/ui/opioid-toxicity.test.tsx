/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OPIOID_TOXICITY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/opioid-toxicity';

describe('Requirement: opioid toxicity opens a focused breathe-antagonize-observe surface', () => {
  it('keeps ventilation priority, breathing endpoint, recurrence, and discharge safety visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        opioidToxicityAssessment: { patternReviewedAtTick: null, ventilationAtTick: null,
          antagonistAtTick: null, initialReassessmentAtTick: null,
          recurrenceReviewedAtTick: null, recurrencePlanAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 220, respiratoryRateBpm: 4, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onOpioidToxicityResponse: onAction, onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Breathe first. Antidote without delay.');
    expect(container.textContent).toContain('Pulse 58 · RR 4 · SpO₂ 78% · ETCO₂ 68');
    expect(container.textContent).toContain('Normal spontaneous breathing and airway reflexes are the endpoint');
    expect(container.textContent).toContain('The opioid can outlast the antidote.');
    expect(container.textContent).toContain('Ventilate again + repeat + observe');
    expect(container.textContent).not.toContain('tenecteplase');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review pulse + breathing + pattern'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-opioid-toxicity-pattern');
    act(() => root.unmount()); container.remove();
  });
});
