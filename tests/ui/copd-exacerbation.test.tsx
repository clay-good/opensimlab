/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COPD_EXACERBATION } from '../../src/modules/emergency-medicine/scenarios/copd-exacerbation';

describe('Requirement: COPD exacerbation is a focused controlled-oxygen lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with severity and blood-gas review and excludes generic perioperative dosing', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: COPD_EXACERBATION, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        copdExacerbationAssessment: { severityReviewedAtTick: null,
          controlledOxygenAtTick: null, bronchodilatorBundleAtTick: null,
          corticosteroidIntentAtTick: null, antibioticIntentAtTick: null,
          reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 450, respiratoryRateBpm: 28, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onCopdExacerbationResponse: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {},
      onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review severity + blood gas + mimics').disabled).toBe(false);
    expect(button('Target controlled oxygen · 88–92%').disabled).toBe(true);
    expect(button('Give air-driven SABA + SAMA intent').disabled).toBe(true);
    expect(container.textContent).not.toContain('100% oxygen');
    expect(container.textContent).not.toContain('5 mg nebulized');
    act(() => button('Review severity + blood gas + mimics').click());
    expect(onAction).toHaveBeenCalledWith('review-severity-and-mimics');
    expect(container.textContent).toContain('does not perform examination');
  });
});
