/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import type { EngineEvent } from '@platform/kernel/protocol';
import { SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE as SCENARIO } from '../../src/modules/neurology/scenarios/spontaneous-cerebellar-intracerebral-hemorrhage';

const emptyAssessment = {
  trajectoryAtTick: null, imagingAtTick: null, boundaryAtTick: null,
  ownershipAtTick: null, laterAtTick: null, handoffAtTick: null,
};

describe('Neurology spontaneous cerebellar ICH UI', () => {
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
    style.dataset.testStyles = 'neurology-cerebellar-ich';
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
    document.querySelector('style[data-test-styles="neurology-cerebellar-ich"]')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function renderAssessment(
    assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyCerebellarIchAssessment']>,
    onAction = vi.fn(), scenario: ActionCockpitProps['scenario'] = SCENARIO,
  ) {
    const props: ActionCockpitProps = {
      scenario, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false },
      resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0,
        dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        neurologyCerebellarIchAssessment: assessment,
      },
      lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 430, respiratoryRateBpm: 18,
        fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0,
        freshGasFlowLPerMin: 0.5 },
      intubated: false, airwayAttempts: 0, lastGrade: null,
      jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
      supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {},
      onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
      onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {},
      onDrugCard: () => {}, onNeurologyCerebellarIchResponse: onAction,
    };
    act(() => root.render(createElement(ActionCockpit, props)));
    return onAction;
  }

  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact serial [1,1,1,1,1,1,0] flow and one live status', () => {
    const states = [emptyAssessment,
      { ...emptyAssessment, trajectoryAtTick: 0 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4 },
      { ...emptyAssessment, trajectoryAtTick: 0, imagingAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review clock + neurologic trajectory', 'Review fixed CT + threat context',
      'Recognize posterior-fossa escalation', 'Activate qualified neuro + airway ownership',
      'Review the later neurologic report', 'Hand off imaging + active risk'];
    const actions = ['reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient',
      'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats',
      'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary',
      'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership',
      'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory',
      'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk'];
    states.forEach((state, index) => {
      const onAction = renderAssessment(state);
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index === 5) expect(container.textContent)
        .toContain('Repeat CT reports expansion, hydrocephalus, and brainstem compression.');
      if (index < 6) {
        expect(buttons()[0]!.textContent).toBe(labels[index]);
        act(() => buttons()[0]!.click());
        expect(onAction).toHaveBeenCalledWith(actions[index]);
      }
    });
    expect(container.textContent).toContain('Location changes the danger.');
    expect(container.textContent).toContain('Stability is only a checkpoint.');
  });

  it('stays touch-safe at 320 px without treatment or procedure controls', () => {
    renderAssessment(emptyAssessment);
    expect(getComputedStyle(buttons()[0]!).minBlockSize).toBe('44px');
    expect(getComputedStyle(buttons()[0]!).whiteSpace).not.toBe('nowrap');
    expect(getComputedStyle(container.querySelector('.actions__tray')!).overflow).toBe('auto');
    expect(buttons().map((button) => button.textContent).join(' ')).not.toMatch(
      /warfarin|reversal|sbp|dose|\bmg\b|\bICP\b|\bCPP\b|osmolar|evd|drain|evacuat|crani|oxygen|device|procedure/i,
    );
    expect(container.querySelector('input, select')).toBeNull();
  });

  it('requires the exact scenario and both reassessment targets', () => {
    expect(crisisResponseAvailability(SCENARIO, []))
      .toMatchObject({ hasNeurologyCerebellarIchResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, id: 'cerebellar-ich-clone' } }, []))
      .toMatchObject({ hasNeurologyCerebellarIchResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, []))
      .toMatchObject({ hasNeurologyCerebellarIchResponse: false });
  });

  it('maps exact elapsed event prefixes into all six debrief objectives', () => {
    const ids = ['neurology-cerebellar-ich-trajectory-reconciled-0',
      'neurology-cerebellar-ich-imaging-and-threats-reviewed-1',
      'neurology-cerebellar-ich-posterior-fossa-boundary-recognized-2',
      'neurology-cerebellar-ich-qualified-ownership-activated-3',
      'neurology-cerebellar-ich-later-trajectory-reviewed-4',
      'neurology-cerebellar-ich-active-risk-handoff-recorded-5'];
    const log: EngineEvent[] = ids.map((eventId, tick) => ({
      tick, eventId, severity: 'info', category: 'assessment', message: eventId,
    }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(objectiveFindings({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, id: 'cerebellar-ich-clone' } }, [], 0, 0, [], log)
      .map(({ outcome }) => outcome)).toEqual(Array(6).fill('not-exercised'));
  });
});
