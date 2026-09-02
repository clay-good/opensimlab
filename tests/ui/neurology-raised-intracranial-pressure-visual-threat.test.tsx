/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import type { EngineEvent } from '@platform/kernel/protocol';
import { RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT as SCENARIO } from '../../src/modules/neurology/scenarios/raised-intracranial-pressure-visual-threat';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, ownershipAtTick: null, eyesAtTick: null,
  diagnosticsAtTick: null, laterAtTick: null, handoffAtTick: null };

describe('Neurology raised intracranial pressure visual-threat UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyRaisedIcpAssessment']>, onAction = vi.fn()) {
    const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyRaisedIcpAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyRaisedIcpResponse: onAction };
    act(() => root.render(createElement(ActionCockpit, props))); return onAction;
  }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact [1,1,1,1,1,1,0] flow and one calm live status', () => {
    const states = [empty, { ...empty, trajectoryAtTick: 0 }, { ...empty, trajectoryAtTick: 0, ownershipAtTick: 1 }, { ...empty, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2 }, { ...empty, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3 }, { ...empty, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3, laterAtTick: 4 }, { ...empty, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review the pressure clock', 'Activate vision + brain owners', 'Review papilledema + fields', 'Review MRI + veins + LP', 'Review the 24-hour fields', 'Hand off sight + active risk'];
    states.forEach((state, index) => { const onAction = renderAssessment(state); expect(buttons()).toHaveLength(index === 6 ? 0 : 1); expect(container.querySelectorAll('[role="status"]')).toHaveLength(1); if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]); act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); } });
    expect(container.textContent).toContain('Protect the whole field.');
    expect(container.textContent).toContain('Sharp center, narrowing world.');
  });

  it('requires exact identity and targets, and debriefs exact prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyRaisedIcpResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, [])).toMatchObject({ hasNeurologyRaisedIcpResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 2) }, [])).toMatchObject({ hasNeurologyRaisedIcpResponse: false });
    const suffixes = ['trajectory-reconciled', 'qualified-ownership-activated', 'papilledema-and-vision-reviewed', 'diagnostic-boundary-reviewed', 'later-visual-threat-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `neurology-raised-icp-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyRaisedIcpAssessment']>, extra: {
  neurologyRaisedIcpGuidance?: ActionCockpitProps['neurologyRaisedIcpGuidance'];
  neurologyRaisedIcpDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyRaisedIcpAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyRaisedIcpResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, ownershipAtTick: null, eyesAtTick: null, diagnosticsAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review the pressure clock', 'Activate vision + brain owners', 'Review papilledema + fields', 'Review MRI + veins + LP', 'Review the 24-hour fields', 'Hand off sight + active risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology raised-pressure experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/raised-intracranial-pressure-visual-threat"');
    expect(index).toContain('Raised intracranial pressure with visual threat');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/raised-intracranial-pressure-visual-threat' }));
    expect(route).toContain('<h1>Raised intracranial pressure with visual threat</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyRaisedIcpResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyRaisedIcpResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Protect the whole field.');
    const later = markup(states[4]!);
    expect(later).toContain('Sharp center, narrowing world.');
    expect(later).toContain('Review the fixed 24-hour');
    expect(markup(states[5]!)).toContain('field');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|aciclovir|acyclovir|antiviral dose|levetiracetam|lumbar puncture|read the|order the|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Raised-pressure tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyRaisedIcpGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyRaisedIcpGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Read the headache as the background');
    const next = markup(named, { neurologyRaisedIcpGuidance: 'guided' });
    expect(next).toContain('Look at the fields');
    expect(next).not.toContain('Read the headache as the background');
  });

  it('treats neuro-ophthalmology as urgent', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyRaisedIcpGuidance: 'guided' });
    expect(html).toContain('not a follow-up appointment');
    expect(html).toContain('in hours rather than in clinic');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, ownershipAtTick: 1, eyesAtTick: 2, diagnosticsAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyRaisedIcpGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review the pressure clock';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyRaisedIcpGuidance: 'guided', neurologyRaisedIcpDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
