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
import { HIGH_NEURAXIAL_BLOCK_OBSTETRIC_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/high-neuraxial-block-obstetric-coordination';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const EMPTY = { supportAtTick: null, contextAtTick: null, uncertaintyAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Activate airway-capable response', 'Connect block + whole person', 'Review progression + alternatives', 'Review parallel readiness', 'Review the fixed 4-minute report', 'Hand off active block risk'];
const STATES = [EMPTY,
  { ...EMPTY, supportAtTick: 0 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, uncertaintyAtTick: 2 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, uncertaintyAtTick: 2, readinessAtTick: 3 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, uncertaintyAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4 },
  { supportAtTick: 0, contextAtTick: 1, uncertaintyAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsHighNeuraxialAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsHighNeuraxialAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onObstetricsHighNeuraxialResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsHighNeuraxialAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Obstetrics high-neuraxial-block UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('offers exactly one live control per recorded step, in the enforced order', () => {
    STATES.forEach((state, index) => {
      const onAction = vi.fn();
      act(() => root.render(createElement(ActionCockpit, props(state, { onObstetricsHighNeuraxialResponse: onAction }))));
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index === 6) return;
      expect(buttons()[0]!.textContent).toBe(LABELS[index]);
      act(() => buttons()[0]!.click());
      expect(onAction).toHaveBeenCalledWith(objectives[index]);
    });
  });

  it('requires exact identity and debriefs exact event prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasObstetricsHighNeuraxialResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasObstetricsHighNeuraxialResponse: false });
    const suffixes = ['support-activated', 'context-reconciled', 'uncertainty-reviewed', 'readiness-reviewed', 'four-minute-report-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `obstetrics-high-neuraxial-block-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

describe('Obstetrics high-neuraxial-block experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/high-neuraxial-block-obstetric-coordination"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/high-neuraxial-block-obstetric-coordination' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a block test, an airway, or a vasopressor', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsHighNeuraxialResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasObstetricsHighNeuraxialResponse).toBe(false);
    expect(STATES.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(STATES[6]!)).toContain('Airway, circulation, block, fetal, birth, awareness, support, and outcome risks handed off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|palpat|test the|check her|interpret|intubat|ventilat|bag her|oxygen|ephedrine|phenylephrine|vasopressor|fluid|sit her|tilt her|position her|drug|dose|route|rate|infusion|prescri|procedure|caesarean|cesarean|deliver the|surger|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('High-neuraxial-block tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { obstetricsHighNeuraxialGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { obstetricsHighNeuraxialGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('have someone stay at her head');
    const next = markup(STATES[1]!, { obstetricsHighNeuraxialGuidance: 'guided' });
    expect(next).toContain('as one ascending line');
    expect(next).not.toContain('have someone stay at her head');
  });

  it('keeps the alternatives open behind the obvious reading', () => {
    const html = markup(STATES[2]!, { obstetricsHighNeuraxialGuidance: 'guided' });
    expect(html).toContain('present into this same picture and stay open');
    expect(html).toContain('part of the presentation rather than a detail beside it');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { obstetricsHighNeuraxialGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { obstetricsHighNeuraxialGuidance: 'guided', obstetricsHighNeuraxialDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
