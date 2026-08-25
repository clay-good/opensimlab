/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { POST_INTUBATION_HYPOTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/post-intubation-hypotension';

describe('Requirement: post-intubation hypotension opens a focused mechanism and support surface', () => {
  it('keeps signal validation, alternate causes, bounded support, and reassessment visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        postIntubationHypotensionAssessment: { pressureAtTick: null, dangerAtTick: null,
          mechanismAtTick: null, supportAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 420, respiratoryRateBpm: 20, fio2: 0.5, peep: 5, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onPostIntubationHypotensionResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('First, prove the pressure.');
    expect(container.textContent).toContain('waveform · pulse · perfusion · trend');
    expect(container.textContent).toContain('Support now. Keep asking why.');
    expect(container.textContent).toContain('not a universal fluid-versus-vasopressor answer');
    const validate = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Validate pressure + call help'));
    act(() => validate?.click());
    expect(onAction).toHaveBeenCalledWith('validate-post-intubation-pressure-and-call-help');
    act(() => root.unmount()); container.remove();
  });
});
