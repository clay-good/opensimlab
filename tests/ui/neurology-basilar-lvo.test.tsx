/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
import { routeFor } from '../../src/routes/routes';
import { structuredDataFor } from '@platform/docs/structured-data';

const emptyAssessment = {
  trajectoryAtTick: null, imagingAtTick: null, boundaryAtTick: null,
  activationAtTick: null, laterAtTick: null, handoffAtTick: null,
};

describe('Neurology basilar-LVO escalation UI', () => {
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
    style.dataset.testStyles = 'neurology-basilar-lvo';
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
    document.querySelector('style[data-test-styles="neurology-basilar-lvo"]')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function renderAssessment(
    assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyBasilarLvoAssessment']>,
    onAction = vi.fn(),
    scenario: ActionCockpitProps['scenario'] = BASILAR_ARTERY_OCCLUSION_ESCALATION,
  ) {
    const props: ActionCockpitProps = {
      scenario, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        neurologyBasilarLvoAssessment: assessment,
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: {
        mode: 'manual', tidalVolumeMl: 470, respiratoryRateBpm: 20,
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
      onDrugCard: () => {}, onNeurologyBasilarLvoResponse: onAction,
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onAction;
  }

  const visibleButtons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('presents the exact calm serial [1,1,1,1,1,1,0] progression', () => {
    const states = [
      emptyAssessment,
      { ...emptyAssessment, trajectoryAtTick: 0 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3, laterAtTick: 4 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, activationAtTick: 3, laterAtTick: 4, handoffAtTick: 5 },
    ];
    const labels = [
      'Review clock + posterior syndrome', 'Review fixed imaging + selection context',
      'Recognize the escalation boundary', 'Activate qualified EVT + airway ownership',
      'Review the later neurologic report', 'Hand off clocks + active risk',
    ];
    const actions = [
      'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient',
      'review-neurology-basilar-lvo-imaging-selection-and-open-mimics',
      'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary',
      'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership',
      'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory',
      'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome',
    ];
    states.forEach((state, index) => {
      const onAction = renderAssessment(state);
      expect(visibleButtons()).toHaveLength(index === 6 ? 0 : 1);
      if (labels[index]) {
        expect(visibleButtons()[0]?.textContent).toBe(labels[index]);
        act(() => visibleButtons()[0]!.click());
        expect(onAction).toHaveBeenCalledWith(actions[index]);
      }
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    });
    expect(container.textContent).toContain('Posterior signs still need speed.');
    expect(container.textContent).toContain('The handoff keeps every risk open.');
  });

  it('dispatches the exact first action and stays touch-safe at 320 px', () => {
    const onAction = renderAssessment(emptyAssessment);
    const action = visibleButtons()[0]!;
    expect(getComputedStyle(action).minBlockSize).toBe('44px');
    expect(getComputedStyle(action).whiteSpace).not.toBe('nowrap');
    expect(getComputedStyle(container.querySelector('.actions__tray')!).overflow).toBe('auto');
    act(() => action.click());
    expect(onAction).toHaveBeenCalledWith(
      'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient',
    );
  });

  it('exposes no treatment recipe, airway-device, pressure, transfer, or procedure controls', () => {
    renderAssessment(emptyAssessment);
    const controls = visibleButtons().map((button) => button.textContent).join(' ');
    expect(controls).not.toMatch(/alteplase|tenecteplase|dose|\bmg\b|blood pressure|bp target|tube|device|ventilat|transfer|thrombectomy device|catheter|stent|procedure/i);
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
  });

  it('requires the exact scenario and both frozen targets', () => {
    expect(crisisResponseAvailability(BASILAR_ARTERY_OCCLUSION_ESCALATION, []))
      .toMatchObject({ hasNeurologyBasilarLvoResponse: true });
    const clone = {
      ...BASILAR_ARTERY_OCCLUSION_ESCALATION,
      metadata: { ...BASILAR_ARTERY_OCCLUSION_ESCALATION.metadata, id: 'basilar-lvo-clone' },
    };
    expect(crisisResponseAvailability(clone, []))
      .toMatchObject({ hasNeurologyBasilarLvoResponse: false });
    const missingBoundary = {
      ...BASILAR_ARTERY_OCCLUSION_ESCALATION,
      timeline: BASILAR_ARTERY_OCCLUSION_ESCALATION.timeline.slice(0, 1),
    };
    expect(crisisResponseAvailability(missingBoundary, []))
      .toMatchObject({ hasNeurologyBasilarLvoResponse: false });
  });

  it('inherits the Neurology canonical route and truthful learning-resource metadata', () => {
    const path = '/neurology/scenario/basilar-artery-occlusion-escalation';
    expect(routeFor(path)).toMatchObject({
      heading: 'Late-window basilar occlusion escalation',
      indexable: true, structuredData: ['LearningResource'],
    });
    expect(structuredDataFor(['LearningResource'], path)[0]).toMatchObject({
      name: 'Late-window basilar occlusion escalation',
      url: 'https://opensimlab.com/neurology/scenario/basilar-artery-occlusion-escalation',
    });
  });
});
