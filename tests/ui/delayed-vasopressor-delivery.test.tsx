/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { DELAYED_VASOPRESSOR_DELIVERY as SCENARIO } from '../../src/modules/critical-care/scenarios/delayed-vasopressor-delivery';

describe('Requirement: delayed vasopressor delivery separates command from arrival', () => {
  it('keeps the full path, anti-bolus guardrail, and response proof visible', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container); const onAction = vi.fn();
    const props = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        delayedVasopressorDeliveryAssessment: { discordanceAtTick: null, pathAtTick: null,
          classifiedAtTick: null, protocolAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'volume-control',
        tidalVolumeMl: 410, respiratoryRateBpm: 20, fio2: 0.4, peep: 0, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: true, airwayAttempts: 0,
      lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDelayedVasopressorDeliveryResponse: onAction, onDrugCard: () => {},
    } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Running is not arriving.');
    expect(container.textContent).toContain('Move the drug, not the risk.');
    expect(container.textContent).toContain('commanded · in transit · delivered · effect');
    expect(container.textContent).toContain('local protocol · no flush · prove response');
    const first = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Separate command from delivery'));
    act(() => first?.click());
    expect(onAction).toHaveBeenCalledWith('review-vasopressor-command-delivery-discordance');
    act(() => root.unmount()); container.remove();
  });
});
