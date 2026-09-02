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
import { AUTONOMIC_DYSREFLEXIA_AUTHORED_TRIGGER as SCENARIO } from '../../src/modules/neurology/scenarios/autonomic-dysreflexia-authored-trigger';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const empty = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, triggerAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
describe('Neurology autonomic dysreflexia UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  function renderAssessment(assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyAutonomicDysreflexiaAssessment']>, onAction = vi.fn()) { const props: ActionCockpitProps = { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyAutonomicDysreflexiaAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyAutonomicDysreflexiaResponse: onAction }; act(() => root.render(createElement(ActionCockpit, props))); return onAction; }
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];
  it('keeps the exact calm six-step flow', () => { const states = [empty, { ...empty, trajectoryAtTick: 0 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3, reassessmentAtTick: 4 }, { ...empty, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }]; const labels = ['Connect baseline + pattern', 'Recognize the urgent pattern', 'Sit up + bring help close', 'Free the visible tubing kink', 'Review the strict response', 'Hand off what could return']; states.forEach((state, index) => { const onAction = renderAssessment(state); expect(buttons()).toHaveLength(index === 6 ? 0 : 1); expect(container.querySelectorAll('[role="status"]')).toHaveLength(1); if (index < 6) { expect(buttons()[0]!.textContent).toBe(labels[index]); act(() => buttons()[0]!.click()); expect(onAction).toHaveBeenCalledWith(objectives[index]); } }); expect(container.textContent).toContain('His usual pressure matters.'); expect(container.textContent).toContain('Relief still needs watching.'); });
  it('requires exact identity and debriefs exact prefixes', () => { expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasNeurologyAutonomicDysreflexiaResponse: true }); expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, [])).toMatchObject({ hasNeurologyAutonomicDysreflexiaResponse: false }); const suffixes = ['trajectory-reconciled', 'pattern-recognized', 'support-activated', 'external-trigger-released', 'transition-reassessed', 'active-risk-handoff-recorded']; const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `neurology-autonomic-dysreflexia-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix })); expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met')); });
});

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyAutonomicDysreflexiaAssessment']>, extra: {
  neurologyDysreflexiaGuidance?: ActionCockpitProps['neurologyDysreflexiaGuidance'];
  neurologyDysreflexiaDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyAutonomicDysreflexiaAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyAutonomicDysreflexiaResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, triggerAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect baseline + pattern', 'Recognize the urgent pattern', 'Sit up + bring help close', 'Free the visible tubing kink', 'Review the strict response', 'Hand off what could return'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology dysreflexia experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/autonomic-dysreflexia-authored-trigger"');
    expect(index).toContain('Autonomic dysreflexia with an authored trigger');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/autonomic-dysreflexia-authored-trigger' }));
    expect(route).toContain('<h1>Autonomic dysreflexia with an authored trigger</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyAutonomicDysreflexiaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyAutonomicDysreflexiaResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('His usual pressure matters.');
    const later = markup(states[4]!);
    expect(later).toContain('Relief still needs watching.');
    expect(later).toContain('The visible kink is free and the monitor changed. Reassess after time passes.');
    expect(markup(states[5]!)).toContain('Recurrence, another trigger, and complications remain open');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|aciclovir|acyclovir|antiviral dose|levetiracetam|lumbar puncture|read the|order the|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Dysreflexia tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyDysreflexiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyDysreflexiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Put his usual pressure next to this one');
    const next = markup(named, { neurologyDysreflexiaGuidance: 'guided' });
    expect(next).toContain('Sit him up before you go looking');
    expect(next).not.toContain('Put his usual pressure next to this one');
  });

  it('names the pattern urgent without closing anything', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyDysreflexiaGuidance: 'guided' });
    expect(html).toContain('enough to act on immediately');
    expect(html).toContain('not a diagnosis that closes anything');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, triggerAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyDysreflexiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect baseline + pattern';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyDysreflexiaGuidance: 'guided', neurologyDysreflexiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
