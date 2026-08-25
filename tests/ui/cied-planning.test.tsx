/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { PACEMAKER_AND_CAUTERY_PLANNING } from '@anesthesia/scenarios/pacemaker-and-cautery-planning';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: CIED planning is ordered and device-specific', () => {
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

  it('opens to the focused device plan and withholds choices until both reviews', () => {
    const onCiedPlanningAssessment = vi.fn();
    const props: ActionCockpitProps = {
      scenario: PACEMAKER_AND_CAUTERY_PLANNING, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        ciedPlanningAssessment: {
          deviceRecordReviewedAtTick: null, procedureRiskReviewedAtTick: null,
          plan: null, planAtTick: null, backupAndRestorationDocumentedAtTick: null,
        },
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 12,
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
      onCiedPlanningAssessment, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent)
      .toBe('Device plan');
    expect(button('Review device record').disabled).toBe(false);
    expect(button('Review procedure + EMI').disabled).toBe(false);
    expect(button('Coordinate asynchronous pacing').disabled).toBe(true);
    expect(button('Document backup + restoration').disabled).toBe(true);
    act(() => button('Review device record').click());
    expect(onCiedPlanningAssessment).toHaveBeenCalledWith('review-device-record');
    expect(container.textContent).toContain('never a universal magnet rule');
  });
});
