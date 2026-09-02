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
import { ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN as SCENARIO } from '../../src/modules/neurology/scenarios/acute-transtentorial-herniation-pattern';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
  boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };

describe('Neurology acute transtentorial herniation UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyHerniationAssessment']>, onAction = vi.fn()) {
    const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyHerniationAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyHerniationResponse: onAction };
    act(() => root.render(createElement(ActionCockpit, props))); return onAction;
  }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('keeps the exact [1,1,1,1,1,1,0] flow and one calm live status', () => {
    const states = [empty, { ...empty, trajectoryAtTick: 0 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    const labels = ['Review the rapid change', 'Recognize the whole pattern', 'Activate brain rescue owners', 'Review rescue boundaries', 'Review the 15-minute report', 'Hand off rescue + active risk'];
    states.forEach((state, index) => { const onAction = renderAssessment(state); expect(buttons()).toHaveLength(index === 6 ? 0 : 1); expect(container.querySelectorAll('[role="status"]')).toHaveLength(1); if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]); act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); } });
    expect(container.textContent).toContain('The pattern changed now.');
    expect(container.textContent).toContain('Rescue first. Certainty follows.');
  });

  it('requires exact identity and targets, and debriefs exact prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyHerniationResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, [])).toMatchObject({ hasNeurologyHerniationResponse: false });
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 2) }, [])).toMatchObject({ hasNeurologyHerniationResponse: false });
    const suffixes = ['trajectory-reconciled', 'converging-pattern-recognized', 'qualified-ownership-activated', 'brain-rescue-boundary-reviewed', 'later-qualified-rescue-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `neurology-herniation-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyHerniationAssessment']>, extra: {
  neurologyHerniationGuidance?: ActionCockpitProps['neurologyHerniationGuidance'];
  neurologyHerniationDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyHerniationAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyHerniationResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review the rapid change', 'Recognize the whole pattern', 'Activate brain rescue owners', 'Review rescue boundaries', 'Review the 15-minute report', 'Hand off rescue + active risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology herniation experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/acute-transtentorial-herniation-pattern"');
    expect(index).toContain('Acute transtentorial herniation pattern');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/acute-transtentorial-herniation-pattern' }));
    expect(route).toContain('<h1>Acute transtentorial herniation pattern</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyHerniationResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyHerniationResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('The pattern changed now.');
    const later = markup(states[4]!);
    expect(later).toContain('Rescue first. Certainty follows.');
    expect(later).toContain('Review the fixed 15-minute report after time passes.');
    expect(markup(states[5]!)).toContain('the pupil remains nonreactive and definitive control is unresolved');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|aciclovir|acyclovir|antiviral dose|levetiracetam|lumbar puncture|read the|order the|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Herniation tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyHerniationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyHerniationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say all four changes');
    const next = markup(named, { neurologyHerniationGuidance: 'guided' });
    expect(next).toContain('Call airway, neurocritical care, neurosurgery');
    expect(next).not.toContain('Say all four changes');
  });

  it('refuses to wait for the sign that has not arrived', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyHerniationGuidance: 'guided' });
    expect(html).toContain('the respiratory irregularity is not required');
    expect(html).toContain('cannot be taken back');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyHerniationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review the rapid change';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyHerniationGuidance: 'guided', neurologyHerniationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
