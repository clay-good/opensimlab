/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { VENTILATOR_DYSSYNCHRONY as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-dyssynchrony';

describe('Requirement: dyssynchrony opens a focused patient-waveform response surface', () => {
  it('keeps mechanism, lung protection, reassessment, and skill boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        ventilatorDyssynchronyAssessment: { graphicsAtTick: null, driversAtTick: null,
          classificationAtTick: null, correctionAtTick: null, reassessmentAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.4, peep: 8, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onVentilatorDyssynchronyResponse: onAction,
      onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Read the person and the breath.');
    expect(container.textContent).toContain('effort · pressure · flow · volume');
    expect(container.textContent).toContain('Match support. Keep protection.');
    expect(container.textContent).toContain('A quieter waveform is not enough');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Read patient + pressure + flow + volume'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-dyssynchrony-patient-and-graphics');
    act(() => root.unmount()); container.remove();
  });
});
