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
import { ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/neurology/scenarios/aneurysmal-subarachnoid-hemorrhage-deterioration';

const objectiveIds = [
  'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient',
  'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence',
  'recognize-neurology-asah-possible-dci-without-imaging-alone',
  'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership',
  'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory',
  'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk',
] as const;
const emptyAssessment = { trajectoryAtTick: null, evidenceAtTick: null, boundaryAtTick: null,
  ownershipAtTick: null, laterAtTick: null, handoffAtTick: null };

describe('Neurology aneurysmal SAH deterioration UI', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style'); style.dataset.testStyles = 'neurology-asah';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove();
    document.querySelector('style[data-test-styles="neurology-asah"]')?.remove();
    vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyAsahAssessment']>, onAction = vi.fn()) {
    const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, neurologyAsahAssessment: assessment },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
      onNeurologyAsahDeteriorationResponse: onAction };
    act(() => root.render(createElement(ActionCockpit, props))); return onAction;
  }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact [1,1,1,1,1,1,0] action flow and one live status', () => {
    const states = [emptyAssessment, { ...emptyAssessment, trajectoryAtTick: 0 },
      { ...emptyAssessment, trajectoryAtTick: 0, evidenceAtTick: 1 },
      { ...emptyAssessment, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2 },
      { ...emptyAssessment, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3 },
      { ...emptyAssessment, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4 },
      { ...emptyAssessment, trajectoryAtTick: 0, evidenceAtTick: 1, boundaryAtTick: 2, ownershipAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review SAH course + new deficit', 'Review evidence + immediate threats',
      'Recognize possible DCI boundary', 'Activate qualified DCI ownership',
      'Review the later neurologic report', 'Hand off deficit + open risk'];
    states.forEach((state, index) => { const onAction = renderAssessment(state);
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]);
        act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectiveIds[index]); }
      if (index === 5) expect(container.textContent).toContain('At 80 minutes, neglect and weakness are worse.');
    });
    expect(container.textContent).toContain('A new deficit reopens the whole story.');
    expect(container.textContent).toContain('Vasospasm is evidence, not an outcome.');
  });

  it('is 320px touch-safe and exposes no treatment, monitoring, or procedure controls', () => {
    renderAssessment(emptyAssessment); expect(getComputedStyle(buttons()[0]!).minBlockSize).toBe('44px');
    expect(getComputedStyle(buttons()[0]!).whiteSpace).not.toBe('nowrap');
    expect(buttons().map(({ textContent }) => textContent).join(' ')).not.toMatch(
      /nimodipine|dose|blood pressure|vasopressor|fluid|tcd|cta|ctp|eeg|airway|oxygen|angiography|catheter|procedure/i);
    expect(container.querySelector('input, select')).toBeNull();
  });

  it('requires exact identity and both targets, and debriefs exact elapsed prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyAsahDeteriorationResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'asah-clone' } }, []))
      .toMatchObject({ hasNeurologyAsahDeteriorationResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, []))
      .toMatchObject({ hasNeurologyAsahDeteriorationResponse: false });
    const suffixes = ['trajectory-reconciled', 'evidence-and-threats-reviewed',
      'possible-dci-boundary-recognized', 'qualified-ownership-activated',
      'later-trajectory-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick,
      eventId: `neurology-asah-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
  });
});
