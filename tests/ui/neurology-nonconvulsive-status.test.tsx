/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import type { EngineEvent } from '@platform/kernel/protocol';
import { NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION as SCENARIO } from '../../src/modules/neurology/scenarios/nonconvulsive-status-epilepticus-recognition';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, suspicionAtTick: null, ownershipAtTick: null,
  alternativesAtTick: null, laterAtTick: null, handoffAtTick: null };

describe('Neurology nonconvulsive-status UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyNcseAssessment']>, onAction = vi.fn()) {
    const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [],
      hypnoticLine: { connected: true, inspected: false }, resuscitation: {
        epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
        crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
        lastDantroleneTick: null, activeCooling: false, neurologyNcseAssessment: assessment },
      lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 410,
        respiratoryRateBpm: 17, fio2: 0.21, peep: 0, delivering: false,
        sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false,
      airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0,
      helpRequestedAtTick: null, muscleRigidityFraction: 0,
      onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {},
      onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
      onNeurologyNcseResponse: onAction };
    act(() => root.render(createElement(ActionCockpit, props))); return onAction;
  }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact [1,1,1,1,1,1,0] flow and one live status', () => {
    const states = [empty, { ...empty, trajectoryAtTick: 0 },
      { ...empty, trajectoryAtTick: 0, suspicionAtTick: 1 },
      { ...empty, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2 },
      { ...empty, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3 },
      { ...empty, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3, laterAtTick: 4 },
      { ...empty, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review fluctuation + subtle signs', 'Recognize urgent EEG boundary',
      'Activate qualified EEG ownership', 'Review safety + alternatives',
      'Review qualified EEG report', 'Hand off status + open risk'];
    states.forEach((state, index) => { const onAction = renderAssessment(state);
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]);
        act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); }
    });
    expect(container.textContent).toContain('Quiet can still mean seizure.');
    expect(container.textContent).toContain('EEG answers a clinical question.');
  });

  it('requires exact identity and both targets, and debriefs exact prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyNcseResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasNeurologyNcseResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }, []))
      .toMatchObject({ hasNeurologyNcseResponse: false });
    const suffixes = ['trajectory-reconciled', 'urgent-eeg-boundary-recognized',
      'qualified-ownership-activated', 'safety-and-alternatives-reviewed',
      'qualified-eeg-and-clinical-trajectory-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick,
      eventId: `neurology-ncse-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
  });
});
