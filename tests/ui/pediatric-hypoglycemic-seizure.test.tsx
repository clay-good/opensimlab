/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, crisisResponseAvailability,
  type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';

describe('pediatric hypoglycemic-seizure private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
  });

  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    rescueAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function props(step = 0, onAction = vi.fn(), state = assessment(step)): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricHypoglycemicSeizureAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 126,
        respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricHypoglycemicSeizureResponse: onAction, onDrugCard: () => {} };
  }

  it('shows two calm named cards and the exact progressive actions at 320px', () => {
    const labels = ['Review seizure + fixed glucose', 'Recognize hypoglycemic emergency',
      'Activate qualified glucose rescue', 'Review recovery + cause risks',
      'Review the 20-minute report', 'Hand off recurrence + cause risk'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, props(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-hypoglycemia-pattern-title', 'pediatric-hypoglycemia-response-title']);
      expect(cards[0]?.textContent).toContain('Read the seizure and the child.');
      expect(cards[1]?.textContent).toContain('Recovery needs another check.');
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 2, 1, 1, 1, 0][step]!);
      if (step !== 2 && step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      if (step === 2) expect(buttons.map(({ textContent }) => textContent?.trim())).toEqual([
        'Activate qualified glucose rescue', 'Review recovery + cause risks']);
    }
    const css = readFileSync('src/modules/anesthesia/ui/cockpit.css', 'utf8');
    expect(css).toMatch(/minmax\(240px, 1fr\)/);
    expect(css).toMatch(/\.crisis-drug__action\s*\{\s*min-block-size:\s*44px;/);
  });

  it('keeps either parallel lane independent and the elapsed report closed', () => {
    for (const [state, remaining, status] of [
      [{ ...assessment(2), rescueAtTick: 3 }, 'Review recovery + cause risks',
        'Qualified rescue is active · review recovery and cause risks'],
      [{ ...assessment(2), safetyAtTick: 3 }, 'Activate qualified glucose rescue',
        'Safety review is active · activate qualified glucose rescue'],
    ] as const) {
      act(() => root.render(createElement(ActionCockpit, props(2, vi.fn(), state))));
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent?.trim()).toBe(remaining);
      expect(container.textContent).toContain(status);
      expect(container.textContent).not.toContain('Review the 20-minute report');
    }
  });

  it('keeps oral intake and learner recipes off-screen while preserving bounded non-claims', () => {
    act(() => root.render(createElement(ActionCockpit, props(5))));
    expect(container.textContent).toContain('Give nothing by mouth while consciousness is impaired.');
    expect(container.textContent).toContain('does not prove treatment effect, durable euglycemia');
    expect(container.textContent).not.toMatch(/mL\/kg|mg\/kg|D10|D25|% dextrose|intravenous|intraosseous|glucagon|lorazepam|discharge now|seizure resolved/i);
  });

  it('requires the exact scenario id and exact narrative target', () => {
    expect(crisisResponseAvailability(SCENARIO, [])
      .hasPediatricHypoglycemicSeizureResponse).toBe(true);
    const wrongId = { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'not-pediatric-hypoglycemia' } };
    expect(crisisResponseAvailability(wrongId, [])
      .hasPediatricHypoglycemicSeizureResponse).toBe(false);
    const wrongTarget = { ...SCENARIO, timeline: SCENARIO.timeline.map((event) => ({
      ...event, target: 'pediatric-hypoglycemic-seizure-reassessment-suffix',
    })) };
    expect(crisisResponseAvailability(wrongTarget, [])
      .hasPediatricHypoglycemicSeizureResponse).toBe(false);
  });
});
