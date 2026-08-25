/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HEMORRHAGIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';

describe('Requirement: traumatic hemorrhage keeps control and resuscitation parallel', () => {
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

  it('opens one focused tray and exposes parallel control tasks after recognition', () => {
    const onHemorrhagicShockAssessment = vi.fn();
    const props: ActionCockpitProps = {
      scenario: HEMORRHAGIC_SHOCK, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        hemorrhagicShockAssessment: {
          mechanismAndPerfusionReviewedAtTick: null, pelvicStabilizationAtTick: null,
          majorHemorrhageActivatedAtTick: null, redCellsAtTick: null,
          coagulationAndTemperatureAtTick: null, reassessedAtTick: null,
          definitiveControlEscalatedAtTick: null,
        },
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 24,
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
      onHemorrhagicShockAssessment, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).not.toContain('No infusions running');
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    expect(button('Review mechanism + perfusion').disabled).toBe(false);
    expect(button('Record pelvic stabilization').disabled).toBe(true);
    expect(button('Escalate definitive bleeding control').disabled).toBe(true);
    expect(button('Activate major-hemorrhage response').disabled).toBe(true);
    expect(button('Give fixed 2-unit red-cell bridge').disabled).toBe(true);
    expect(button('Review coagulation + temperature').disabled).toBe(true);
    expect(button('Reassess perfusion').disabled).toBe(true);
    act(() => button('Review mechanism + perfusion').click());
    expect(onHemorrhagicShockAssessment).toHaveBeenCalledWith('review-mechanism-and-perfusion');
    act(() => root.render(createElement(ActionCockpit, {
      ...props,
      resuscitation: {
        ...props.resuscitation,
        hemorrhagicShockAssessment: {
          ...props.resuscitation.hemorrhagicShockAssessment!,
          mechanismAndPerfusionReviewedAtTick: 1,
        },
      },
    })));
    expect(button('Record pelvic stabilization').disabled).toBe(false);
    expect(button('Activate major-hemorrhage response').disabled).toBe(false);
    expect(button('Give fixed 2-unit red-cell bridge').disabled).toBe(true);
    expect(container.textContent).toContain('No TXA, calcium, component ratio');
  });
});
