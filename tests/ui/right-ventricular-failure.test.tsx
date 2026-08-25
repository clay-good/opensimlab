/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { RIGHT_VENTRICULAR_FAILURE as SCENARIO } from '../../src/modules/critical-care/scenarios/right-ventricular-failure';

describe('Requirement: RV failure opens a focused congestion and perfusion surface', () => {
  it('keeps phenotype, individualized support, triggers, and reassessment visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        rightVentricularFailureAssessment: { recognitionAtTick: null, phenotypeAtTick: null,
          supportAtTick: null, triggersAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420,
        respiratoryRateBpm: 24, fio2: 0.4, peep: 5, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onRightVentricularFailureResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Read the ventricle, not just the pressure.');
    expect(container.textContent).toContain('congestion · perfusion · RV shape · septum · output');
    expect(container.textContent).toContain('Protect filling. Lower the load. Prove the flow.');
    expect(container.textContent).toContain('no reflex fluid · no reflex decongestion');
    const recognize = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Recognize trajectory + call teams'));
    act(() => recognize?.click());
    expect(onAction).toHaveBeenCalledWith('recognize-rv-failure-trajectory');
    act(() => root.unmount()); container.remove();
  });
});
