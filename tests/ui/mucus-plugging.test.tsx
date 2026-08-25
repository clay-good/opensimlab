/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MUCUS_PLUGGING as SCENARIO } from '../../src/modules/critical-care/scenarios/mucus-plugging';

describe('Requirement: mucus plugging opens a focused indication and reassessment surface', () => {
  it('keeps clearance restraint, focal escalation, and skill boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        mucusPluggingAssessment: { supportAtTick: null, indicatorsAtTick: null,
          suctionAtTick: null, reassessmentAtTick: null, escalationAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 440, respiratoryRateBpm: 20, fio2: 0.45, peep: 5, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onMucusPluggingResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Listen to the resistance.');
    expect(container.textContent).toContain('sounds · secretions · flow · pressure');
    expect(container.textContent).toContain('Clear, then prove it.');
    expect(container.textContent).toContain('Routine bronchoscopy is not the answer');
    const support = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Support oxygenation + call help'));
    act(() => support?.click());
    expect(onAction).toHaveBeenCalledWith('support-mucus-plugging-and-call-help');
    act(() => root.unmount()); container.remove();
  });
});
