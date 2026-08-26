/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, crisisResponseAvailability,
  type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_FEBRILE_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-febrile-seizure';

describe('pediatric febrile-seizure private-tutor surface', () => {
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
    careAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function props(step = 0, onAction = vi.fn(), state = assessment(step)): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricFebrileSeizureAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 84,
        respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricFebrileSeizureResponse: onAction, onDrugCard: () => {} };
  }

  it('shows two calm named cards and exact progressive actions at 320px', () => {
    const labels = ['Review seizure + whole-child recovery',
      'Recognize the febrile-seizure pattern', 'Confirm qualified observation',
      'Review red flags + recurrence', 'Review the 30-minute report',
      'Hand off safety + caregiver guidance'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, props(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-febrile-seizure-pattern-title',
        'pediatric-febrile-seizure-response-title']);
      expect(cards[0]?.textContent).toContain('Read the event, then the child.');
      expect(cards[1]?.textContent).toContain('Reassurance needs boundaries.');
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 2, 1, 1, 1, 0][step]!);
      if (step !== 2 && step < labels.length) {
        expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      }
      if (step === 2) expect(buttons.map(({ textContent }) => textContent?.trim())).toEqual([
        'Confirm qualified observation', 'Review red flags + recurrence']);
    }
    const css = readFileSync('src/modules/anesthesia/ui/cockpit.css', 'utf8');
    expect(css).toMatch(/minmax\(240px, 1fr\)/);
    expect(css).toMatch(/\.crisis-drug__action\s*\{\s*min-block-size:\s*44px;/);
  });

  it('keeps either parallel lane independent and the elapsed report closed', () => {
    for (const [state, remaining, status] of [
      [{ ...assessment(2), careAtTick: 3 }, 'Review red flags + recurrence',
        'Observation is active · review red flags and recurrence'],
      [{ ...assessment(2), safetyAtTick: 3 }, 'Confirm qualified observation',
        'Safety review is active · confirm qualified observation'],
    ] as const) {
      act(() => root.render(createElement(ActionCockpit, props(2, vi.fn(), state))));
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent?.trim()).toBe(remaining);
      expect(container.textContent).toContain(status);
      expect(container.textContent).not.toContain('Review the 30-minute report');
    }
  });

  it('keeps learner recipes off-screen while preserving bounded non-claims', () => {
    act(() => root.render(createElement(ActionCockpit, props(5))));
    expect(container.textContent).toContain('does not prove a benign cause');
    expect(container.textContent).toContain('exclude serious infection');
    expect(container.textContent).not.toMatch(/mL\/kg|mg\/kg|acetaminophen|ibuprofen|midazolam|lorazepam|diazepam|intravenous|lumbar puncture|discharge now/i);
  });

  it('requires the exact scenario id and exact narrative target', () => {
    expect(crisisResponseAvailability(SCENARIO, []).hasPediatricFebrileSeizureResponse)
      .toBe(true);
    const wrongId = { ...SCENARIO,
      metadata: { ...SCENARIO.metadata, id: 'not-pediatric-febrile-seizure' } };
    expect(crisisResponseAvailability(wrongId, []).hasPediatricFebrileSeizureResponse)
      .toBe(false);
    const wrongTarget = { ...SCENARIO, timeline: SCENARIO.timeline.map((event) => ({
      ...event, target: 'pediatric-febrile-seizure-reassessment-suffix',
    })) };
    expect(crisisResponseAvailability(wrongTarget, []).hasPediatricFebrileSeizureResponse)
      .toBe(false);
  });
});
