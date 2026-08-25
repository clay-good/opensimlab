/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEA_ARREST } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';

describe('Requirement: PEA opens a focused nonshockable arrest surface', () => {
  it('offers compressions and epinephrine but no defibrillation energy', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container);
    const props = { scenario: PEA_ARREST, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, cardiacArrestActive: true,
        chestCompressionsActive: false, chestCompressionSeconds: 0,
        arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, roscAtTick: null },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500,
        respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {} } satisfies ActionCockpitProps;
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Start compressions');
    expect(container.textContent).toContain('Prepare 1 mg IV');
    expect(container.textContent).toContain('PEA · continue CPR + treat reversible causes');
    expect(container.textContent).not.toMatch(/120 J|150 J|200 J|Deliver \d+ J/);
    act(() => root.unmount()); container.remove();
  });
});
