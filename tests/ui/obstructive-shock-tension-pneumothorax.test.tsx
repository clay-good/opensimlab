/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/obstructive-shock-tension-pneumothorax';

describe('Requirement: the ED pleural crisis is focused and non-procedural', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('shows one focused response with oxygen and intent-only decompression', () => {
    const onVentilator = vi.fn();
    const props: ActionCockpitProps = {
      scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        tensionPneumothoraxFraction: 0.8, pneumothoraxAssessedAtTick: null,
        pneumothoraxDecompressedAtTick: null,
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 26,
        fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator,
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onPneumothoraxHelp: () => {},
      onPneumothoraxResponse: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(container.textContent).not.toContain('No infusions running');
    expect(button('Give high-concentration oxygen').disabled).toBe(false);
    act(() => button('Give high-concentration oxygen').click());
    expect(onVentilator).toHaveBeenCalledWith({ fio2: 1 });
    expect(container.textContent).toContain('does not relieve obstructed venous return');
    expect(container.textContent).toContain('no procedural instruction');
  });
});
