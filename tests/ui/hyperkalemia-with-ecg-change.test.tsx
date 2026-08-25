/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HYPERKALEMIA_WITH_ECG_CHANGE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';

describe('Requirement: severe hyperkalemia opens a focused protect-shift-remove surface', () => {
  it('keeps calcium purpose, glucose surveillance, removal, and rebound visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        hyperkalemiaAssessment: { patternReviewedAtTick: null, calciumAtTick: null,
          postCalciumEcgAtTick: null,
          insulinGlucoseAtTick: null, betaAgonistAtTick: null, removalAtTick: null,
          reassessedAtTick: null },
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onHyperkalemiaResponse: onAction, onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Protect the heart first.');
    expect(container.textContent).toContain('K 7.1 · ECG toxicity · no arrest');
    expect(container.textContent).toContain('Calcium protects the myocardium; it does not lower potassium');
    expect(container.textContent).toContain('Record insulin-glucose + surveillance');
    expect(container.textContent).toContain('Remove K + stop drivers + renal help');
    expect(container.textContent).not.toContain('tenecteplase');
    const review = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Review K + ECG + drivers'));
    act(() => review?.click());
    expect(onAction).toHaveBeenCalledWith('review-hyperkalemia-pattern');
    act(() => root.unmount()); container.remove();
  });
});
