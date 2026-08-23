/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { ConcentrationPanel } from '@anesthesia/ui/ConcentrationPanel';
import { depthConfidenceFor } from '@anesthesia/ui/Cockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { UNITED_STATES } from '@anesthesia/region/profiles';
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

  function renderCockpit(onFluid = vi.fn()) {
    const props: ActionCockpitProps = {
      scenario: CHILD_SCENARIO,
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
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
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
