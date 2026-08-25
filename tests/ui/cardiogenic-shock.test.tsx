/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/cardiogenic-shock';

describe('Requirement: cardiogenic shock opens a focused perfusion and cause-control surface', () => {
  it('keeps trajectory, phenotype, bounded bridge, cause control, and reassessment visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        cardiogenicShockAssessment: { recognitionAtTick: null, phenotypeAtTick: null,
          bridgeAtTick: null, causeControlAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420,
        respiratoryRateBpm: 28, fio2: 0.35, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onCardiogenicShockResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Pressure is a clue. Perfusion is the verdict.');
    expect(container.textContent).toContain('brain · skin · kidney · lactate · trajectory');
    expect(container.textContent).toContain('Bridge the pump. Fix the cause.');
    expect(container.textContent).toContain('no primary fluid load · no routine device');
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize shock + activate teams'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-cardiogenic-shock-trajectory');
    act(() => root.unmount()); container.remove();
  });
});
