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
import { MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-cardiac-arrest-coordinated-response';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const EMPTY = { supportAtTick: null, contextAtTick: null, modificationsAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Activate prepared response + clock', 'Connect arrest + pregnancy context', 'Review pregnancy responsibilities', 'Review causes + team readiness', 'Review the minute-4 report', 'Hand off active maternal + newborn risk'];
const STATES = [EMPTY,
  { ...EMPTY, supportAtTick: 0 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, modificationsAtTick: 2 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, modificationsAtTick: 2, readinessAtTick: 3 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, modificationsAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4 },
  { supportAtTick: 0, contextAtTick: 1, modificationsAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsMaternalArrestAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsMaternalArrestAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onObstetricsMaternalArrestResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsMaternalArrestAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Obstetrics maternal-cardiac-arrest UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('offers exactly one live control per recorded step, in the enforced order', () => {
    STATES.forEach((state, index) => {
      const onAction = vi.fn();
      act(() => root.render(createElement(ActionCockpit, props(state, { onObstetricsMaternalArrestResponse: onAction }))));
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index === 6) return;
      expect(buttons()[0]!.textContent).toBe(LABELS[index]);
      act(() => buttons()[0]!.click());
      expect(onAction).toHaveBeenCalledWith(objectives[index]);
    });
  });

  it('requires exact identity and debriefs exact event prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasObstetricsMaternalArrestResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasObstetricsMaternalArrestResponse: false });
    const suffixes = ['support-activated', 'context-reconciled', 'modifications-reviewed', 'readiness-reviewed', 'minute-four-report-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `obstetrics-maternal-arrest-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

describe('Obstetrics maternal-cardiac-arrest experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/maternal-cardiac-arrest-coordinated-response"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/maternal-cardiac-arrest-coordinated-response' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a compression, a drug, or a delivery', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsMaternalArrestResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasObstetricsMaternalArrestResponse).toBe(false);
    expect(STATES.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(STATES[0]!)).toContain('Qualified standard resuscitation is already underway.');
    expect(markup(STATES[5]!)).toContain('Circulation has not returned.');
    expect(markup(STATES[6]!)).toContain('Active maternal resuscitation, cause, delivery, hemorrhage, newborn, family, staff, disposition, prognosis, and outcome risks handed off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|palpat|feel for|pulse check|take over|perform|intubat|ventilat|compress|displace|defibrillat|shock her|pace|adrenaline|epinephrine|sample|acquire|calculat|rhythm|imaging|echo|transfus|component|fluid|oxygen|dose|route|target|drug|infusion|prescri|caesarean|cesarean|deliver the|surger|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Maternal-cardiac-arrest tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { obstetricsMaternalArrestGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { obstetricsMaternalArrestGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('before you look at anything');
    const next = markup(STATES[1]!, { obstetricsMaternalArrestGuidance: 'guided' });
    expect(next).toContain('add the one that changes the response');
    expect(next).not.toContain('before you look at anything');
  });

  it('keeps the modifications from interrupting the resuscitation', () => {
    const html = markup(STATES[2]!, { obstetricsMaternalArrestGuidance: 'guided' });
    expect(html).toContain('additions to a standard resuscitation rather than a different one');
    expect(html).toContain('none of them is a reason to pause compressions');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { obstetricsMaternalArrestGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { obstetricsMaternalArrestGuidance: 'guided', obstetricsMaternalArrestDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
