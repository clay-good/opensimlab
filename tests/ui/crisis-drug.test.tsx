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
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';
import { ASPIRATION_RISK_RECOGNITION } from '@anesthesia/scenarios/aspiration-risk-recognition';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { DELAYED_EMERGENCE_DIFFERENTIAL } from '@anesthesia/scenarios/delayed-emergence-differential';
import { EXTUBATION_READINESS } from '@anesthesia/scenarios/extubation-readiness';
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
      hasPneumothoraxResponse: false,
      hasAspirationRiskResponse: false,
      hasCiedPlanningResponse: false,
      hasPostoperativeHandoffResponse: false,
      hasUndifferentiatedShockResponse: false,
      hasSepticShockResponse: false,
      hasHemorrhagicShockResponse: false,
      hasCardiacTamponadeResponse: false,
      hasEmergencyAnaphylaxisResponse: false,
      hasAdultAsthmaResponse: false,
      hasCopdExacerbationResponse: false,
      hasAcutePulmonaryEdemaResponse: false,
      hasPulmonaryEmbolismResponse: false,
      hasStemiResponse: false,
      hasUnstableNarrowTachycardiaResponse: false,
      hasEmergenceResidualBlockResponse: false,
      hasDelayedEmergenceResponse: false,
      hasExtubationReadinessResponse: false,
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

  it('opens the focused pleural response and confirms decompression intent', () => {
    const onPneumothoraxHelp = vi.fn();
    const onPneumothoraxResponse = vi.fn();
    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        tensionPneumothoraxFraction: 0.7,
        pneumothoraxAssessedAtTick: null, pneumothoraxDecompressedAtTick: null,
      },
      onPneumothoraxHelp,
      onPneumothoraxResponse,
    });
    expect(button('Crisis response')?.getAttribute('aria-selected')).toBe('true');
    expect(container.textContent).toContain('Check both sides · escalate · oxygenate');
    expect(container.textContent).toContain('Modeled burden 70%');
    act(() => button('Check bilateral ventilation')!.click());
    expect(onPneumothoraxResponse).toHaveBeenCalledWith('assess-bilateral-ventilation');
    act(() => button('Call for help')!.click());
    expect(onPneumothoraxHelp).toHaveBeenCalledOnce();
    act(() => button('Decompress left chest')!.click());
    expect(onPneumothoraxResponse).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Record immediate left-chest decompression intent?');
    act(() => button('Confirm decompression intent')!.click());
    expect(onPneumothoraxResponse).toHaveBeenLastCalledWith('decompress-left-chest');
  });

  it('keeps pleural crisis actions quiet until the observable pattern begins', () => {
    renderCockpit(UNITED_STATES, vi.fn(), {
      scenario: PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        tensionPneumothoraxFraction: 0,
        pneumothoraxAssessedAtTick: null, pneumothoraxDecompressedAtTick: null,
      },
    });
    expect(container.textContent).toContain('Awaiting an observable change');
    expect(button('Check bilateral ventilation')?.disabled).toBe(true);
    expect(button('Call for help')?.disabled).toBe(true);
    expect(button('Decompress left chest')?.disabled).toBe(true);
  });

  it('opens the aspiration check and makes classification precede a confirmed disposition', () => {
    const onAspirationRiskAssessment = vi.fn();
    const base = {
      scenario: ASPIRATION_RISK_RECOGNITION,
      onAspirationRiskAssessment,
    };
    renderCockpit(UNITED_STATES, vi.fn(), {
      ...base,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        aspirationRiskAssessment: {
          cuesReviewedAtTick: null, classification: null, classifiedAtTick: null,
          plan: null, planAtTick: null,
        },
      },
    });
    expect(button('Aspiration check')?.getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[role="tab"]')?.textContent).toBe('Aspiration check');
    expect(button('Elevated delayed-emptying risk')?.disabled).toBe(true);
    act(() => button('Review aspiration-risk cues')!.click());
    expect(onAspirationRiskAssessment).toHaveBeenCalledWith('review-cues');

    renderCockpit(UNITED_STATES, vi.fn(), {
      ...base,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        aspirationRiskAssessment: {
          cuesReviewedAtTick: 1, classification: null, classifiedAtTick: null,
          plan: null, planAtTick: null,
        },
      },
    });
    expect(container.textContent).toContain('Week 3 escalation · dose increased 3 days ago');
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    act(() => button('Elevated delayed-emptying risk')!.click());
    expect(onAspirationRiskAssessment).toHaveBeenCalledWith('classify-elevated');

    renderCockpit(UNITED_STATES, vi.fn(), {
      ...base,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        aspirationRiskAssessment: {
          cuesReviewedAtTick: 1, classification: 'elevated', classifiedAtTick: 2,
          plan: null, planAtTick: null,
        },
      },
    });
    act(() => button('Defer elective case')!.click());
    expect(onAspirationRiskAssessment).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Record elective deferral and shared replanning?');
    act(() => button('Confirm choice')!.click());
    expect(onAspirationRiskAssessment).toHaveBeenLastCalledWith('defer-and-replan');
  });

  it('opens the emergence check and protects the airway after quantitative review', () => {
    const onEmergenceResidualBlockAssessment = vi.fn();
    const base = {
      scenario: EMERGENCE_WITH_RESIDUAL_BLOCKADE,
      trainOfFourCount: 4,
      trainOfFourRatio: 0.72,
      onEmergenceResidualBlockAssessment,
    };
    renderCockpit(UNITED_STATES, vi.fn(), {
      ...base,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        emergenceResidualBlockAssessment: {
          monitorReviewedAtTick: null, classification: null, classifiedAtTick: null,
          plan: null, planAtTick: null,
        },
      },
    });
    expect(button('Emergence check')?.getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[role="tab"]')?.textContent).toBe('Emergence check');
    expect(button('Residual blockade')?.disabled).toBe(true);
    act(() => button('Review quantitative monitor')!.click());
    expect(onEmergenceResidualBlockAssessment).toHaveBeenCalledWith('review-quantitative-monitor');

    renderCockpit(UNITED_STATES, vi.fn(), {
      ...base,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        emergenceResidualBlockAssessment: {
          monitorReviewedAtTick: 1, classification: null, classifiedAtTick: null,
          plan: null, planAtTick: null,
        },
      },
    });
    expect(container.textContent).toContain('TOF 4/4 · ratio 0.72 · no detectable fade');
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    act(() => button('Residual blockade')!.click());
    expect(onEmergenceResidualBlockAssessment).toHaveBeenCalledWith('classify-residual');

    renderCockpit(UNITED_STATES, vi.fn(), {
      ...base,
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        emergenceResidualBlockAssessment: {
          monitorReviewedAtTick: 1, classification: 'residual', classifiedAtTick: 2,
          plan: null, planAtTick: null,
        },
      },
    });
    act(() => button('Defer extubation + support')!.click());
    expect(container.textContent).toContain('Keep the tube and delivered ventilation in place?');
    act(() => button('Confirm choice')!.click());
    expect(onEmergenceResidualBlockAssessment)
      .toHaveBeenLastCalledWith('defer-extubation-and-support');
  });

  it('reveals the delayed-emergence differential in order and confirms escalation', () => {
    const onDelayedEmergenceAssessment = vi.fn();
    const base = {
      scenario: DELAYED_EMERGENCE_DIFFERENTIAL, onDelayedEmergenceAssessment,
    };
    const assessment = (values: Partial<NonNullable<
      ActionCockpitProps['resuscitation']['delayedEmergenceAssessment']
    >> = {}) => ({
      supportReviewedAtTick: null, exposureReviewedAtTick: null,
      metabolicReviewedAtTick: null, neurologicExamAtTick: null,
      escalation: null, escalatedAtTick: null, ...values,
    } as const);
    const renderAssessment = (values = assessment()) => renderCockpit(
      UNITED_STATES, vi.fn(), {
        ...base,
        resuscitation: {
          epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
          lastEpinephrineTick: null, crystalloidTotalMl: 0,
          dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
          lastDantroleneTick: null, activeCooling: false,
          delayedEmergenceAssessment: values,
        },
      },
    );

    renderAssessment();
    expect(button('Emergence differential')?.getAttribute('aria-selected')).toBe('true');
    expect(button('Reconcile drugs + block')?.disabled).toBe(true);
    act(() => button('Review immediate support')!.click());
    expect(onDelayedEmergenceAssessment).toHaveBeenCalledWith('review-support');

    renderAssessment(assessment({ supportReviewedAtTick: 1 }));
    expect(container.textContent).toContain('Tube + ventilation established · physiology stable');
    act(() => button('Reconcile drugs + block')!.click());
    renderAssessment(assessment({ supportReviewedAtTick: 1, exposureReviewedAtTick: 2 }));
    expect(container.textContent).toContain('Agents off · no benzodiazepine · TOF ratio 0.95');
    act(() => button('Check reversible causes')!.click());

    renderAssessment(assessment({
      supportReviewedAtTick: 1, exposureReviewedAtTick: 2, metabolicReviewedAtTick: 3,
    }));
    expect(container.textContent).toContain('Glucose 102 · PaCO₂ 41 · sodium 139 · 36.7°C');
    act(() => button('Perform focused neurologic exam')!.click());
    renderAssessment(assessment({
      supportReviewedAtTick: 1, exposureReviewedAtTick: 2, metabolicReviewedAtTick: 3,
      neurologicExamAtTick: 4,
    }));
    expect(container.textContent).toContain('Left arm localizes · right absent · left gaze preference');
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    act(() => button('Escalate urgently')!.click());
    expect(container.textContent).toContain(
      'Record urgent neurologic evaluation while support continues?',
    );
    act(() => button('Confirm choice')!.click());
    expect(onDelayedEmergenceAssessment)
      .toHaveBeenLastCalledWith('urgent-neurologic-evaluation');
  });

  it('integrates extubation checkpoints before confirming awake readiness', () => {
    const onExtubationReadinessAssessment = vi.fn();
    const base = { scenario: EXTUBATION_READINESS, onExtubationReadinessAssessment };
    const assessment = (values: Partial<NonNullable<
      ActionCockpitProps['resuscitation']['extubationReadinessAssessment']
    >> = {}) => ({
      quantitativeRecoveryReviewedAtTick: null, awakeAirwayReviewedAtTick: null,
      gasExchangeReviewedAtTick: null, airwayPlanReviewedAtTick: null,
      decision: null, decidedAtTick: null, ...values,
    } as const);
    const renderAssessment = (values = assessment()) => renderCockpit(
      UNITED_STATES, vi.fn(), {
        ...base,
        resuscitation: {
          epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
          lastEpinephrineTick: null, crystalloidTotalMl: 0,
          dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
          lastDantroleneTick: null, activeCooling: false,
          extubationReadinessAssessment: values,
        },
      },
    );

    renderAssessment();
    expect(button('Extubation readiness')?.getAttribute('aria-selected')).toBe('true');
    expect(button('Review awake airway')?.disabled).toBe(true);
    act(() => button('Review quantitative recovery')!.click());
    expect(onExtubationReadinessAssessment).toHaveBeenCalledWith('review-quantitative-recovery');

    renderAssessment(assessment({ quantitativeRecoveryReviewedAtTick: 1 }));
    expect(container.textContent).toContain('TOF ratio 0.93 · necessary, not sufficient');
    act(() => button('Review awake airway')!.click());
    renderAssessment(assessment({
      quantitativeRecoveryReviewedAtTick: 1, awakeAirwayReviewedAtTick: 2,
    }));
    expect(container.textContent).toContain(
      'Eyes open · follows commands · strong cough · secretions cleared',
    );
    act(() => button('Review gas exchange')!.click());
    renderAssessment(assessment({
      quantitativeRecoveryReviewedAtTick: 1, awakeAirwayReviewedAtTick: 2,
      gasExchangeReviewedAtTick: 3,
    }));
    expect(container.textContent).toContain(
      'Spontaneous 14/min · 420 mL · EtCO₂ 39 · SpO₂ 98% on FiO₂ 0.40',
    );
    act(() => button('Review airway risk + rescue')!.click());
    renderAssessment(assessment({
      quantitativeRecoveryReviewedAtTick: 1, awakeAirwayReviewedAtTick: 2,
      gasExchangeReviewedAtTick: 3, airwayPlanReviewedAtTick: 4,
    }));
    expect(container.textContent).toContain(
      'Low risk · skilled help + oxygen + monitoring + reintubation plan available',
    );
    expect(container.textContent).not.toContain('Packed red cells use a bounded adult-only');
    act(() => button('Ready for planned awake extubation')!.click());
    expect(container.textContent).toContain('Record readiness after all declared checkpoints?');
    act(() => button('Confirm choice')!.click());
    expect(onExtubationReadinessAssessment)
      .toHaveBeenLastCalledWith('ready-for-planned-awake-extubation');
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
