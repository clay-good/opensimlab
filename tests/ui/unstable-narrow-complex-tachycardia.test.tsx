/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';

describe('Requirement: unstable narrow-complex tachycardia is a focused response lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('starts with whole-patient instability review and hides unsupported energy and drugs', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: UNSTABLE_NARROW_COMPLEX_TACHYCARDIA, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        unstableNarrowTachycardiaAssessment: { reviewedAtTick: null, preparedAtTick: null,
          cardiovertedAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 460, respiratoryRateBpm: 24, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onUnstableNarrowTachycardiaResponse: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {},
      onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review rhythm + instability').disabled).toBe(false);
    expect(button('Prepare support + synchronized pads').disabled).toBe(true);
    expect(button('Record synchronized cardioversion intent').disabled).toBe(true);
    expect(container.textContent).toContain('routine oxygen is not selected');
    expect(container.textContent).not.toMatch(/\d+ J|adenosine \d|midazolam \d|propofol \d/i);
    act(() => button('Review rhythm + instability').click());
    expect(onAction).toHaveBeenCalledWith('review-rhythm-and-instability');
  });
});
