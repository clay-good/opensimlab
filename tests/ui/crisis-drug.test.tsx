/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ActionCockpit, crisisResponseAvailability, type ActionCockpitProps,
} from '@anesthesia/ui/ActionCockpit';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { BRONCHOSPASM } from '@anesthesia/scenarios/bronchospasm';
import { PREECLAMPSIA_URGENT_DELIVERY } from '@anesthesia/scenarios/preeclampsia-urgent-delivery';
import { UNITED_KINGDOM, UNITED_STATES } from '@anesthesia/region/profiles';

const CRISIS_SCENARIO = {
  ...ROUTINE_INDUCTION,
  timeline: [{
    id: 'exposure', type: 'anaphylaxis' as const, atTick: 600,
    target: 'cefazolin', value: 0.9,
  }],
};

describe('Requirement: crisis epinephrine is explicit, bounded, and does not name a diagnosis', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'crisis-drug';
    style.textContent = [
      readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8'),
    ].join('\n');
    document.head.appendChild(style);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.querySelector('style[data-test-styles="crisis-drug"]')?.remove();
  });

  const renderCockpit = (
    region: ActionCockpitProps['region'],
    onEpinephrine = vi.fn(),
    overrides: Partial<ActionCockpitProps> = {},
  ) => {
    const props: ActionCockpitProps = {
      scenario: CRISIS_SCENARIO,
      region,
      infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0.4, epinephrineTotalMicrograms: 20,
        lastEpinephrineTick: 900, crystalloidTotalMl: 1000,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
      },
      lastExposure: { agentId: 'cefazolin', tick: 600 },
      syringeRemaining: {},
      ventilator: {
        mode: 'volume-control', tidalVolumeMl: 500, respiratoryRateBpm: 12,
        fio2: 1, peep: 5, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10,
      },
      intubated: true,
      airwayAttempts: 1,
      lastGrade: 1,
      jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {},
      onInfusion: () => {},
      onHypnoticLine: () => {},
      onFluid: () => {},
      onVentilator: () => {},
      onLaryngoscopy: () => {},
      onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {},
      onEpinephrine,
      onDantrolene: () => {},
      onActiveCooling: () => {},
      onDrugCard: () => {},
      ...overrides,
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onEpinephrine;
  };

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('shows the working tray only for a scenario that declares the crisis event', () => {
    renderCockpit(UNITED_STATES);
    expect(button('Crisis response')).toBeInstanceOf(HTMLButtonElement);

    const withoutCrisis = { ...CRISIS_SCENARIO, timeline: ROUTINE_INDUCTION.timeline };
    act(() => root.render(createElement(ActionCockpit, {
      scenario: withoutCrisis,
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
        fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2,
      },
      intubated: false,
      airwayAttempts: 0,
      lastGrade: null,
      jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    })));
    expect(button('Crisis response')).toBeUndefined();
  });

  it('uses regional terminology and requires confirmation of dose and IV route', () => {
    const onEpinephrine = renderCockpit(UNITED_KINGDOM);
    act(() => button('Crisis response')!.click());

    expect(container.textContent).toContain('Adrenaline');
    expect(container.textContent).toContain('Accepted total: 20 µg IV');
    expect(container.textContent).toContain('cefazolin was the most recent modeled trigger exposure');
    expect(container.textContent?.toLowerCase()).not.toContain('anaphylaxis');
    act(() => button('50 µg IV')!.click());
    expect(onEpinephrine).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Give 50 µg IV adrenaline?');
    act(() => button('Give Adrenaline')!.click());
    expect(onEpinephrine).toHaveBeenCalledWith(50);
    // Requested actions do not optimistically alter an accepted engine total.
    expect(container.textContent).toContain('Accepted total: 20 µg IV');
  });

  it('shows every matching rescue control after a manual injection into an ordinary scenario', () => {
    expect(crisisResponseAvailability(ROUTINE_INDUCTION, [
      'anaphylaxis', 'malignant-hyperthermia',
      'local-anesthetic-systemic-toxicity', 'cardiac-arrest-shockable', 'high-spinal',
    ])).toEqual({
      hasAnaphylaxisResponse: true,
      hasHypermetabolicResponse: true,
      hasLastResponse: true,
      hasCardiacArrestResponse: true,
      hasHighSpinalResponse: true,
      hasPreeclampsiaResponse: false,
      hasVenousAirEmbolismResponse: false,
      hasBronchospasmResponse: false,
    });
    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: ROUTINE_INDUCTION,
      injectedCrisisIds: [
        'anaphylaxis', 'malignant-hyperthermia',
        'local-anesthetic-systemic-toxicity', 'cardiac-arrest-shockable', 'high-spinal',
      ],
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        cardiacArrestActive: true, chestCompressionsActive: false,
        chestCompressionSeconds: 0, compressionPerfusionFraction: 0,
        arrestEpinephrineTotalMg: 0, lastArrestEpinephrineTick: null,
        defibrillationShockCount: 0, lastDefibrillationEnergyJ: null, roscAtTick: null,
        highSpinalFraction: 0.8, ephedrineTotalMg: 12, lastEphedrineTick: 900,
      },
    });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('Prepare IV benzodiazepine');
    expect(container.textContent).toContain('Prepare 2.5 mg/kg IV');
    expect(container.textContent).toContain('Start compressions');
    expect(container.textContent).toContain('Epinephrine');
    expect(container.textContent).toContain('High spinal response');
  });

  it('offers a minimal confirmed maternal-response sequence only in the declared lesson', () => {
    const onPreeclampsiaResponse = vi.fn();
    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: PREECLAMPSIA_URGENT_DELIVERY,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        preeclampsiaBloodPressureChecks: 1,
        lastPreeclampsiaBloodPressure: {
          systolicMmHg: 165, diastolicMmHg: 120, meanArterialMmHg: 135, tick: 10,
        },
        labetalolTotalMg: 0, labetalolEffectFraction: 0,
        magnesiumSulfateTotalG: 0,
      },
      onPreeclampsiaResponse,
    });
    expect(button('Maternal response')?.getAttribute('aria-selected')).toBe('true');
    expect(container.textContent).toContain('Confirm · treat · recheck');
    expect(container.textContent).toContain('Last BP 165/120 mmHg · check 1');
    expect(container.textContent).toContain('Magnesium is seizure prophylaxis');
    act(() => button('Syringes')!.click());
    expect(container.textContent).toContain('Open Maternal response for the focused controls');
    act(() => button('Maternal response')!.click());

    act(() => button('Labetalol 20 mg IV')!.click());
    expect(onPreeclampsiaResponse).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Give labetalol 20 mg IV?');
    act(() => button('Confirm')!.click());
    expect(onPreeclampsiaResponse).toHaveBeenCalledWith('labetalol-20mg-iv');
    act(() => button('Repeat blood pressure')!.click());
    expect(onPreeclampsiaResponse).toHaveBeenCalledWith('repeat-blood-pressure');
  });

  it('uses regional bronchodilator terminology and requires confirmation', () => {
    const onInhaledBronchodilator = vi.fn();
    const onBronchospasmHelp = vi.fn();
    renderCockpit(UNITED_STATES, vi.fn(), { scenario: BRONCHOSPASM });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('No lower-airway obstruction observed');
    expect(button('Prepare Albuterol 5 mg nebulized')?.disabled).toBe(true);

    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: BRONCHOSPASM,
      bronchospasmSeverity: 0.35,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        salbutamolTotalMg: 5, lastSalbutamolTick: 2500,
        bronchodilatorEffectFraction: 0.65,
      },
      onInhaledBronchodilator,
      onBronchospasmHelp,
    });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('Albuterol');
    expect(container.textContent).toContain('Accepted total: 5 mg');
    act(() => button('Call for help')!.click());
    expect(onBronchospasmHelp).toHaveBeenCalledOnce();
    act(() => button('Prepare Albuterol 5 mg nebulized')!.click());
    expect(onInhaledBronchodilator).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Give albuterol 5 mg nebulized?');
    act(() => button('Give Albuterol')!.click());
    expect(onInhaledBronchodilator).toHaveBeenCalledOnce();

    renderCockpit(UNITED_KINGDOM, vi.fn(), { scenario: BRONCHOSPASM });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('Salbutamol');
  });

  it('requires confirmation for the bounded high-spinal response actions', () => {
    const onEphedrine = vi.fn();
    const onHighSpinalHelp = vi.fn();
    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: ROUTINE_INDUCTION,
      injectedCrisisIds: ['high-spinal'],
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        highSpinalFraction: 0.5, ephedrineTotalMg: 6, lastEphedrineTick: 700,
      },
      onEphedrine,
      onHighSpinalHelp,
    });
    act(() => button('Crisis response')!.click());

    expect(container.textContent).toContain('Modeled progression 50%');
    act(() => button('Call for help')!.click());
    expect(onHighSpinalHelp).toHaveBeenCalledOnce();
    act(() => button('12 mg')!.click());
    expect(onEphedrine).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Give ephedrine 12 mg IV?');
    act(() => button('Give ephedrine')!.click());
    expect(onEphedrine).toHaveBeenCalledWith(12);
  });

  it('exposes confirmed source control for a manually injected venous-air event', () => {
    const onControlVenousAirEntry = vi.fn();
    const onVenousAirEmbolismHelp = vi.fn();
    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: ROUTINE_INDUCTION,
      injectedCrisisIds: ['air-embolism'],
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        venousAirEmbolismFraction: 0.7, venousAirEntryControlled: false,
        venousAirEntryControlledAtTick: null,
      },
      onControlVenousAirEntry,
      onVenousAirEmbolismHelp,
    });
    act(() => button('Crisis response')!.click());
    expect(container.textContent).toContain('Modeled burden 70%');
    act(() => button('Call for help')!.click());
    expect(onVenousAirEmbolismHelp).toHaveBeenCalledOnce();
    act(() => button('Stop suspected air entry')!.click());
    expect(onControlVenousAirEntry).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Record intent to stop further air entry?');
    act(() => button('Confirm source control')!.click());
    expect(onControlVenousAirEntry).toHaveBeenCalledOnce();
  });

  it('offers only bounded presets, no hostile free-dose or route field, inside the phone scroll area', () => {
    renderCockpit(UNITED_STATES);
    act(() => button('Crisis response')!.click());

    const doseButtons = [...container.querySelectorAll('button')]
      .filter((entry) => /^\d+ µg IV$/.test(entry.textContent?.trim() ?? ''));
    expect(doseButtons.map((entry) => entry.textContent?.trim())).toEqual(['10 µg IV', '20 µg IV', '50 µg IV']);
    expect(container.querySelectorAll('input')).toHaveLength(0);
    expect(doseButtons[0]?.closest('.actions__tray')).not.toBeNull();
    expect(container.textContent).toContain('Concentration, dilution, pump delivery, and syringe inventory are not modeled.');
  });

  it('computes every dose and confirmation control to at least a 44px touch height', () => {
    renderCockpit(UNITED_STATES);
    act(() => button('Crisis response')!.click());

    const assertTouchHeight = (control: HTMLButtonElement) => {
      expect(getComputedStyle(control).minBlockSize, control.outerHTML).toBe('44px');
    };
    for (const label of ['10 µg IV', '20 µg IV', '50 µg IV']) assertTouchHeight(button(label)!);

    act(() => button('50 µg IV')!.click());
    assertTouchHeight(button('Give Epinephrine')!);
    assertTouchHeight(button('Cancel')!);
  });
});
