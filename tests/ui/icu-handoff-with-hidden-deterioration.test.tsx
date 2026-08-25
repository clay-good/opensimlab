/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ICU_HANDOFF_WITH_HIDDEN_DETERIORATION as SCENARIO } from '../../src/modules/critical-care/scenarios/icu-handoff-with-hidden-deterioration';

describe('Requirement: ICU handoff makes hidden deterioration inspectable', () => {
  it('keeps trend verification, escalation, ownership, and acceptance boundaries visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        icuHiddenDeteriorationHandoffAssessment: { readinessAtTick: null, contentAtTick: null,
          crossCheckAtTick: null, escalationAtTick: null, acceptanceAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onIcuHiddenDeteriorationHandoffResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Receive the story. Check the patient.');
    expect(container.textContent).toContain('Make the next move unmistakable.');
    expect(container.textContent).toContain('“stable” · support rising · perfusion falling');
    expect(container.textContent).toContain('severity · action · trigger · contingency · owner');
    const ready = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Establish readiness + bedside coverage'));
    act(() => ready?.click());
    expect(onAction).toHaveBeenCalledWith('establish-icu-handoff-readiness');
    act(() => root.unmount()); container.remove();
  });
});
