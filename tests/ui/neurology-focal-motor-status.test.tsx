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
import { FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/focal-motor-status-epilepticus-escalation';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
  safetyAtTick: null, laterAtTick: null, handoffAtTick: null };

describe('Neurology focal motor status UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    container = document.createElement('div'); document.body.appendChild(container);
    const style = document.createElement('style'); style.dataset.testStyles = 'neurology-focal-status';
    style.textContent = [readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8'),
      readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8')].join('\n');
    document.head.appendChild(style); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove();
    document.querySelector('style[data-test-styles="neurology-focal-status"]')?.remove();
    vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyFocalMotorStatusAssessment']>, onAction = vi.fn()) {
    const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false,
        neurologyFocalMotorStatusAssessment: assessment }, lastExposure: null,
      syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 430,
        respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
      onNeurologyFocalMotorStatusResponse: onAction };
    act(() => root.render(createElement(ActionCockpit, props))); return onAction;
  }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact [1,1,1,1,1,1,0] action flow and one live status', () => {
    const states = [empty, { ...empty, trajectoryAtTick: 0 },
      { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 },
      { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3 },
      { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3, laterAtTick: 4 },
      { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, safetyAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review clock + motor evolution', 'Recognize focal motor status',
      'Activate qualified status ownership', 'Review airway + glucose + causes',
      'Review the minute-26 motor report', 'Hand off active status + cause risk'];
    states.forEach((state, index) => { const onAction = renderAssessment(state);
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]);
        act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); }
    });
    expect(container.textContent).toContain('Less movement is not over.');
    expect(container.textContent).toContain('What is still moving?');
  });

  it('is touch-safe and exposes no treatment, monitoring, or procedure controls', () => {
    renderAssessment(empty); expect(getComputedStyle(buttons()[0]!).minBlockSize).toBe('44px');
    expect(getComputedStyle(buttons()[0]!).whiteSpace).not.toBe('nowrap');
    expect(buttons().map(({ textContent }) => textContent).join(' ')).not.toMatch(
      /benzodiazepine|levetiracetam|fosphenytoin|valproate|mg|dose|route|oxygen|intubat|eeg|anesthetic|infusion|imaging|lab/i);
    expect(container.querySelector('input, select')).toBeNull();
  });

  it('requires exact identity and both targets, and debriefs exact prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyFocalMotorStatusResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasNeurologyFocalMotorStatusResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, []))
      .toMatchObject({ hasNeurologyFocalMotorStatusResponse: false });
    const suffixes = ['trajectory-reconciled', 'recognized', 'qualified-ownership-activated',
      'safety-and-causes-reviewed', 'later-motor-trajectory-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick,
      eventId: `neurology-focal-motor-status-${suffix}-${tick}`, severity: 'info',
      category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
  });
});
