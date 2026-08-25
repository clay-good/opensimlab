/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ARDS_LUNG_PROTECTIVE_VENTILATION as SCENARIO } from '../../src/modules/critical-care/scenarios/ards-lung-protective-ventilation';

describe('Requirement: ARDS opens a focused protective-setting and response surface', () => {
  it('keeps PBW, plateau, whole-patient reassessment, and prone-team boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null,
        activeCooling: false, seizureSuppressed: false, ardsLungProtectiveAssessment: {
          baselineAtTick: null, pbwAtTick: null, protectionAtTick: null, reassessmentAtTick: null, escalationAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control', tidalVolumeMl: 500,
        respiratoryRateBpm: 24, fio2: 0.7, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'tracheal-tube', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onArdsLungProtectiveResponse: onAction, onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Size the breath to the lung.');
    expect(container.textContent).toContain('height + sex → PBW · never actual weight');
    expect(container.textContent).toContain('Every setting owes you a response.');
    expect(container.textContent).toContain('Proning is a trained-team procedure');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review gas + mechanics + circulation'));
    act(() => review?.click()); expect(onAction).toHaveBeenCalledWith('review-ards-baseline');
    act(() => root.unmount()); container.remove();
  });
});
