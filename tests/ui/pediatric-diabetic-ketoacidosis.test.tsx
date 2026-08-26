/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, crisisResponseAvailability,
  type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';
import { DIABETIC_KETOACIDOSIS } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';

describe('pediatric DKA private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    careAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function props(step = 0, onAction = vi.fn(), state = assessment(step)): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricDiabeticKetoacidosisAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 210,
        respiratoryRateBpm: 30, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricDiabeticKetoacidosisResponse: onAction, onDrugCard: () => {} };
  }

  it('shows two calm named cards and only the intended actions at each state', () => {
    const labels = ['Review illness + fixed panel', 'Recognize pediatric DKA risk',
      'Activate qualified DKA care', 'Review neurologic + metabolic safety',
      'Review the 60-minute report', 'Hand off active DKA risk'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, props(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-dka-pattern-title', 'pediatric-dka-response-title']);
      expect(cards[0]?.textContent).toContain('Read the child, not one number.');
      expect(cards[1]?.textContent).toContain('Make every reassessment count.');
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 2, 1, 1, 1, 0][step]!);
      if (step !== 2 && step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      if (step === 2) expect(buttons.map(({ textContent }) => textContent?.trim())).toEqual([
        'Activate qualified DKA care', 'Review neurologic + metabolic safety']);
    }
  });

  it('keeps adult treatment recipes, calculations, routes, and resolution shortcuts off-screen', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(2, onAction))));
    const action = [...container.querySelectorAll('button')]
      .find(({ textContent }) => textContent?.includes('Activate qualified DKA care'));
    act(() => (action as HTMLButtonElement).click());
    expect(onAction).toHaveBeenCalledWith('activate-pediatric-dka-qualified-care-ownership');
    expect(container.textContent).toContain('This lab exposes no calculation');
    expect(container.textContent).not.toMatch(/mL\/kg|units\/kg|mL\/h|0\.9%|intravenous|intraosseous|insulin bolus|bicarbonate|corrected sodium|osmolality|discharge now|DKA resolved/i);
  });

  it('renders either parallel lane independently without opening the later report early', () => {
    for (const [state, remaining, status] of [
      [{ ...assessment(2), careAtTick: 3 }, 'Review neurologic + metabolic safety',
        'Qualified care is active · review neurologic and metabolic safety'],
      [{ ...assessment(2), safetyAtTick: 3 }, 'Activate qualified DKA care',
        'Safety review is active · activate qualified DKA care'],
    ] as const) {
      act(() => root.render(createElement(ActionCockpit, props(2, vi.fn(), state))));
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent?.trim()).toBe(remaining);
      expect(container.textContent).toContain(status);
      expect(container.textContent).not.toContain('Review the 60-minute report');
    }
  });

  it('requires exact identity for both the pediatric and adult DKA trays', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({
      hasPediatricDiabeticKetoacidosisResponse: true,
      hasDiabeticKetoacidosisResponse: false,
    });
    const adultWithWrongId = { ...DIABETIC_KETOACIDOSIS,
      metadata: { ...DIABETIC_KETOACIDOSIS.metadata, id: 'not-adult-dka' } };
    expect(crisisResponseAvailability(adultWithWrongId, [])).toMatchObject({
      hasPediatricDiabeticKetoacidosisResponse: false,
      hasDiabeticKetoacidosisResponse: false,
    });
    const pediatricWithWrongTarget = { ...SCENARIO, timeline: SCENARIO.timeline.map((event) =>
      event.target === 'pediatric-diabetic-ketoacidosis-reassessment'
        ? { ...event, target: 'pediatric-diabetic-ketoacidosis-reassessment-suffix' }
        : event) };
    expect(crisisResponseAvailability(pediatricWithWrongTarget, [])
      .hasPediatricDiabeticKetoacidosisResponse).toBe(false);
  });
});
