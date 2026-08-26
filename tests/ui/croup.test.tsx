/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CROUP as SCENARIO } from '../../src/modules/pediatrics/scenarios/croup';

describe('croup private-tutor surface', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const assessment = (value: Partial<{ patternAtTick: number; severityAtTick: number;
    treatmentIntentAtTick: number; earlyResponseAtTick: number; recurrenceAtTick: number;
    handoffAtTick: number; lastUnsupportedChoice: 'albuterol' | 'radiograph'
      | 'discharge-early' | 'normal-saturation' | null }> = {}) => ({
    patternAtTick: value.patternAtTick ?? null, severityAtTick: value.severityAtTick ?? null,
    treatmentIntentAtTick: value.treatmentIntentAtTick ?? null,
    earlyResponseAtTick: value.earlyResponseAtTick ?? null,
    recurrenceAtTick: value.recurrenceAtTick ?? null, handoffAtTick: value.handoffAtTick ?? null,
    lastUnsupportedChoice: value.lastUnsupportedChoice ?? null,
  });
  function props(value = assessment(), onAction = vi.fn()): ActionCockpitProps {
    return { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        croupAssessment: value }, lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 105, respiratoryRateBpm: 34, fio2: 0.21,
        peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onCroupResponse: onAction, onDrugCard: () => {} };
  }
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows 2 calm cards and never reveals more than 3 current choices', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, props(assessment(), onAction))));
    expect(container.querySelectorAll('.tray-grid > section.syringe')).toHaveLength(2);
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    act(() => button('Review the upper-airway pattern')?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-croup-whole-child-upper-airway-pattern');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ patternAtTick: 10 })))));
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(3);
    expect(button('Review severity + red flags')).toBeDefined();
  });

  it('keeps the child with her caregiver and ends in one calm handoff control', () => {
    act(() => root.render(createElement(
      ActionCockpit,
      props(assessment({ patternAtTick: 10, severityAtTick: 20, treatmentIntentAtTick: 30,
        lastUnsupportedChoice: 'normal-saturation' })),
    )));
    expect(button('Review the early response')).toBeDefined();
    expect(container.textContent).toContain('Keep her with her caregiver');
    act(() => root.render(createElement(ActionCockpit, props(assessment({ patternAtTick: 10,
      severityAtTick: 20, treatmentIntentAtTick: 30, earlyResponseAtTick: 40,
      recurrenceAtTick: 50 })))));
    expect(button('Hand off active upper-airway risk')).toBeDefined();
    expect(container.querySelectorAll('.tray-grid button')).toHaveLength(1);
    expect(container.textContent).not.toMatch(/mg\/kg|mcg\/kg|L\/min|tube size|repeat dose/i);
  });
});
