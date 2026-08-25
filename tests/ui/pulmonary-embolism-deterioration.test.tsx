/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PULMONARY_EMBOLISM_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/pulmonary-embolism-deterioration';

describe('Requirement: deteriorating pulmonary embolism is a focused serial lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with severity review and keeps unsupported treatment selection out', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: PULMONARY_EMBOLISM_DETERIORATION, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pulmonaryEmbolismAssessment: { severityReviewedAtTick: null, oxygenAtTick: null,
          anticoagulationAtTick: null, deteriorationAtTick: null, escalationAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 420, respiratoryRateBpm: 30, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onPulmonaryEmbolismResponse: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {},
      onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review confirmed PE + severity').disabled).toBe(false);
    expect(button('Record titrated oxygen intent').disabled).toBe(true);
    expect(button('Reassess pressure + perfusion').disabled).toBe(true);
    expect(container.textContent).not.toMatch(/alteplase \d|heparin \d|thrombectomy device/i);
    act(() => button('Review confirmed PE + severity').click());
    expect(onAction).toHaveBeenCalledWith('review-confirmed-pe-severity');
  });
});
