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
import { METASTATIC_SPINAL_CORD_COMPRESSION as SCENARIO } from '../../src/modules/neurology/scenarios/metastatic-spinal-cord-compression';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
  boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };

describe('Neurology metastatic spinal cord compression UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyMsccAssessment']>, onAction = vi.fn()) {
    const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyMsccAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyMsccResponse: onAction };
    act(() => root.render(createElement(ActionCockpit, props))); return onAction;
  }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact [1,1,1,1,1,1,0] flow and one calm live status', () => {
    const states = [empty, { ...empty, trajectoryAtTick: 0 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review the cord clock', 'Recognize the emergency', 'Activate spine + cancer owners', 'Review care boundaries', 'Review the 4-hour report', 'Hand off function + active risk'];
    states.forEach((state, index) => { const onAction = renderAssessment(state); expect(buttons()).toHaveLength(index === 6 ? 0 : 1); expect(container.querySelectorAll('[role="status"]')).toHaveLength(1); if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]); act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); } });
    expect(container.textContent).toContain('The pattern has a level.');
    expect(container.textContent).toContain('Keep every option open.');
  });

  it('requires exact identity and targets, and debriefs exact prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyMsccResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, [])).toMatchObject({ hasNeurologyMsccResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 2) }, [])).toMatchObject({ hasNeurologyMsccResponse: false });
    const suffixes = ['trajectory-reconciled', 'emergency-recognized', 'qualified-ownership-activated', 'care-boundary-reviewed', 'later-mri-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `neurology-mscc-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyMsccAssessment']>, extra: {
  neurologyMsccGuidance?: ActionCockpitProps['neurologyMsccGuidance'];
  neurologyMsccDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyMsccAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyMsccResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review the cord clock', 'Recognize the emergency', 'Activate spine + cancer owners', 'Review care boundaries', 'Review the 4-hour report', 'Hand off function + active risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology cord-compression experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/metastatic-spinal-cord-compression"');
    expect(index).toContain('Metastatic spinal cord compression');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/metastatic-spinal-cord-compression' }));
    expect(route).toContain('<h1>Metastatic spinal cord compression</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyMsccResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyMsccResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The pattern has a level.');
    const later = markup(states[4]!);
    expect(later).toContain('Keep every option open.');
    expect(later).toContain('Review the fixed 4-hour report after time passes.');
    expect(markup(states[5]!)).toContain('Function remains impaired and definitive care is unresolved');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|aciclovir|acyclovir|antiviral dose|levetiracetam|lumbar puncture|read the|order the|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Cord-compression tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyMsccGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyMsccGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Separate the three weeks of pain');
    const next = markup(named, { neurologyMsccGuidance: 'guided' });
    expect(next).toContain('Start the referral chain');
    expect(next).not.toContain('Separate the three weeks of pain');
  });

  it('names the emergency before imaging', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyMsccGuidance: 'guided' });
    expect(html).toContain('no single one of those is sufficient on its own');
    expect(html).toContain('That is why this cannot wait for imaging');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyMsccGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review the cord clock';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyMsccGuidance: 'guided', neurologyMsccDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
