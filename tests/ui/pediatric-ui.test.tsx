/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, crisisResponseAvailability,
  type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { ConcentrationPanel } from '@anesthesia/ui/ConcentrationPanel';
import { depthConfidenceFor } from '@anesthesia/ui/Cockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { OBSTETRIC_GENERAL_ANESTHESIA } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_STATUS_EPILEPTICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';
import { PrerenderedBody } from '../../src/routes/Prerendered';
import { ROUTES } from '../../src/routes/routes';

const CHILD_SCENARIO = {
  ...ROUTINE_INDUCTION,
  patient: {
    ...ROUTINE_INDUCTION.patient,
    ageYears: 6,
    sex: 'male' as const,
    heightCm: 116,
    weightKg: 20,
  },
};

describe('Requirement: pediatric controls expose their actual-weight conversions', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 780 });
    vi.stubGlobal('ResizeObserver', class {
      observe() {} unobserve() {} disconnect() {}
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    container = document.createElement('div');
    document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'pediatric-ui';
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
    document.querySelector('style[data-test-styles="pediatric-ui"]')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  function renderCockpit(
    onFluid = vi.fn(), scenario: ActionCockpitProps['scenario'] = CHILD_SCENARIO,
  ) {
    const props: ActionCockpitProps = {
      scenario,
      region: UNITED_STATES,
      infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 200,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
      },
      lastExposure: null,
      syringeRemaining: {},
      ventilator: {
        mode: 'volume-control', tidalVolumeMl: 140, respiratoryRateBpm: 20,
        fio2: 0.5, peep: 5, delivering: true, sevofluranePercent: 0,
        freshGasFlowLPerMin: 2,
      },
      intubated: true,
      airwayAttempts: 1,
      lastGrade: 1,
      jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {},
      onActiveCooling: () => {}, onDrugCard: () => {},
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onFluid;
  }

  it('shows accepted tidal volume in mL and mL/kg actual body weight', () => {
    renderCockpit();
    act(() => button('Airway & Vent')!.click());
    expect(container.textContent).toContain('140 mL = 7.0 mL/kg actual body weight');
    expect(container.textContent).toContain('Conversion only, not a recommended target');
  });

  it('does not expose adult or unsourced pediatric fluid boluses in the bounded child case', () => {
    const onFluid = renderCockpit();
    act(() => button('Fluids')!.click());
    expect(container.textContent).toContain('No pediatric fluid bolus is stocked');
    expect(button('10 mL/kg = 200 mL')).toBeUndefined();
    expect(button('20 mL/kg = 400 mL')).toBeUndefined();
    expect(button('1000 mL')).toBeUndefined();
    expect(onFluid).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Accepted total: 200 mL');
  });

  it('keeps the pediatric fluid limitation inside the phone scroll tray', () => {
    renderCockpit();
    act(() => button('Fluids')!.click());
    expect(container.textContent).toContain('No pediatric fluid bolus is stocked');
    expect(getComputedStyle(container.querySelector('.actions__tray')!).overflow).toBe('auto');
  });

  it('makes an intentionally empty syringe tray useful rather than blank', () => {
    renderCockpit(vi.fn(), { ...CHILD_SCENARIO, formulary: [] });
    expect(container.textContent).toContain('No syringes in this lesson');
    expect(container.textContent).toContain('Use Airway & Vent');
  });

  it('does not offer reversal in a rocuronium lesson that ends after induction', () => {
    renderCockpit(vi.fn(), OBSTETRIC_GENERAL_ANESTHESIA);
    expect(container.textContent).toContain('rocuronium');
    expect(container.textContent).not.toContain('Neuromuscular reversal');
  });

  it('shows active model identity and opens its bundled source accessibly', () => {
    act(() => root.render(createElement(ConcentrationPanel, {
      history: [],
      current: [{
        drugId: 'propofol', modelId: 'propofol-paedfusor-2005',
        confidence: 'pending-check' as const, plasma: 3, effectSite: 2, unit: 'µg/mL',
      }],
      tick: 10,
      timeToPeakSeconds: { propofol: 100 },
      stacking: [],
      onExportCsv: () => {},
    })));
    expect(container.textContent).toContain('Model: propofol-paedfusor-2005');
    expect(getComputedStyle(container.querySelector('.model-detail__identity')!).overflowWrap)
      .toBe('anywhere');
    const details = button('Model details and source')!;
    expect(details.getAttribute('aria-expanded')).toBe('false');
    expect(getComputedStyle(details).minBlockSize).toBe('44px');
    act(() => details.click());
    expect(details.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain("'Paedfusor' pharmacokinetic data set");
    expect(container.textContent).toContain('Parameters:');
  });

  it('labels pediatric depth pharmacodynamics as a teaching model', () => {
    expect(depthConfidenceFor([
      { drugId: 'propofol', modelId: 'propofol-paedfusor-2005' },
    ])).toEqual({ label: 'Teaching model', kind: 'teaching' });
    expect(depthConfidenceFor([
      { drugId: 'propofol', modelId: 'propofol-eleveld-2018' },
    ])).toEqual({ label: 'Predicted', kind: 'default' });
  });
});

describe('Requirement: pediatric status epilepticus stays calm and bounded on a phone', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style'); style.dataset.testStyles = 'pediatric-status-ui';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
    document.querySelector('style[data-test-styles="pediatric-status-ui"]')?.remove();
  });

  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    secondLineAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function statusProps(step = 0, onAction = vi.fn(), state = assessment(step)):
  ActionCockpitProps {
    return { scenario: PEDIATRIC_STATUS_EPILEPTICUS, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricStatusEpilepticusAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 120,
        respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricStatusEpilepticusResponse: onAction, onDrugCard: () => {} };
  }

  it('uses two named cards, one live status, and exact progressive action density', () => {
    const labels = ['Review clock + first-line care', 'Recognize ongoing convulsive status',
      'Activate qualified second-line ownership', 'Review airway + causes + boundaries',
      'Review the minute-25 response', 'Hand off active status risk'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, statusProps(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-status-epilepticus-pattern-title',
        'pediatric-status-epilepticus-response-title']);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 2, 1, 1, 1, 0][step]!);
      if (step !== 2 && step < labels.length) {
        expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      }
      if (step === 2) expect(buttons.map(({ textContent }) => textContent?.trim())).toEqual([
        'Activate qualified second-line ownership', 'Review airway + causes + boundaries']);
      for (const action of buttons) expect(getComputedStyle(action).minBlockSize).toBe('44px');
    }
  });

  it('keeps either parallel lane independent with visible text and no early response', () => {
    for (const [state, remaining, status] of [
      [{ ...assessment(2), secondLineAtTick: 3 }, 'Review airway + causes + boundaries',
        'Second-line ownership is active · complete airway and cause review'],
      [{ ...assessment(2), safetyAtTick: 3 }, 'Activate qualified second-line ownership',
        'Safety review is active · activate qualified second-line ownership'],
    ] as const) {
      act(() => root.render(createElement(ActionCockpit, statusProps(2, vi.fn(), state))));
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength(1); expect(buttons[0]?.textContent?.trim()).toBe(remaining);
      expect(container.textContent).toContain(status);
      expect(container.textContent).not.toContain('Review the minute-25 response');
    }
  });

  it('preserves the no-recipe boundary and exact scenario-target isolation', () => {
    act(() => root.render(createElement(ActionCockpit, statusProps(5))));
    expect(container.textContent).toContain('Visible movements stopped.');
    expect(container.textContent).toContain('do not prove electrographic seizure control');
    expect(container.textContent).not.toMatch(/\b4 mg\b|mg\/kg|lorazepam|midazolam|levetiracetam|fosphenytoin|intravenous|intraosseous|oxygen flow|tube size/i);
    expect(crisisResponseAvailability(PEDIATRIC_STATUS_EPILEPTICUS, [])
      .hasPediatricStatusEpilepticusResponse).toBe(true);
    const wrongId = { ...PEDIATRIC_STATUS_EPILEPTICUS,
      metadata: { ...PEDIATRIC_STATUS_EPILEPTICUS.metadata, id: 'not-pediatric-status' } };
    expect(crisisResponseAvailability(wrongId, []).hasPediatricStatusEpilepticusResponse)
      .toBe(false);
    const wrongTarget = { ...PEDIATRIC_STATUS_EPILEPTICUS,
      timeline: PEDIATRIC_STATUS_EPILEPTICUS.timeline.map((event) => ({
        ...event, target: 'pediatric-status-epilepticus-reassessment-suffix',
      })) };
    expect(crisisResponseAvailability(wrongTarget, []).hasPediatricStatusEpilepticusResponse)
      .toBe(false);
  });
});

describe('Requirement: scenario descriptions use age-appropriate nouns', () => {
  it('calls a minor a boy or girl and preserves adult nouns', () => {
    expect(patientPersonNoun({ ageYears: 6, sex: 'male' })).toBe('boy');
    expect(patientPersonNoun({ ageYears: 6, sex: 'female' })).toBe('girl');
    expect(patientPersonNoun({ ageYears: 30, sex: 'female' })).toBe('woman');
  });

  it('renders the child prebrief without calling the patient a man', () => {
    const markup = renderToStaticMarkup(createElement(Prebrief, {
      scenario: CHILD_SCENARIO,
      region: UNITED_STATES,
      onStart: () => {},
      guidance: 'unassisted',
      onGuidance: () => {},
    }));
    expect(markup).toContain('6-year-old boy');
    expect(markup).not.toContain('6-year-old man');
  });

  it('uses the same child noun in route metadata, static briefing, and interactive index', () => {
    const path = '/anesthesia/scenario/routine-pediatric-iv-induction';
    expect(ROUTES.find((route) => route.path === path)?.description).toContain('6-year-old boy');
    expect(renderToStaticMarkup(createElement(PrerenderedBody, { path })))
      .toContain('6-year-old boy');
    expect(readFileSync(join(process.cwd(), 'src/routes/AnesthesiaRoute.tsx'), 'utf8'))
      .toContain('patientPersonNoun(entry.patient)');
  });
});
