/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ADULT_ASTHMA } from '../../src/modules/emergency-medicine/scenarios/adult-asthma';

describe('Requirement: adult asthma is a focused controlled-oxygen lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with whole-patient severity and excludes the perioperative tray', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: ADULT_ASTHMA, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null,
        activeCooling: false, adultAsthmaAssessment: { severityReviewedAtTick: null,
          controlledOxygenAtTick: null, bronchodilatorBundleAtTick: null,
          corticosteroidIntentAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 34, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onAdultAsthmaResponse: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review severity + immediate mimics').disabled).toBe(false);
    expect(button('Target controlled oxygen · 92–95%').disabled).toBe(true);
    expect(button('Give fixed pMDI + spacer bundle').disabled).toBe(true);
    expect(container.textContent).not.toContain('100% oxygen');
    expect(container.textContent).not.toContain('5 mg nebulized');
    act(() => button('Review severity + immediate mimics').click());
    expect(onAction).toHaveBeenCalledWith('review-severity-and-mimics');
    expect(container.textContent).toContain('does not perform examination');
  });
});
