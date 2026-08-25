/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ESCALATING_HYPOXEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/escalating-hypoxemia';

describe('Requirement: escalating hypoxemia opens a focused outside-in response surface', () => {
  it('keeps signal, delivery-path, bedside-pattern, and procedure boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        escalatingHypoxemiaAssessment: { signalAtTick: null, supportAtTick: null,
          deliveryPathAtTick: null, bedsidePatternAtTick: null, escalationAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 430, respiratoryRateBpm: 22, fio2: 0.5, peep: 10, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onEscalatingHypoxemiaResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Believe the drop. Verify the signal.');
    expect(container.textContent).toContain('pleth · trend · patient · arterial panel');
    expect(container.textContent).toContain('Trace oxygen from wall to alveolus.');
    expect(container.textContent).toContain('never makes tube, pleural, embolic, or equipment danger impossible');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Corroborate the decline'));
    act(() => review?.click()); expect(onAction).toHaveBeenCalledWith('validate-hypoxemia-signal');
    act(() => root.unmount()); container.remove();
  });
});
