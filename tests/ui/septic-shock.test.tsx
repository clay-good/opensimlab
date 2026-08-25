/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEPTIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/septic-shock';

describe('Requirement: septic shock keeps parallel initial care focused and ordered', () => {
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

  it('opens one focused tray and withholds downstream actions until prerequisites are met', () => {
    const onSepticShockAssessment = vi.fn();
    const props: ActionCockpitProps = {
      scenario: SEPTIC_SHOCK, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        septicShockAssessment: {
          infectionAndOrganDysfunctionReviewedAtTick: null, culturesAndLactateAtTick: null,
          antimicrobialIntentAtTick: null, initialCrystalloidAtTick: null,
          postFluidReassessmentAtTick: null, norepinephrineIntentAtTick: null,
          sourceControlEscalationAtTick: null,
        },
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 460, respiratoryRateBpm: 24,
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
      onSepticShockAssessment, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).not.toContain('No infusions running');
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    expect(button('Review infection + organ dysfunction').disabled).toBe(false);
    expect(button('Record cultures + lactate').disabled).toBe(true);
    expect(button('Record immediate antimicrobial intent').disabled).toBe(true);
    expect(button('Begin fixed 2,100 mL crystalloid course').disabled).toBe(true);
    expect(button('Reassess after initial fluid').disabled).toBe(true);
    expect(button('Record norepinephrine intent · MAP 65').disabled).toBe(true);
    expect(button('Escalate source control + critical care').disabled).toBe(true);
    act(() => button('Review infection + organ dysfunction').click());
    expect(onSepticShockAssessment)
      .toHaveBeenCalledWith('review-infection-and-organ-dysfunction');
    expect(container.textContent).toContain('do not collect a specimen');
    act(() => root.render(createElement(ActionCockpit, {
      ...props,
      resuscitation: {
        ...props.resuscitation,
        septicShockAssessment: {
          ...props.resuscitation.septicShockAssessment!,
          infectionAndOrganDysfunctionReviewedAtTick: 1,
        },
      },
    })));
    expect(button('Record cultures + lactate').disabled).toBe(false);
    expect(button('Begin fixed 2,100 mL crystalloid course').disabled).toBe(false);
    expect(button('Escalate source control + critical care').disabled).toBe(false);
    expect(button('Record immediate antimicrobial intent').disabled).toBe(true);
    expect(button('Record norepinephrine intent · MAP 65').disabled).toBe(true);
  });
});
