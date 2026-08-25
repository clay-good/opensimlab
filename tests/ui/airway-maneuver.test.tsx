/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { POST_EXTUBATION_OBSTRUCTION } from '@anesthesia/scenarios/post-extubation-obstruction';
import { OPIOID_INDUCED_VENTILATORY_IMPAIRMENT } from '@anesthesia/scenarios/opioid-induced-ventilatory-impairment';
import { UNITED_STATES } from '@anesthesia/region/profiles';

describe('Requirement: bounded upper-airway support is operable without naming the diagnosis', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderCockpit = (
    secondsRemaining: number,
    onAirwayManeuver = vi.fn(),
    delivering = true,
    scenario: ActionCockpitProps['scenario'] = ROUTINE_INDUCTION,
    onCallForHelp = vi.fn(),
    opioidVentilatoryResponse?: NonNullable<
      ActionCockpitProps['resuscitation']['opioidVentilatoryResponse']
    >,
    onOpioidVentilatoryResponse = vi.fn(),
  ) => {
    const props: ActionCockpitProps = {
      scenario,
      region: UNITED_STATES,
      infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        opioidVentilatoryResponse,
      },
      lastExposure: null,
      syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 1, peep: 5, delivering, sevofluranePercent: 0, freshGasFlowLPerMin: 2,
      },
      intubated: false,
      airwayAttempts: 0,
      lastGrade: null,
      jawThrustCpapSecondsRemaining: secondsRemaining,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {},
      onInfusion: () => {},
      onHypnoticLine: () => {},
      onFluid: () => {},
      onVentilator: () => {},
      onLaryngoscopy: () => {},
      onAirwayManeuver,
      onCallForHelp, onAirwayDevice: () => {},
      onOpioidVentilatoryResponse,
      onEpinephrine: () => {},
      onDantrolene: () => {},
      onActiveCooling: () => {},
      onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onAirwayManeuver;
  };

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('dispatches the fixed held maneuver from a standard keyboard button', () => {
    const onAirwayManeuver = renderCockpit(0);
    act(() => button('Airway & Vent')!.click());

    const maneuver = button('Apply jaw thrust + continuous positive pressure');
    expect(maneuver).toBeInstanceOf(HTMLButtonElement);
    expect(maneuver!.className).not.toContain('button--compact');
    expect(maneuver!.closest('.actions__tray')).not.toBeNull();
    expect(maneuver!.getAttribute('aria-describedby')).toBe('jaw-thrust-cpap-status');
    expect(container.textContent).toContain('fixed 90-second teaching-model hold');
    expect(container.textContent).toContain('not a recommended clinical duration');
    act(() => maneuver!.click());
    expect(onAirwayManeuver).toHaveBeenCalledWith('jaw-thrust-cpap');
  });

  it('shows bounded progress and prevents stacking the maneuver', () => {
    renderCockpit(13.2);
    act(() => button('Airway & Vent')!.click());

    const maneuver = button('Apply jaw thrust + continuous positive pressure');
    expect(maneuver!.disabled).toBe(true);
    expect(container.textContent).toContain('continuous positive pressure in progress: 14 simulated seconds remaining');
    expect(container.textContent?.toLowerCase()).not.toContain('laryngospasm');
  });

  it('does not claim positive pressure is delivered when only the jaw-thrust hold is active', () => {
    renderCockpit(12, vi.fn(), false);
    act(() => button('Airway & Vent')!.click());

    expect(container.textContent).toContain('The ventilator is not delivering positive pressure.');
    expect(container.textContent).not.toContain('continuous positive pressure in progress');
  });

  it('opens directly to focused post-extubation support without exposing an invented rescue device', () => {
    const onCallForHelp = vi.fn();
    renderCockpit(0, vi.fn(), false, POST_EXTUBATION_OBSTRUCTION, onCallForHelp);

    expect(button('Apply jaw thrust + continuous positive pressure')).toBeInstanceOf(HTMLButtonElement);
    expect(button('Call for help')).toBeInstanceOf(HTMLButtonElement);
    expect(button('Insert supraglottic airway')).toBeUndefined();
    expect(button('Direct laryngoscopy')).toBeUndefined();
    expect(button('Videolaryngoscopy')).toBeUndefined();
    expect(container.textContent).not.toContain('No attempt yet');
    act(() => button('Call for help')!.click());
    expect(onCallForHelp).toHaveBeenCalledOnce();
  });

  it('offers an ordered opioid hold and dose-free naloxone intent in the focused airway tray', () => {
    const onResponse = vi.fn();
    renderCockpit(0, vi.fn(), false, OPIOID_INDUCED_VENTILATORY_IMPAIRMENT, vi.fn(), {
      severity: 0.8, furtherOpioidHeldAtTick: null, naloxoneIntentAtTick: null,
    }, onResponse);

    expect(button('Direct laryngoscopy')).toBeUndefined();
    expect(button('Apply jaw thrust + continuous positive pressure')).toBeUndefined();
    expect(button('Hold further opioid')!.classList).toContain('opioid-response__action');
    expect(button('Hold further opioid')!.disabled).toBe(false);
    expect(button('Record naloxone titration intent')!.disabled).toBe(true);
    expect(container.textContent).toContain('supplies no naloxone dose');
    act(() => button('Hold further opioid')!.click());
    expect(onResponse).toHaveBeenCalledWith('hold-further-opioid');

    renderCockpit(0, vi.fn(), false, OPIOID_INDUCED_VENTILATORY_IMPAIRMENT, vi.fn(), {
      severity: 0.7, furtherOpioidHeldAtTick: 120, naloxoneIntentAtTick: null,
    }, onResponse);
    expect(button('Record naloxone titration intent')!.disabled).toBe(false);
    act(() => button('Record naloxone titration intent')!.click());
    expect(onResponse).toHaveBeenCalledWith('record-naloxone-titration');
  });
});
