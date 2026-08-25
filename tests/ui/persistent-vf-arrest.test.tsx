/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PERSISTENT_VF_ARREST } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';

describe('Requirement: emergency persistent VF uses one focused arrest tray', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('shows the declared third-cycle controls without unrelated trays', () => {
    const props: ActionCockpitProps = {
      scenario: PERSISTENT_VF_ARREST, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        cardiacArrestActive: true, chestCompressionsActive: false,
        chestCompressionSeconds: 0, compressionPerfusionFraction: 0,
        arrestEpinephrineTotalMg: 0, lastArrestEpinephrineTick: null,
        defibrillationShockCount: 2, lastDefibrillationEnergyJ: 200, roscAtTick: null },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 1, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onChestCompressions: () => {},
      onArrestEpinephrine: () => {}, onDefibrillation: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).toContain('Start compressions');
    expect(container.textContent).toContain('Prepare 1 mg IV');
    const energy = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '200 J') as HTMLButtonElement;
    act(() => energy.click());
    expect(container.textContent).toContain('Deliver 200 J');
    expect(container.textContent).not.toContain('Syringes');
  });
});
