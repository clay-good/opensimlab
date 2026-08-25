/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COMPLETE_HEART_BLOCK as SCENARIO } from '../../src/modules/cardiology/scenarios/complete-heart-block';

describe('Requirement: complete heart block opens calm pacing-capable escalation', () => {
  it('keeps atrial and escape rates distinct without exposing device operations', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, seizureSuppressed: false,
        completeHeartBlockAssessment: { stabilityAtTick: null, contextAtTick: null,
          pathwayAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
          hemodynamicallyStable: true, pacingDelivered: false, captureAssessed: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450,
        respiratoryRateBpm: 16, fio2: 0.21, peep: 5, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onCompleteHeartBlockResponse: onAction, onDrugCard: () => {}
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Two rhythms. One patient.');
    expect(container.textContent).toContain('atria 82/min · escape 34/min');
    expect(container.textContent).toContain('Prepare early. Decide together.');
    expect(container.textContent).not.toMatch(/1 mg|\d+\s*mA|implant dual|select device|declare capture|provide routine oxygen/i);
    const reconcile = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile block + stability'));
    act(() => reconcile?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-complete-heart-block-stability');
    act(() => root.unmount()); container.remove();
  });
});
