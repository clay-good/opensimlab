/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_STATUS_ASTHMATICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';

describe('pediatric status-asthmaticus private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (value: Partial<{ trajectoryAtTick: number; nonresponseAtTick: number;
    escalationAtTick: number; secondLineIntentAtTick: number; laterResponseAtTick: number;
    handoffAtTick: number; lastUnsupportedChoice: 'force-peak-flow' | 'radiograph-delay'
      | 'trigger-review-delay' | 'saturation-discharge' | null }> = {}) => ({
    trajectoryAtTick: value.trajectoryAtTick ?? null,
    nonresponseAtTick: value.nonresponseAtTick ?? null,
    escalationAtTick: value.escalationAtTick ?? null,
    secondLineIntentAtTick: value.secondLineIntentAtTick ?? null,
    laterResponseAtTick: value.laterResponseAtTick ?? null,
    handoffAtTick: value.handoffAtTick ?? null,
    lastUnsupportedChoice: value.lastUnsupportedChoice ?? null,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricStatusAsthmaticusAssessment: value }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 190,
        respiratoryRateBpm: 40, fio2: 0.35, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricStatusAsthmaticusResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows 2 calm cards with one clear current action', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    act(() => button('Review trajectory + prior care')?.click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory');
    act(() => root.render(createElement(ActionCockpit,
      props(assessment({ trajectoryAtTick: 10 })))));
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    expect(button('Recognize severe nonresponse')).toBeDefined();
    expect([...container.querySelectorAll('.tray-grid button')].map(({ textContent }) => textContent)
      .join(' ')).not.toMatch(/albuterol|aminophylline|magnesium|epinephrine|discharge/i);
  });

  it('keeps recipes off-screen and ends in a calm active-risk handoff', () => {
    act(() => root.render(createElement(ActionCockpit, props(assessment({
      trajectoryAtTick: 10, nonresponseAtTick: 20, escalationAtTick: 30,
      secondLineIntentAtTick: 40, laterResponseAtTick: 50,
      lastUnsupportedChoice: 'saturation-discharge' })))));
    expect(button('Hand off active severe asthma')).toBeDefined();
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    expect(container.textContent).toContain('caregiver context');
    expect(container.textContent).not.toMatch(/mg\/kg|mcg\/kg|mL\/h|tube size|PEEP \d/i);
  });
});
