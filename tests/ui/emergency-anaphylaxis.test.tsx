/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ANAPHYLAXIS } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';

describe('Requirement: emergency anaphylaxis is a focused first-line lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with pattern review and never exposes perioperative IV epinephrine', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: ANAPHYLAXIS, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null,
        activeCooling: false, emergencyAnaphylaxisAssessment: { patternReviewedAtTick: null,
          positionedAndHelpedAtTick: null, imEpinephrineAtTick: null, oxygenAtTick: null,
          crystalloidAtTick: null, reassessedAtTick: null } },
      lastExposure: { agentId: 'community-food-exposure', tick: 0 }, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 24, fio2: 0.21,
        peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEmergencyAnaphylaxisResponse: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review systemic pattern').disabled).toBe(false);
    expect(button('Position + call for help').disabled).toBe(true);
    expect(button('Give 500 µg epinephrine IM').disabled).toBe(true);
    expect(container.textContent).not.toContain('50 µg IV');
    act(() => button('Review systemic pattern').click());
    expect(onAction).toHaveBeenCalledWith('review-systemic-pattern');
    expect(container.textContent).toContain('not a dosing calculator');
    expect(container.textContent).toContain('No repeat-dose clock');
  });
});
