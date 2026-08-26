/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_SEPTIC_SHOCK as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';

describe('pediatric septic-shock private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    rescueAtTick: step > 2 ? 3 : null, sourceAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function props(step = 0, onAction = vi.fn(), state = assessment(step)): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricSepticShockAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 112,
        respiratoryRateBpm: 42, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricSepticShockResponse: onAction, onDrugCard: () => {} };
  }

  it('shows one calm action except when the 2 parallel ownership lanes open together', () => {
    const labels = ['Review care + perfusion trajectory', 'Recognize persistent septic shock',
      'Activate qualified shock rescue', 'Escalate source-control review',
      'Review the 90-minute report', 'Hand off active shock risk'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, props(step))));
      expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 2, 1, 1, 1, 0][step]!);
      if (step !== 2 && step < labels.length) {
        expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      } else if (step === 2) {
        expect(buttons.map(({ textContent }) => textContent?.trim())).toEqual([
          'Activate qualified shock rescue', 'Escalate source-control review',
        ]);
      }
    }
  });

  it('keeps agent, dose, target, and procedure recipes off-screen', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(2, onAction))));
    const action = [...container.querySelectorAll('button')]
      .find(({ textContent }) => textContent?.includes('Activate qualified shock rescue'));
    act(() => (action as HTMLButtonElement).click());
    expect(onAction).toHaveBeenCalledWith(
      'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership');
    expect(container.textContent).toContain('No universal fluid total, MAP target, agent');
    expect(container.textContent).not.toMatch(/epinephrine|norepinephrine|mcg\/kg|mL\/h|central line|discharge/i);
  });

  it('renders either parallel lane independently without exposing the later report early', () => {
    for (const state of [
      { ...assessment(2), rescueAtTick: 3 },
      { ...assessment(2), sourceAtTick: 3 },
    ]) {
      act(() => root.render(createElement(ActionCockpit, props(2, vi.fn(), state))));
      expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
      expect(container.textContent).not.toContain('Review the 90-minute report');
    }
  });
});
