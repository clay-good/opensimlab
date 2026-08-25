/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UPPER_GI_HEMORRHAGE as SCENARIO } from '../../src/modules/critical-care/scenarios/upper-gi-hemorrhage';

describe('Requirement: upper GI hemorrhage opens a focused recurrence-and-hemostasis surface', () => {
  it('keeps the whole trajectory, individualized bridge, and definitive-control boundary visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        upperGiHemorrhageAssessment: { recognitionAtTick: null, patternAtTick: null,
          resuscitationAtTick: null, hemostasisAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 450, respiratoryRateBpm: 24, fio2: 0.3, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 6 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onUpperGiHemorrhageResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('The trend spoke before the pressure fell.');
    expect(container.textContent).toContain('Resuscitate the patient. Reopen hemostasis.');
    expect(container.textContent).toContain('restrictive ≠ rigid · resuscitation ∥ source control');
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize recurrence + activate help'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-recurrent-upper-gi-hemorrhage');
    act(() => root.unmount()); container.remove();
  });
});
