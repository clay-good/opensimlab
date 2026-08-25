/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNDIFFERENTIATED_SHOCK } from '../../src/modules/emergency-medicine/scenarios/undifferentiated-shock';

describe('Requirement: undifferentiated shock uses ordered serial assessment', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('opens to shock assessment and withholds phenotype, fluid, and escalation until prerequisites are met', () => {
    const onUndifferentiatedShockAssessment = vi.fn();
    const props: ActionCockpitProps = {
      scenario: UNDIFFERENTIATED_SHOCK, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        undifferentiatedShockAssessment: {
          perfusionReviewedAtTick: null, lactateReviewedAtTick: null,
          focusedEchoReviewedAtTick: null, passiveLegRaiseAtTick: null,
          fluidChallengeAtTick: null, perfusionReassessedAtTick: null,
          escalationAtTick: null,
        },
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 460, respiratoryRateBpm: 22,
        fio2: 0.21, peep: 5, delivering: false, sevofluranePercent: 0,
        freshGasFlowLPerMin: 2,
      },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
      onUndifferentiatedShockAssessment, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).not.toContain('No infusions running');
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    expect(button('Review tissue perfusion').disabled).toBe(false);
    expect(button('Review fixed lactate').disabled).toBe(false);
    expect(button('Review focused cardiac findings').disabled).toBe(true);
    expect(button('Review passive-leg-raise response').disabled).toBe(true);
    expect(button('Give bounded 500 mL challenge').disabled).toBe(true);
    expect(button('Reassess tissue perfusion').disabled).toBe(true);
    expect(button('Escalate ongoing shock workup').disabled).toBe(true);
    act(() => button('Review tissue perfusion').click());
    expect(onUndifferentiatedShockAssessment).toHaveBeenCalledWith('review-perfusion');
    expect(container.textContent).toContain('does not perform an examination');
  });
});
