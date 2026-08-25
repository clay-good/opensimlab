/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TRAUMA_PRIMARY_SURVEY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/trauma-primary-survey';

describe('Requirement: major trauma opens a focused control-sweep-repeat surface', () => {
  it('keeps catastrophic hemorrhage, complete survey, warmth, and reassessment visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        traumaPrimarySurveyAssessment: { activatedAtTick: null, catastrophicHemorrhageAtTick: null,
          airwayBreathingAtTick: null, circulationAtTick: null,
          disabilityExposureAtTick: null, repeatedAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 26, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onTraumaPrimarySurveyResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Stop the leak. Keep the sweep moving.');
    expect(container.textContent).toContain('<C> · A · B');
    expect(container.textContent).toContain('Every intervention earns another survey.');
    expect(container.textContent).toContain('Pelvis + blood + TXA + control');
    expect(container.textContent).toContain('Review brain + glucose + back + warmth');
    expect(container.textContent).not.toContain('tenecteplase');
    const activate = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Receive handoff + activate + declare sweep'));
    act(() => activate?.click());
    expect(onAction).toHaveBeenCalledWith('activate-trauma-primary-survey');
    act(() => root.unmount()); container.remove();
  });
});
