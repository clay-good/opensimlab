/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MASSIVE_PULMONARY_EMBOLISM as SCENARIO } from '../../src/modules/critical-care/scenarios/massive-pulmonary-embolism';

describe('Requirement: massive PE opens a focused E2R rescue-bridge surface', () => {
  it('keeps refractory shock, RV support, ECMO boundary, and clot strategy visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        massivePulmonaryEmbolismAssessment: { recognitionAtTick: null, patternAtTick: null,
          supportAtTick: null, ecmoAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 460, respiratoryRateBpm: 26, fio2: 1, peep: 5, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onMassivePulmonaryEmbolismResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('This is the failure state. Mobilize the system.');
    expect(container.textContent).toContain('confirmed PE · refractory shock · ventilatory failure · Category E2R');
    expect(container.textContent).toContain('Bridge the circulation. Keep the clot decision open.');
    expect(container.textContent).toContain('support ≠ thrombus treatment');
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize E2R + activate rescue'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-refractory-pe-shock');
    act(() => root.unmount()); container.remove();
  });
});
