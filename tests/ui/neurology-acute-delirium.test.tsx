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
import { ACUTE_DELIRIUM_REVERSIBLE_CAUSES as SCENARIO } from '../../src/modules/neurology/scenarios/acute-delirium-reversible-causes';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };
describe('Neurology acute delirium UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyDeliriumAssessment']>, onAction = vi.fn()) { const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyDeliriumAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyDeliriumResponse: onAction }; act(() => root.render(createElement(ActionCockpit, props))); return onAction; }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];
  it('keeps the exact calm six-step flow', () => { const states = [empty, { ...empty, trajectoryAtTick: 0 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }]; const labels = ['Review baseline + fluctuation', 'Recognize the assessment boundary', 'Bring familiar care together', 'Review causes + calm care', 'Review the 6-hour report', 'Hand off the whole picture']; states.forEach((state, index) => { const onAction = renderAssessment(state); expect(buttons()).toHaveLength(index === 6 ? 0 : 1); expect(container.querySelectorAll('[role="status"]')).toHaveLength(1); if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]); act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); } }); expect(container.textContent).toContain('Begin with who she was.'); expect(container.textContent).toContain('Make the room easier to understand.'); });
  it('requires exact identity and debriefs exact prefixes', () => { expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyDeliriumResponse: true }); expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, [])).toMatchObject({ hasNeurologyDeliriumResponse: false }); const suffixes = ['trajectory-reconciled', 'assessment-boundary-recognized', 'qualified-ownership-activated', 'contributor-boundary-reviewed', 'later-contributors-reviewed', 'active-risk-handoff-recorded']; const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `neurology-delirium-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix })); expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met')); });
});

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyDeliriumAssessment']>, extra: {
  neurologyDeliriumGuidance?: ActionCockpitProps['neurologyDeliriumGuidance'];
  neurologyDeliriumDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyDeliriumAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyDeliriumResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null, boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review baseline + fluctuation', 'Recognize the assessment boundary', 'Bring familiar care together', 'Review causes + calm care', 'Review the 6-hour report', 'Hand off the whole picture'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology delirium experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/acute-delirium-reversible-causes"');
    expect(index).toContain('Acute delirium with reversible causes');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/acute-delirium-reversible-causes' }));
    expect(route).toContain('<h1>Acute delirium with reversible causes</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyDeliriumResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyDeliriumResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Begin with who she was.');
    const later = markup(states[4]!);
    expect(later).toContain('Make the room easier to understand.');
    expect(later).toContain('Review the fixed 6-hour report after time passes.');
    expect(markup(states[5]!)).toContain('no single cause or recovery is claimed');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|aciclovir|acyclovir|antiviral dose|levetiracetam|lumbar puncture|read the|order the|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Delirium tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyDeliriumGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyDeliriumGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Start with who she was at eight this morning');
    const next = markup(named, { neurologyDeliriumGuidance: 'guided' });
    expect(next).toContain('Bring in the people whose work actually treats this');
    expect(next).not.toContain('Start with who she was at eight this morning');
  });

  it('refuses the dementia label and the single cause', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyDeliriumGuidance: 'guided' });
    expect(html).toContain('or a dementia label');
    expect(html).toContain('And it is not one cause either');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, ownershipAtTick: 2, boundaryAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyDeliriumGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review baseline + fluctuation';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyDeliriumGuidance: 'guided', neurologyDeliriumDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
