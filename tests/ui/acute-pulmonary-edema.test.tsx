/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_PULMONARY_EDEMA } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';

describe('Requirement: acute pulmonary edema is a focused respiratory-hemodynamic lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with whole-patient review and keeps unsupported dosing out', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: ACUTE_PULMONARY_EDEMA, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        acutePulmonaryEdemaAssessment: { patternReviewedAtTick: null, nivAtTick: null,
          diureticIntentAtTick: null, vasodilatorIntentAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 420, respiratoryRateBpm: 32, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onAcutePulmonaryEdemaResponse: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {},
      onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review pattern + mimics + precipitants').disabled).toBe(false);
    expect(button('Start NIV + titrated oxygen intent').disabled).toBe(true);
    expect(button('Record IV loop-diuretic intent').disabled).toBe(true);
    expect(container.textContent).not.toMatch(/furosemide \d|nitroglycerin \d|morphine/i);
    act(() => button('Review pattern + mimics + precipitants').click());
    expect(onAction).toHaveBeenCalledWith('review-pattern-mimics-and-precipitants');
    expect(container.textContent).toContain('does not acquire an examination');
  });
});
