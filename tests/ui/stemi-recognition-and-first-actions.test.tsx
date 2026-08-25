/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS as SCENARIO } from '../../src/modules/cardiology/scenarios/stemi-recognition-and-first-actions';

describe('Requirement: clinic STEMI actions stay immediate, parallel, and calm', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('unlocks EMS and danger review together without unsupported treatment controls', () => {
    const onAction = vi.fn();
    const base = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        clinicStemiAssessment: { patternAtTick: null, dangerAtTick: null,
          transferAtTick: null, bridgeAtTick: null, handoffAtTick: null,
          pciCapableSetting: false, biomarkerDelayUsed: false,
          downstreamTherapySelected: false, treatmentDelivered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 16, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onClinicStemiResponse: onAction, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    const render = (patternAtTick: number | null) => act(() => root.render(createElement(
      ActionCockpit, { ...base, resuscitation: { ...base.resuscitation,
        clinicStemiAssessment: { ...base.resuscitation.clinicStemiAssessment,
          patternAtTick } } },
    )));
    render(null);
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Reconcile symptoms + fixed ECG').disabled).toBe(false);
    expect(button('Activate EMS + regional STEMI system').disabled).toBe(true);
    expect(button('Screen danger in parallel').disabled).toBe(true);
    expect(container.textContent).toContain('The teaching monitor is not a diagnostic 12-lead.');
    expect(container.textContent).toContain('No routine oxygen at 96%.');
    expect(container.textContent).not.toMatch(/primary PCI|ticagrelor|heparin|fibrinolytic dose|nitroglycerin|morphine/i);
    render(1);
    expect(button('Activate EMS + regional STEMI system').disabled).toBe(false);
    expect(button('Screen danger in parallel').disabled).toBe(false);
    act(() => button('Activate EMS + regional STEMI system').click());
    expect(onAction).toHaveBeenCalledWith('activate-clinic-stemi-transfer');
  });
});
