/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, crisisResponseAvailability,
  type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { MonitorRegion } from '@anesthesia/ui/MonitorRegion';
import { ConcentrationPanel } from '@anesthesia/ui/ConcentrationPanel';
import { depthConfidenceFor } from '@anesthesia/ui/Cockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { OBSTETRIC_GENERAL_ANESTHESIA } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_STATUS_EPILEPTICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';
import { PEDIATRIC_ANAPHYLAXIS } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA } from '../../src/modules/pediatrics/scenarios/pediatric-supraventricular-tachycardia';
import { PEDIATRIC_BRADYCARDIC_ARREST } from '../../src/modules/pediatrics/scenarios/pediatric-bradycardic-arrest';
import { PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION } from '../../src/modules/pediatrics/scenarios/pediatric-injury-safeguarding-escalation';
import { PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION } from '../../src/modules/pediatrics/scenarios/pediatric-foreign-body-airway-obstruction';
import { PrerenderedBody } from '../../src/routes/Prerendered';
import { ROUTES } from '../../src/routes/routes';
import { LIMITATIONS } from '@platform/docs/limitations';

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

describe('Requirement: pediatric anaphylaxis keeps one calm action at a time', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style'); style.dataset.testStyles = 'pediatric-anaphylaxis-ui';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
    document.querySelector('style[data-test-styles="pediatric-anaphylaxis-ui"]')?.remove();
  });

  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    firstLineAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function anaphylaxisProps(step = 0, onAction = vi.fn(), state = assessment(step)):
  ActionCockpitProps {
    return { scenario: PEDIATRIC_ANAPHYLAXIS, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricAnaphylaxisAssessment: state }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 120,
        respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricAnaphylaxisResponse: onAction, onDrugCard: () => {} };
  }

  it('shows exact serial action density with two cards and one live status', () => {
    const labels = ['Review exposure + whole-child trajectory',
      'Recognize persistent ABC compromise', 'Activate qualified anaphylaxis rescue',
      'Review airway + asthma + causes', 'Review the minute-18 response',
      'Hand off active anaphylaxis risk'];
    const statuses = ['Qualified rescue comes first; safety review stays close.',
      'Qualified rescue comes first; safety review stays close.',
      'Qualified rescue comes first; safety review stays close.',
      'Qualified rescue is active · complete airway and recurrence review',
      'Review the fixed response after elapsed qualified care',
      'Partial improvement only. Recurrence and cause risk remain open.',
      'Active anaphylaxis risk and owners handed off'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, anaphylaxisProps(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-anaphylaxis-pattern-title', 'pediatric-anaphylaxis-response-title']);
      const liveStatuses = container.querySelectorAll('[role="status"]');
      expect(liveStatuses).toHaveLength(1);
      expect(liveStatuses[0]?.textContent?.trim()).toBe(statuses[step]);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 1, 1, 1, 1, 0][step]!);
      if (step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      for (const action of buttons) expect(getComputedStyle(action).minBlockSize).toBe('44px');
    }
    expect(container.textContent).toContain('exposure · airway · breathing · gut · perfusion');
    expect(container.textContent).not.toContain('exposure · skin');
  });

  it('uses exact frozen actions without exposing a learner treatment recipe', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, anaphylaxisProps(2, onAction))));
    const action = [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Activate qualified anaphylaxis rescue');
    act(() => action?.click());
    expect(onAction).toHaveBeenCalledWith(
      'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership');
    act(() => root.render(createElement(ActionCockpit, anaphylaxisProps(5))));
    expect(container.textContent).toContain('Partial improvement only.');
    expect(container.textContent).toContain('does not prove treatment effect');
    expect(container.textContent).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|mL)\b|mg\/kg|epinephrine|adrenaline|autoinjector|intramuscular|intravenous|intraosseous|repeat in|oxygen flow|bolus/i);
  });

  it('requires exact scenario, reassessment target, and boundary target', () => {
    expect(crisisResponseAvailability(PEDIATRIC_ANAPHYLAXIS, [])
      .hasPediatricAnaphylaxisResponse).toBe(true);
    const wrongId = { ...PEDIATRIC_ANAPHYLAXIS,
      metadata: { ...PEDIATRIC_ANAPHYLAXIS.metadata, id: 'not-pediatric-anaphylaxis' } };
    expect(crisisResponseAvailability(wrongId, []).hasPediatricAnaphylaxisResponse).toBe(false);
    for (const target of ['pediatric-anaphylaxis-reassessment',
      'pediatric-anaphylaxis-reassessment-boundary']) {
      const drifted = { ...PEDIATRIC_ANAPHYLAXIS,
        timeline: PEDIATRIC_ANAPHYLAXIS.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event) };
      expect(crisisResponseAvailability(drifted, []).hasPediatricAnaphylaxisResponse).toBe(false);
    }
  });
});

describe('Requirement: pediatric SVT keeps one calm action at a time', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style'); style.dataset.testStyles = 'pediatric-svt-ui';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
    document.querySelector('style[data-test-styles="pediatric-svt-ui"]')?.remove();
  });

  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    careAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function svtProps(step = 0, onAction = vi.fn()): ActionCockpitProps {
    return { scenario: PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricSupraventricularTachycardiaAssessment: assessment(step) }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 120,
        respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricSupraventricularTachycardiaResponse: onAction, onDrugCard: () => {} };
  }

  it('shows the exact serial density in two labelled cards with one live status', () => {
    const labels = ['Review rhythm + whole-child trajectory',
      'Recognize SVT with perfusion risk', 'Activate qualified pediatric SVT care',
      'Review support + deterioration risks', 'Review the minute-12 response',
      'Hand off recurrence + cardiology risk'];
    const statuses = ['Recognition, qualified care, and safety review proceed in order.',
      'Recognition, qualified care, and safety review proceed in order.',
      'Recognition, qualified care, and safety review proceed in order.',
      'Recognition, qualified care, and safety review proceed in order.',
      'Review the fixed response after elapsed qualified care',
      'Sinus rhythm is reported. Durable control and cause remain open.',
      'Recurrence, cardiac, and caregiver risk handed off'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, svtProps(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-svt-pattern-title', 'pediatric-svt-response-title']);
      const liveStatuses = container.querySelectorAll('[role="status"]');
      expect(liveStatuses).toHaveLength(1);
      expect(liveStatuses[0]?.textContent?.trim()).toBe(statuses[step]);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 1, 1, 1, 1, 0][step]!);
      if (step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      for (const action of buttons) expect(getComputedStyle(action).minBlockSize).toBe('44px');
    }
    expect(container.textContent).toContain('onset · regularity · width · rate · perfusion · symptoms');
    expect(container.textContent).toContain('6 years · 20 kg · regular narrow rhythm · pulse present');
  });

  it('dispatches exact actions without exposing a rhythm-treatment recipe', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, svtProps(2, onAction))));
    act(() => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Activate qualified pediatric SVT care')?.click());
    expect(onAction).toHaveBeenCalledWith(
      'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership');
    act(() => root.render(createElement(ActionCockpit, svtProps(5))));
    expect(container.textContent).toContain('Sinus rhythm is reported.');
    expect(container.textContent).toContain('does not prove treatment effect');
    expect(container.textContent).not.toMatch(/mg\/kg|adenosine|vagal maneuver|\bice\b|intravenous|intraosseous|flush|joule|j\/kg|pad placement|cardioversion|sedation|oxygen flow|tube size/i);
  });

  it('requires the exact scenario and both narrative targets', () => {
    expect(crisisResponseAvailability(PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA, [])
      .hasPediatricSupraventricularTachycardiaResponse).toBe(true);
    const wrongId = { ...PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA, metadata: {
      ...PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA.metadata, id: 'not-pediatric-svt' } };
    expect(crisisResponseAvailability(wrongId, [])
      .hasPediatricSupraventricularTachycardiaResponse).toBe(false);
    for (const target of ['pediatric-supraventricular-tachycardia-reassessment',
      'pediatric-supraventricular-tachycardia-reassessment-boundary']) {
      const drifted = { ...PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA,
        timeline: PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA.timeline.map((event) =>
          event.target === target ? { ...event, target: `${target}-suffix` } : event) };
      expect(crisisResponseAvailability(drifted, [])
        .hasPediatricSupraventricularTachycardiaResponse).toBe(false);
    }
  });

  it('keeps unavailable pressure distinct from proven pulse loss', () => {
    const markup = renderToStaticMarkup(createElement(MonitorRegion, {
      state: { heartRateBpm: 132, meanArterialMmHg: 0, respiratoryRateBpm: 0,
        etco2MmHg: 0, spo2Percent: 0, coreTemperatureC: 36.7, fio2: 0.21 },
      blocks: [], alarms: [], tick: 3,
      invalidParameters: new Set(['meanArterialMmHg', 'etco2MmHg', 'spo2Percent']),
      invalidParameterReasons: { meanArterialMmHg: 'Pressure not supplied' },
      artifactParameters: new Set<string>(), waveformArtifacts: new Set<string>(), rhythm: 'sinus',
      airwayPatencyFraction: 0, bronchospasmSeverity: 0, ventilating: false,
      mechanicalPulse: false, reducedMotion: true, colorblindSafe: false, showLimits: true,
      primaryTracesOnly: false, canvasHeight: 320, onSilence: () => undefined,
      onWhy: () => undefined,
    }));
    expect(markup).toContain('Pressure not supplied');
    expect(markup).not.toContain('No pulsatile flow');
    expect(markup).not.toContain('Arterial pressure');
    expect(markup).not.toContain('Plethysmogram');
    expect(markup).toContain('Electrocardiogram');
  });
});

describe('Requirement: pediatric bradycardic arrest keeps one calm action at a time', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'pediatric-bradycardic-arrest-ui';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
    document.querySelector('style[data-test-styles="pediatric-bradycardic-arrest-ui"]')?.remove();
  });

  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, recognitionAtTick: step > 1 ? 2 : null,
    resuscitationAtTick: step > 2 ? 3 : null, safetyAtTick: step > 3 ? 4 : null,
    laterResponseAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function bradycardicArrestProps(step = 0, onAction = vi.fn()): ActionCockpitProps {
    return { scenario: PEDIATRIC_BRADYCARDIC_ARREST, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricBradycardicArrestAssessment: assessment(step) }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 120,
        respiratoryRateBpm: 20, fio2: 1, peep: 0, delivering: true,
        sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricBradycardicArrestResponse: onAction, onDrugCard: () => {} };
  }

  it('shows exact serial actions in two labelled cards with one live status', () => {
    const labels = ['Review breathing + rhythm + whole child',
      'Recognize persistent bradycardic compromise',
      'Activate qualified pediatric resuscitation', 'Review pulse + breathing + causes',
      'Review the 2-minute pulse-loss report', 'Hand off active arrest risk'];
    const statuses = ['Recognition, qualified care, and safety review proceed in order.',
      'Recognition, qualified care, and safety review proceed in order.',
      'Recognition, qualified care, and safety review proceed in order.',
      'Recognition, qualified care, and safety review proceed in order.',
      'Review the fixed pulse-loss report after elapsed qualified care.',
      'No pulse is reported. Organized rhythm is not circulation.',
      'Active nonshockable arrest and owners handed off.'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, bradycardicArrestProps(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-bradycardic-arrest-pattern-title',
        'pediatric-bradycardic-arrest-response-title']);
      const liveStatuses = container.querySelectorAll('[role="status"]');
      expect(liveStatuses).toHaveLength(1);
      expect(liveStatuses[0]?.textContent?.trim()).toBe(statuses[step]);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 1, 1, 1, 1, 0][step]!);
      if (step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      for (const action of buttons) expect(getComputedStyle(action).minBlockSize).toBe('44px');
    }
    expect(container.textContent).toContain('breathing · oxygenation · rhythm · pulse · perfusion · responsiveness');
    expect(container.textContent).toContain('6 years · 20 kg · organized slow rhythm · pulse initially present');
  });

  it('dispatches exact frozen actions without generic arrest controls', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, bradycardicArrestProps(1, onAction))));
    act(() => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Recognize persistent bradycardic compromise')
      ?.click());
    expect(onAction).toHaveBeenCalledWith(
      'recognize-pediatric-bradycardia-with-persistent-compromise');
    act(() => root.render(createElement(ActionCockpit, bradycardicArrestProps(5))));
    expect(container.textContent).toContain('No pulse is reported. Organized rhythm is not circulation.');
    const actionLabels = [...container.querySelectorAll('.tray-grid button')]
      .map((entry) => entry.textContent ?? '').join(' ');
    expect(actionLabels).not.toMatch(/start compressions|ventilate|oxygen|epinephrine|atropine|mg\/kg|intravenous|intraosseous|pace|current|output|pad|capture|\bshock\b|joule|energy|cardiovert|sedat/i);
    expect(container.textContent).toContain('does not prove cause');
  });

  it('requires the exact scenario and both narrative targets', () => {
    expect(crisisResponseAvailability(PEDIATRIC_BRADYCARDIC_ARREST, [])
      .hasPediatricBradycardicArrestResponse).toBe(true);
    const wrongId = { ...PEDIATRIC_BRADYCARDIC_ARREST,
      metadata: { ...PEDIATRIC_BRADYCARDIC_ARREST.metadata, id: 'not-pediatric-arrest' } };
    expect(crisisResponseAvailability(wrongId, []).hasPediatricBradycardicArrestResponse)
      .toBe(false);
    for (const target of ['pediatric-bradycardic-arrest-reassessment',
      'pediatric-bradycardic-arrest-reassessment-boundary']) {
      const drifted = { ...PEDIATRIC_BRADYCARDIC_ARREST,
        timeline: PEDIATRIC_BRADYCARDIC_ARREST.timeline.map((event) =>
          event.target === target ? { ...event, target: `${target}-suffix` } : event) };
      expect(crisisResponseAvailability(drifted, []).hasPediatricBradycardicArrestResponse)
        .toBe(false);
    }
  });
});

describe('Requirement: pediatric foreign-body obstruction keeps one calm action at a time', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style'); style.dataset.testStyles = 'pediatric-fbao-ui';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
    document.querySelector('style[data-test-styles="pediatric-fbao-ui"]')?.remove();
  });

  const assessment = (step = 0) => ({
    reconciledAtTick: step > 0 ? 1 : null,
    effectiveCoughAtTick: step > 1 ? 1 : null,
    severeResponsiveAtTick: step > 2 ? 2 : null,
    responsivePathwayAtTick: step > 3 ? 2 : null,
    unresponsivePathwayAtTick: step > 4 ? 3 : null,
    handoffAtTick: step > 5 ? 4 : null,
  });
  function fbaoProps(step = 0, onAction = vi.fn()): ActionCockpitProps {
    return { scenario: PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricForeignBodyAirwayObstructionAssessment: assessment(step) as never,
      }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual',
        tidalVolumeMl: 120, respiratoryRateBpm: 24, fio2: 0.21, peep: 0,
        delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
      onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
      onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onActiveCooling: () => {}, onPediatricForeignBodyAirwayObstructionResponse: onAction,
      onDrugCard: () => {} };
  }

  it('shows the exact serial density in two labelled cards with one live status', () => {
    const labels = ['Review choking + whole-child signs',
      'Preserve effective cough + watch closely', 'Recognize severe responsive obstruction',
      'Activate qualified choking rescue', 'Review transition + activate unresponsive care',
      'Hand off active obstruction risk'];
    const statuses = ['Cough, airflow, and responsiveness guide the next step.',
      'Cough, airflow, and responsiveness guide the next step.',
      'Cough, airflow, and responsiveness guide the next step.',
      'Activate the qualified responsive-child pathway.',
      'Qualified responsive-child care is active. Review the fixed response after elapsed care.',
      'The child is unresponsive. Qualified unresponsive CPR is active.',
      'Active obstruction risk and owners handed off.'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, fbaoProps(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-fbao-pattern-title', 'pediatric-fbao-response-title']);
      const liveStatuses = container.querySelectorAll('[role="status"]');
      expect(liveStatuses).toHaveLength(1);
      expect(liveStatuses[0]?.textContent?.trim()).toBe(statuses[step]);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 1, 1, 1, 1, 0][step]!);
      if (step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      for (const action of buttons) expect(getComputedStyle(action).minBlockSize).toBe('44px');
    }
  });

  it('dispatches exact intent without exposing maneuver or arrest controls', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, fbaoProps(4, onAction))));
    act(() => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim()
        === 'Review transition + activate unresponsive care')?.click());
    expect(onAction).toHaveBeenCalledWith(
      'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway');
    act(() => root.render(createElement(ActionCockpit, fbaoProps(5))));
    expect(container.textContent).toContain('The child is unresponsive.');
    const actionLabels = [...container.querySelectorAll('.tray-grid button')]
      .map((entry) => entry.textContent ?? '').join(' ');
    expect(actionLabels).not.toMatch(/back blow|abdominal thrust|chest thrust|finger sweep|suction|compression|breath|pulse check|AED|shock|laryng|forceps|bronch|intubat|oxygen|device/i);
    expect(container.textContent).toContain('pulse status remains unreported');
  });

  it('requires the exact scenario and both narrative targets', () => {
    expect(crisisResponseAvailability(PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION, [])
      .hasPediatricForeignBodyAirwayObstructionResponse).toBe(true);
    const wrongId = { ...PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION, metadata: {
      ...PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION.metadata, id: 'not-pediatric-fbao' } };
    expect(crisisResponseAvailability(wrongId, [])
      .hasPediatricForeignBodyAirwayObstructionResponse).toBe(false);
    for (const target of ['pediatric-foreign-body-airway-obstruction-reassessment',
      'pediatric-foreign-body-airway-obstruction-reassessment-boundary']) {
      const drifted = { ...PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION,
        timeline: PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION.timeline.map((event) =>
          event.target === target ? { ...event, target: `${target}-suffix` } : event) };
      expect(crisisResponseAvailability(drifted, [])
        .hasPediatricForeignBodyAirwayObstructionResponse).toBe(false);
    }
  });
});

describe('Requirement: pediatric safeguarding stays calm, bounded, and input-free', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.documentElement.style.width = '320px';
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'pediatric-safeguarding-ui';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); document.documentElement.style.width = '';
    document.querySelector('style[data-test-styles="pediatric-safeguarding-ui"]')?.remove();
  });

  const assessment = (step = 0) => ({
    trajectoryAtTick: step > 0 ? 1 : null, concernAtTick: step > 1 ? 2 : null,
    safeguardingAtTick: step > 2 ? 3 : null, alternativesAtTick: step > 3 ? 4 : null,
    laterSafetyAtTick: step > 4 ? 5 : null, handoffAtTick: step > 5 ? 6 : null,
  });
  function safeguardingProps(step = 0, onAction = vi.fn()): ActionCockpitProps {
    return { scenario: PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION, region: UNITED_STATES,
      infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        pediatricInjurySafeguardingAssessment: assessment(step) }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 84,
        respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {},
      onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onEpinephrine: () => {},
      onDantrolene: () => {}, onActiveCooling: () => {},
      onPediatricInjurySafeguardingResponse: onAction, onDrugCard: () => {} };
  }

  it('shows one calm action at every stage in two labelled cards', () => {
    const labels = ['Review child + supplied record', 'Recognize concern without diagnosing',
      'Activate qualified safeguarding care', 'Review alternatives + privacy',
      'Review the team safety checkpoint', 'Hand off concern + open questions'];
    const statuses = ['Recognition, qualified ownership, and privacy review proceed in order.',
      'Recognition, qualified ownership, and privacy review proceed in order.',
      'Recognition, qualified ownership, and privacy review proceed in order.',
      'Qualified safeguarding ownership is active · complete the protected-record review',
      'Review the fixed multidisciplinary safety checkpoint.',
      'Qualified safety coordination remains active. Diagnosis, legal outcome, and disposition remain open.',
      'Active concern, privacy boundaries, and owners handed off.'];
    for (let step = 0; step <= labels.length; step += 1) {
      act(() => root.render(createElement(ActionCockpit, safeguardingProps(step))));
      const cards = [...container.querySelectorAll('.tray-grid > section.syringe')];
      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.getAttribute('aria-labelledby'))).toEqual([
        'pediatric-safeguarding-pattern-title', 'pediatric-safeguarding-plan-title']);
      const liveStatuses = container.querySelectorAll('[role="status"]');
      expect(liveStatuses).toHaveLength(1);
      expect(liveStatuses[0]?.textContent?.trim()).toBe(statuses[step]);
      const buttons = [...container.querySelectorAll('.tray-grid button')];
      expect(buttons).toHaveLength([1, 1, 1, 1, 1, 1, 0][step]!);
      if (step < labels.length) expect(buttons[0]?.textContent?.trim()).toBe(labels[step]);
      for (const action of buttons) expect(getComputedStyle(action).minBlockSize).toBe('44px');
    }
    expect(container.textContent).toContain('2 years · 12 kg · medically stable · supplied record');
  });

  it('dispatches the exact action while exposing no forensic or reporting input', () => {
    const onAction = vi.fn();
    act(() => root.render(createElement(ActionCockpit, safeguardingProps(1, onAction))));
    act(() => [...container.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Recognize concern without diagnosing')
      ?.click());
    expect(onAction).toHaveBeenCalledWith(
      'recognize-pediatric-injury-safeguarding-concern-without-diagnosis');
    act(() => root.render(createElement(ActionCockpit, safeguardingProps(5))));
    expect(container.querySelectorAll('.tray-grid input, .tray-grid textarea, .tray-grid select'))
      .toHaveLength(0);
    const labels = [...container.querySelectorAll('.tray-grid button')]
      .map((entry) => entry.textContent ?? '').join(' ');
    expect(labels).not.toMatch(/interview|question child|confront|accuse|photograph|body map|report to|CPS|police|law enforcement|remove child|placement|discharge/i);
    expect(container.textContent).toContain('does not prove abuse');
  });

  it('requires the exact safeguarding scenario and both narrative targets', () => {
    expect(crisisResponseAvailability(PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION, [])
      .hasPediatricInjurySafeguardingResponse).toBe(true);
    const wrongId = { ...PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION, metadata: {
      ...PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION.metadata, id: 'not-safeguarding' } };
    expect(crisisResponseAvailability(wrongId, []).hasPediatricInjurySafeguardingResponse)
      .toBe(false);
    for (const target of ['pediatric-injury-safeguarding-escalation-reassessment',
      'pediatric-injury-safeguarding-escalation-reassessment-boundary']) {
      const drifted = { ...PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION,
        timeline: PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION.timeline.map((event) =>
          event.target === target ? { ...event, target: `${target}-suffix` } : event) };
      expect(crisisResponseAvailability(drifted, []).hasPediatricInjurySafeguardingResponse)
        .toBe(false);
    }
  });
});

describe('Requirement: scenario descriptions use age-appropriate nouns', () => {
  it('calls a minor a boy or girl and preserves adult nouns', () => {
    expect(patientPersonNoun({ ageYears: 6, sex: 'male' })).toBe('boy');
    expect(patientPersonNoun({ ageYears: 6, sex: 'female' })).toBe('girl');
    expect(patientPersonNoun({ ageYears: 30, sex: 'female' })).toBe('woman');
  });

  it('renders the child prebrief without calling the patient a man', () => {
    const markup = renderToStaticMarkup(createElement(Prebrief, { limitations: LIMITATIONS,
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
