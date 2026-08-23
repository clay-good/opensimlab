/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE } from '@anesthesia/scenarios/difficult-airway-supraglottic-rescue';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: difficult-airway rescue reflects accepted engine state', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'difficult-airway-rescue';
    style.textContent = [
      readFileSync(join(process.cwd(), 'src/platform/tokens/tokens.generated.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8'),
    ].join('\n');
    document.head.appendChild(style);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.querySelector('style[data-test-styles="difficult-airway-rescue"]')?.remove();
  });

  const baseProps = (): ActionCockpitProps => ({
    scenario: DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE,
    region: UNITED_STATES,
    infusions: [],
    hypnoticLine: { connected: true, inspected: false },
    resuscitation: {
      epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0,
      dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
      lastDantroleneTick: null, activeCooling: false,
    },
    lastExposure: null,
    syringeRemaining: {},
    ventilator: {
      mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12,
      fio2: 1, peep: 5, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10,
    },
    intubated: false,
    airwayAttempts: 1,
    lastGrade: 4,
    airwayAttemptInProgress: false,
    airwayAttemptSecondsRemaining: 0,
    jawThrustCpapSecondsRemaining: 0,
    airwayDevice: 'facemask',
    supraglotticInsertionSecondsRemaining: 0,
    helpRequestedAtTick: null,
    muscleRigidityFraction: 0,
    onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
    onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
    onAirwayManeuver: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
    onEpinephrine: () => {}, onDantrolene: () => {}, onActiveCooling: () => {},
    onDrugCard: () => {},
  });

  const render = (overrides: Partial<ActionCockpitProps> = {}) => {
    const props = { ...baseProps(), ...overrides };
    act(() => root.render(createElement(ActionCockpit, props)));
    return props;
  };

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  const openAirwayTray = () => act(() => button('Airway & Vent')!.click());

  it('offers rescue controls only when the scenario declares the difficult-airway event', () => {
    render({ scenario: ROUTINE_INDUCTION });
    openAirwayTray();
    expect(button('Call for help')).toBeUndefined();
    expect(button('Insert supraglottic airway')).toBeUndefined();

    render();
    expect(button('Call for help')).toBeInstanceOf(HTMLButtonElement);
    expect(button('Insert supraglottic airway')).toBeInstanceOf(HTMLButtonElement);
  });

  it('dispatches exact actions without optimistically changing accepted status', () => {
    const onCallForHelp = vi.fn();
    const onAirwayDevice = vi.fn();
    render({ onCallForHelp, onAirwayDevice });
    openAirwayTray();

    act(() => button('Call for help')!.click());
    act(() => button('Insert supraglottic airway')!.click());

    expect(onCallForHelp).toHaveBeenCalledOnce();
    expect(onAirwayDevice).toHaveBeenCalledWith('supraglottic-airway');
    expect(container.textContent).toContain('No help request has been recorded.');
    expect(container.textContent).toContain('No supraglottic airway insertion has been started.');
  });

  it('announces phase changes without putting the per-second countdown in the live region', () => {
    render({ helpRequestedAtTick: 1_200, supraglotticInsertionSecondsRemaining: 15 });
    openAirwayTray();

    const live = container.querySelector('#airway-rescue-status')!;
    const countdown = container.querySelector('#airway-rescue-countdown')!;
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toContain('Help has been requested.');
    expect(live.textContent).toContain('Ventilation is interrupted.');
    expect(live.textContent).not.toMatch(/\d+ simulated seconds/);
    expect(countdown.getAttribute('aria-live')).toBe('off');
    expect(countdown.textContent).toContain('15 simulated seconds remaining');
    expect(button('Insert supraglottic airway')!.disabled).toBe(true);
    expect(button('Direct laryngoscopy')!.disabled).toBe(true);
    expect(button('Videolaryngoscopy')!.disabled).toBe(true);

    render({ helpRequestedAtTick: 1_200, supraglotticInsertionSecondsRemaining: 14 });
    expect(container.querySelector('#airway-rescue-status')!.textContent).toBe(live.textContent);
    expect(container.querySelector('#airway-rescue-countdown')!.textContent)
      .toContain('14 simulated seconds remaining');
  });

  it('disables conflicting controls and says placement does not deliver breaths', () => {
    render({ airwayDevice: 'supraglottic-airway', helpRequestedAtTick: 1_200 });
    openAirwayTray();

    expect(button('Call for help')!.disabled).toBe(true);
    expect(button('Insert supraglottic airway')!.disabled).toBe(true);
    expect(button('Direct laryngoscopy')!.disabled).toBe(true);
    expect(button('Videolaryngoscopy')!.disabled).toBe(true);
    expect(container.textContent).toContain('It does not deliver breaths automatically.');
    expect(container.textContent).toContain('confirm sustained gas exchange from the capnogram');
  });

  it('keeps both time-critical controls at least 44 by 44 CSS pixels inside the tray', () => {
    render();
    openAirwayTray();

    for (const label of ['Call for help', 'Insert supraglottic airway']) {
      const control = button(label)!;
      expect(getComputedStyle(control).minBlockSize, control.outerHTML).toBe('44px');
      expect(getComputedStyle(control).minInlineSize, control.outerHTML).toBe('44px');
      expect(control.closest('.actions__tray')).not.toBeNull();
    }
  });
});
