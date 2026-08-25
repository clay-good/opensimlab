/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CARDIAC_TAMPONADE } from '../../src/modules/emergency-medicine/scenarios/cardiac-tamponade';

describe('Requirement: cardiac tamponade is a focused intent-only lab', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('orders whole-patient review, fixed POCUS, control, and reassessment', () => {
    const onAction = vi.fn();
    const props: ActionCockpitProps = {
      scenario: CARDIAC_TAMPONADE, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null,
        activeCooling: false, cardiacTamponadeFraction: 0.8, cardiacTamponadeAssessment: {
          contextReviewedAtTick: null, pocusReviewedAtTick: null, definitiveControlAtTick: null, reassessedAtTick: null } },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500,
        respiratoryRateBpm: 24, fio2: 0.6, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onCardiacTamponadeAssessment: onAction,
      onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    const button = (label: string) => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement;
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    expect(button('Review context + perfusion').disabled).toBe(false);
    expect(button('Review fixed POCUS finding').disabled).toBe(true);
    expect(button('Record immediate definitive-control intent').disabled).toBe(true);
    act(() => button('Review context + perfusion').click());
    expect(onAction).toHaveBeenCalledWith('review-context-and-perfusion');
    expect(container.textContent).toContain('does not acquire images');
    expect(container.textContent).toContain('No pericardiocentesis or thoracotomy technique');
  });
});
