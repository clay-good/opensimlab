/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { AUTO_PEEP as SCENARIO } from '../../src/modules/critical-care/scenarios/auto-peep';

describe('Requirement: auto-PEEP opens a focused exhalation and mechanics surface', () => {
  it('keeps measurement validity, expiratory time, reassessment, and skill boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        autoPeepAssessment: { flowAtTick: null, measurementAtTick: null,
          classificationAtTick: null, correctionAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 480, respiratoryRateBpm: 28, fio2: 0.4, peep: 5, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onAutoPeepResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Watch the breath leave.');
    expect(container.textContent).toContain('flow · time · total PEEP · pressure');
    expect(container.textContent).toContain('Make room for the next breath.');
    expect(container.textContent).toContain('External PEEP is individualized');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review patient + expiratory flow'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-auto-peep-patient-and-flow');
    act(() => root.unmount()); container.remove();
  });
});
