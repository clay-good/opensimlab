/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STEMI } from '../../src/modules/emergency-medicine/scenarios/stemi';

describe('Requirement: STEMI is a focused reperfusion-preparation lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with pattern review and keeps unsupported treatment selection out', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: STEMI, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        stemiAssessment: { patternReviewedAtTick: null, pathwayActivatedAtTick: null,
          aspirinAtTick: null, additionalAntithromboticsAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 20, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onStemiResponse: onAction, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review symptoms + fixed 12-lead').disabled).toBe(false);
    expect(button('Activate STEMI pathway + primary PCI').disabled).toBe(true);
    expect(button('Reassess + hand off for reperfusion').disabled).toBe(true);
    expect(container.textContent).toContain('routine oxygen is not selected');
    expect(container.textContent).not.toMatch(/ticagrelor \d|heparin \d|nitroglycerin \d|morphine/i);
    act(() => button('Review symptoms + fixed 12-lead').click());
    expect(onAction).toHaveBeenCalledWith('review-stemi-pattern');
  });
});
