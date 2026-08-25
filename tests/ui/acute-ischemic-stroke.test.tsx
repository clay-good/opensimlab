/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_ISCHEMIC_STROKE } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';

describe('Requirement: acute ischemic stroke opens a focused dual-reperfusion surface', () => {
  it('centers the clock, authored eligibility, thrombolysis, and thrombectomy transfer', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: ACUTE_ISCHEMIC_STROKE, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        acuteIschemicStrokeAssessment: {
          presentationReviewedAtTick: null, systemActivatedAtTick: null,
          imagingReviewedAtTick: null, tenecteplaseAtTick: null,
          thrombectomyActivatedAtTick: null, reassessedAtTick: null,
        },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onAcuteIschemicStrokeResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Time is tissue. Facts before treatment.');
    expect(container.textContent).toContain('Disabling deficit · 70-minute clock');
    expect(container.textContent).toContain('Review CT + CTA + eligibility');
    expect(container.textContent).toContain('Record tenecteplase 20 mg IV intent');
    expect(container.textContent).toContain('Activate thrombectomy transfer');
    expect(container.textContent).toContain('No drug delivery, neurologic improvement');
    expect(container.textContent).not.toContain('Give lorazepam');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review deficit + clock'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-stroke-presentation');
    act(() => root.unmount()); container.remove();
  });
});
