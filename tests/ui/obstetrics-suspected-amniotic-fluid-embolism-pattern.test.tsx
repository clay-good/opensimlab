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
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-amniotic-fluid-embolism-pattern';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const EMPTY = { supportAtTick: null, trajectoryAtTick: null, recognitionAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Activate coordinated response', 'Connect birth clock + whole pattern', 'Recognize rapid maternal collapse', 'Review shock + bleeding + open causes', 'Review the 12-minute report', 'Hand off active maternal risk'];
const STATES = [EMPTY,
  { ...EMPTY, supportAtTick: 0 },
  { ...EMPTY, supportAtTick: 0, trajectoryAtTick: 1 },
  { ...EMPTY, supportAtTick: 0, trajectoryAtTick: 1, recognitionAtTick: 2 },
  { ...EMPTY, supportAtTick: 0, trajectoryAtTick: 1, recognitionAtTick: 2, evidenceAtTick: 3 },
  { ...EMPTY, supportAtTick: 0, trajectoryAtTick: 1, recognitionAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
  { supportAtTick: 0, trajectoryAtTick: 1, recognitionAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsAfeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsAfeAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onObstetricsAfeResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsAfeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Obstetrics amniotic-fluid-embolism UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('offers exactly one live control per recorded step, in the enforced order', () => {
    STATES.forEach((state, index) => {
      const onAction = vi.fn();
      act(() => root.render(createElement(ActionCockpit, props(state, { onObstetricsAfeResponse: onAction }))));
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index === 6) return;
      expect(buttons()[0]!.textContent).toBe(LABELS[index]);
      act(() => buttons()[0]!.click());
      expect(onAction).toHaveBeenCalledWith(objectives[index]);
    });
  });

  it('requires exact identity and debriefs exact event prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasObstetricsAfeResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasObstetricsAfeResponse: false });
    const suffixes = ['support-activated', 'trajectory-reconciled', 'pattern-recognized', 'evidence-reviewed', 'later-report-reviewed', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `obstetrics-afe-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

describe('Obstetrics amniotic-fluid-embolism experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/suspected-amniotic-fluid-embolism-pattern"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/suspected-amniotic-fluid-embolism-pattern' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a maneuver, a product, or a procedure', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsAfeResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasObstetricsAfeResponse).toBe(false);
    expect(STATES.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(STATES[0]!)).toContain('Qualified help starts first.');
    expect(markup(STATES[5]!)).toContain('A central pulse remains.');
    expect(markup(STATES[6]!)).toContain('Active shock, hypoxemia, bleeding, coagulation, arrest, newborn-support, family, staff, and outcome risks handed off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/weigh|measure|examin|palpat|feel for|pulse check|intubat|ventilat|compress|defibrillat|ecmo|sample|acquire|calculat|dic score|echo|imaging|cryoprecipitate|fibrinogen|transfus|component|vasopressor|noradrenaline|fluid|oxygen|dose|route|target|drug|infusion|prescri|procedure|caesarean|cesarean|surger|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Amniotic-fluid-embolism tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { obstetricsAfeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { obstetricsAfeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Call everyone first, before you have worked out what this is.');
    const next = markup(STATES[1]!, { obstetricsAfeGuidance: 'guided' });
    expect(next).toContain('the order they actually happened');
    expect(next).not.toContain('Call everyone first, before you have worked out what this is.');
  });

  it('refuses diagnostic closure and keeps the competing causes open', () => {
    const html = markup(STATES[2]!, { obstetricsAfeGuidance: 'guided' });
    expect(html).toContain('in a hemorrhage the order runs the other way');
    expect(html).toContain('suspicion is not closure');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { obstetricsAfeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { obstetricsAfeGuidance: 'guided', obstetricsAfeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
