/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { POSTOPERATIVE_HANDOFF } from '@anesthesia/scenarios/postoperative-handoff';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: postoperative handoff is ordered and closed loop', () => {
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

  it('opens to handoff and withholds content and acceptance until prerequisites are met', () => {
    const onPostoperativeHandoffAssessment = vi.fn();
    const props: ActionCockpitProps = {
      scenario: POSTOPERATIVE_HANDOFF, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        postoperativeHandoffAssessment: {
          receiverReadyAtTick: null, patientAndCourseAtTick: null,
          currentStateAtTick: null, risksActionsOwnershipAtTick: null,
          receiverReadbackAtTick: null, transferAcceptedAtTick: null,
        },
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 430, respiratoryRateBpm: 13,
        fio2: 0.32, peep: 5, delivering: false, sevofluranePercent: 0,
        freshGasFlowLPerMin: 2,
      },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
      onPostoperativeHandoffAssessment, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Handoff');
    expect(button('Confirm receiver readiness').disabled).toBe(false);
    expect(button('Share patient + course').disabled).toBe(true);
    expect(button('Share current state').disabled).toBe(true);
    expect(button('Share risks + ownership').disabled).toBe(true);
    expect(button('Record receiver synthesis').disabled).toBe(true);
    expect(button('Acknowledge + accept transfer').disabled).toBe(true);
    act(() => button('Confirm receiver readiness').click());
    expect(onPostoperativeHandoffAssessment).toHaveBeenCalledWith('confirm-receiver-readiness');
    expect(container.textContent).toContain('Responsibility changes only after explicit acknowledgment');
  });
});
