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
import { SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE as SCENARIO } from '../../src/modules/obstetrics/scenarios/shoulder-dystocia-cognitive-sequence';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const EMPTY = { supportAtTick: null, contextAtTick: null, safetyAtTick: null, escalationAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Activate response + head clock', 'Connect head delivery + whole person', 'Review protect-from-force boundaries', 'Review flexible qualified sequence', 'Review the fixed birth report', 'Hand off maternal + newborn risk'];
const STATES = [EMPTY,
  { ...EMPTY, supportAtTick: 0 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, safetyAtTick: 2 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, safetyAtTick: 2, escalationAtTick: 3 },
  { ...EMPTY, supportAtTick: 0, contextAtTick: 1, safetyAtTick: 2, escalationAtTick: 3, reassessmentAtTick: 4 },
  { supportAtTick: 0, contextAtTick: 1, safetyAtTick: 2, escalationAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsShoulderDystociaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsShoulderDystociaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onObstetricsShoulderDystociaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsShoulderDystociaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Obstetrics shoulder-dystocia UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('offers exactly one live control per recorded step, in the enforced order', () => {
    STATES.forEach((state, index) => {
      const onAction = vi.fn();
      act(() => root.render(createElement(ActionCockpit, props(state, { onObstetricsShoulderDystociaResponse: onAction }))));
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index === 6) return;
      expect(buttons()[0]!.textContent).toBe(LABELS[index]);
      act(() => buttons()[0]!.click());
      expect(onAction).toHaveBeenCalledWith(objectives[index]);
    });
  });

  it('requires exact identity and debriefs exact event prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasObstetricsShoulderDystociaResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasObstetricsShoulderDystociaResponse: false });
    const suffixes = ['support-activated', 'context-reconciled', 'safety-reviewed', 'escalation-reviewed', 'delivery-report-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `obstetrics-shoulder-dystocia-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

describe('Obstetrics shoulder-dystocia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/shoulder-dystocia-cognitive-sequence"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/shoulder-dystocia-cognitive-sequence' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers traction, pressure, or a maneuver', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsShoulderDystociaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasObstetricsShoulderDystociaResponse).toBe(false);
    expect(STATES.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(STATES[6]!)).toContain('Maternal and newborn injury, hemorrhage, trauma, documentation, support, review, and outcome risks handed off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|palpat|pull|traction|push on|press|fundal pressure|perform|mcroberts|woods|rubin|zavanelli|symphysiotom|episiotom|cut |deliver the|maneuver|manoeuvre|position her|drug|dose|route|infusion|prescri|procedure|caesarean|cesarean|surger|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Shoulder-dystocia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { obstetricsShoulderDystociaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { obstetricsShoulderDystociaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('start the clock at the head');
    const next = markup(STATES[1]!, { obstetricsShoulderDystociaGuidance: 'guided' });
    expect(next).toContain('rather than re-testing them');
    expect(next).not.toContain('start the clock at the head');
  });

  it('names the two things to stop before anything to do', () => {
    const html = markup(STATES[2]!, { obstetricsShoulderDystociaGuidance: 'guided' });
    expect(html).toContain('things to stop, not things to do');
    expect(html).toContain('the specific mechanism by which a brachial plexus is stretched');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { obstetricsShoulderDystociaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { obstetricsShoulderDystociaGuidance: 'guided', obstetricsShoulderDystociaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
