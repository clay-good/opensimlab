/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';

describe('Requirement: ICH deterioration opens a focused control-and-escalation surface', () => {
  it('centers serial decline, urgent reversal, smooth pressure control, and hydrocephalus escalation', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        intracranialHemorrhageAssessment: {
          deteriorationReviewedAtTick: null, pathwayActivatedAtTick: null,
          findingsReviewedAtTick: null, reversalAtTick: null,
          pressureControlAtTick: null, escalatedAtTick: null,
        },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onIntracranialHemorrhageResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Notice the change. Protect the next minute.');
    expect(container.textContent).toContain('15-minute decline · BP 202/112');
    expect(container.textContent).toContain('Review CT + warfarin + INR');
    expect(container.textContent).toContain('Stop warfarin + record reversal intent');
    expect(container.textContent).toContain('Record smooth SBP control');
    expect(container.textContent).toContain('No dose, drug delivery, pressure response');
    expect(container.textContent).not.toContain('tenecteplase');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review serial deterioration'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-ich-deterioration');
    act(() => root.unmount()); container.remove();
  });
});
