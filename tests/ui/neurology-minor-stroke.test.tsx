/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE } from '../../src/modules/neurology/scenarios/minor-nondisabling-acute-ischemic-stroke';
import { PrerenderedBody } from '../../src/routes/Prerendered';
import { routeFor } from '../../src/routes/routes';
import { structuredDataFor } from '@platform/docs/structured-data';
import { LIMITATIONS } from '@platform/docs/limitations';

const emptyAssessment = {
  trajectoryAtTick: null, threatsAtTick: null, boundaryAtTick: null,
  intentAtTick: null, laterAtTick: null, handoffAtTick: null,
};

describe('Neurology minor nondisabling stroke UI', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    container = document.createElement('div');
    document.body.appendChild(container);
    const style = document.createElement('style');
    style.dataset.testStyles = 'neurology-minor-stroke';
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
    document.querySelector('style[data-test-styles="neurology-minor-stroke"]')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function renderAssessment(
    assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyMinorStrokeAssessment']>,
    onAction = vi.fn(),
    scenario: ActionCockpitProps['scenario'] = MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
  ) {
    const props: ActionCockpitProps = {
      scenario, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        neurologyMinorStrokeAssessment: assessment,
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 16,
        fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0,
        freshGasFlowLPerMin: 0.5,
      },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {},
      onDrugCard: () => {}, onNeurologyMinorStrokeResponse: onAction,
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onAction;
  }

  const visibleButtons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps a calm serial [1,1,1,1,1,1,0] progression with one live status', () => {
    const states = [
      emptyAssessment,
      { ...emptyAssessment, trajectoryAtTick: 0 },
      { ...emptyAssessment, trajectoryAtTick: 0, threatsAtTick: 1 },
      { ...emptyAssessment, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2 },
      { ...emptyAssessment, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3 },
      { ...emptyAssessment, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3, laterAtTick: 4 },
      { ...emptyAssessment, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3, laterAtTick: 4, handoffAtTick: 5 },
    ];
    const labels = [
      'Review clock + deficit + function', 'Review imaging + immediate threats',
      'Recognize the functional boundary', 'Record qualified strategy + surveillance',
      'Review the later neurologic report', 'Hand off cause + recurrence risk',
    ];
    states.forEach((state, index) => {
      renderAssessment(state);
      expect(visibleButtons()).toHaveLength(index === 6 ? 0 : 1);
      if (labels[index]) expect(visibleButtons()[0]?.textContent).toBe(labels[index]);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    });
    expect(container.textContent).toContain('Function, not one score.');
    expect(container.textContent).toContain('Trajectory keeps the plan honest.');
  });

  it('dispatches the frozen action and remains touch-safe at 320 px', () => {
    const onAction = renderAssessment(emptyAssessment);
    const action = visibleButtons()[0]!;
    expect(getComputedStyle(action).minBlockSize).toBe('44px');
    expect(getComputedStyle(action).whiteSpace).not.toBe('nowrap');
    act(() => action.click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-neurology-minor-stroke-clock-deficit-function-and-whole-patient',
    );
    expect(getComputedStyle(container.querySelector('.actions__tray')!).overflow).toBe('auto');
  });

  it('exposes no learner drug, dose, thrombolysis, imaging, score, or disposition controls', () => {
    renderAssessment(emptyAssessment);
    const controls = visibleButtons().map((button) => button.textContent).join(' ');
    expect(controls).not.toMatch(/aspirin|clopidogrel|alteplase|tenecteplase|thrombol|dose|\bmg\b|\bct\b|\bcta\b|nihss|admit|discharge/i);
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
  });

  it('requires the exact scenario and both targets', () => {
    expect(crisisResponseAvailability(MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE, []))
      .toMatchObject({ hasNeurologyMinorStrokeResponse: true });
    const clone = {
      ...MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
      metadata: { ...MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE.metadata, id: 'minor-stroke-clone' },
    };
    expect(crisisResponseAvailability(clone, []))
      .toMatchObject({ hasNeurologyMinorStrokeResponse: false });
    const missingBoundary = {
      ...MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
      timeline: MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE.timeline.slice(0, 1),
    };
    expect(crisisResponseAvailability(missingBoundary, []))
      .toMatchObject({ hasNeurologyMinorStrokeResponse: false });
  });

  it('publishes truthful module and scenario routes with Neurology prebrief copy', () => {
    const path = '/neurology/scenario/minor-nondisabling-acute-ischemic-stroke';
    expect(routeFor('/neurology')).toMatchObject({ heading: 'Neurology simulator', indexable: true });
    expect(routeFor(path)).toMatchObject({
      heading: 'Minor nondisabling acute ischemic stroke', indexable: true,
      structuredData: ['LearningResource'],
    });
    expect(structuredDataFor(['LearningResource'], path)[0]).toMatchObject({
      name: 'Minor nondisabling acute ischemic stroke',
      url: 'https://opensimlab.com/neurology/scenario/minor-nondisabling-acute-ischemic-stroke',
    });
    const staticMarkup = renderToStaticMarkup(createElement(PrerenderedBody, { path }));
    expect(staticMarkup).toContain('Minor nondisabling acute ischemic stroke');
    expect(staticMarkup).toContain('Review and sources');
    const prebrief = renderToStaticMarkup(createElement(Prebrief, { limitations: LIMITATIONS,
      scenario: MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
      region: UNITED_STATES, environment: 'neurology', onStart: () => {},
      guidance: 'guided', onGuidance: () => {},
    }));
    expect(prebrief).toContain('follow function and trajectory');
    expect(prebrief).not.toContain('drugs, the ventilator and the airway');
  });
});
