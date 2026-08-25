/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEPTIC_SHOCK_RESUSCITATION as SCENARIO } from '../../src/modules/critical-care/scenarios/septic-shock-resuscitation';

describe('Requirement: persistent septic-shock resuscitation stays targeted and bounded', () => {
  it('keeps perfusion, dynamic response, fluid exit, and source control visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        septicShockResuscitationAssessment: { contextAtTick: null, perfusionAtTick: null,
          fluidResponseAtTick: null, planAtTick: null, reassessedAtTick: null,
          passiveLegRaiseStrokeVolumeChangePercent: 2, blindRepeatFluidOffered: false } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 440, respiratoryRateBpm: 24, fio2: 0.35, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onSepticShockResuscitationResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Resuscitation is a loop, not a liter count.');
    expect(container.textContent).toContain('MAP 64 · refill 5 s · lactate 5.8 → 6.4');
    expect(container.textContent).toContain('Fluid needs a target and an exit.');
    expect(container.textContent).toContain('PLR SV +2% · new B-lines · no blind repeat bolus');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reconcile care + response'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-septic-shock-resuscitation-so-far');
    act(() => root.unmount()); container.remove();
  });
});
