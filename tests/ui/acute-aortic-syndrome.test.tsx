/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_AORTIC_SYNDROME as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-aortic-syndrome';

describe('Requirement: evolving aortic concern opens a focused serial-assessment surface', () => {
  it('keeps uncertainty, multi-territory reassessment, perfusion, and imaging boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        acuteAorticSyndromeAssessment: { initialReviewedAtTick: null, evolutionReviewedAtTick: null,
          escalatedAtTick: null, antiImpulseAtTick: null, imagingAtTick: null, handedOffAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 20, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onAcuteAorticSyndromeResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('The first exam is a timestamp.');
    expect(container.textContent).toContain('pain · pressure · pulse · perfusion · brain');
    expect(container.textContent).toContain('Quiet the impulse. Protect the organs.');
    expect(container.textContent).toContain('rate first · pressure second · perfusion always');
    expect(container.textContent).toContain('ends before any result or operative choice');
    expect(container.textContent).not.toContain('Confirmed dissection');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review pain + ECG + symmetric baseline'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-aortic-initial-pattern');
    act(() => root.unmount()); container.remove();
  });
});
