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
import { CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE as SCENARIO } from '../../src/modules/obstetrics/scenarios/concealed-placental-abruption-hemorrhage';

const objectives = SCENARIO.metadata.objectives.map(({ id }) => id);
const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect mother + fetus', 'Trust the pattern, not the puddle', 'Bring both teams together', 'Review blood + competing causes', 'Record urgent intent + reassess', 'Hand off both horizons'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3 },
  { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4 },
  { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, evidenceAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsConcealedAbruptionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsConcealedAbruptionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onObstetricsConcealedAbruptionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsConcealedAbruptionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Obstetrics concealed-abruption UI', () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });
  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('.actions__tray button')];

  it('offers exactly one live control per recorded step, in the enforced order', () => {
    STATES.forEach((state, index) => {
      const onAction = vi.fn();
      act(() => root.render(createElement(ActionCockpit, props(state, { onObstetricsConcealedAbruptionResponse: onAction }))));
      expect(buttons()).toHaveLength(index === 6 ? 0 : 1);
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      if (index === 6) return;
      expect(buttons()[0]!.textContent).toBe(LABELS[index]);
      act(() => buttons()[0]!.click());
      expect(onAction).toHaveBeenCalledWith(objectives[index]);
    });
  });

  it('requires exact identity and debriefs exact event prefixes', () => {
    expect(crisisResponseAvailability(SCENARIO, [])).toMatchObject({ hasObstetricsConcealedAbruptionResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'clone' } }, []))
      .toMatchObject({ hasObstetricsConcealedAbruptionResponse: false });
    const suffixes = ['trajectory-reconciled', 'pattern-recognized', 'support-activated', 'evidence-reviewed', 'intent-and-reassessment-recorded', 'active-risk-handoff-recorded'];
    const log: EngineEvent[] = suffixes.map((suffix, tick) => ({ tick, eventId: `obstetrics-concealed-abruption-${suffix}-${tick}`, severity: 'info', category: 'assessment', message: suffix }));
    expect(objectiveFindings(SCENARIO, [], 0, 0, [], log).map(({ outcome }) => outcome)).toEqual(Array(6).fill('met'));
  });
});

describe('Obstetrics concealed-abruption experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/concealed-placental-abruption-hemorrhage"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/concealed-placental-abruption-hemorrhage' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a measurement, a scan, or a delivery', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsConcealedAbruptionResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasObstetricsConcealedAbruptionResponse).toBe(false);
    expect(STATES.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(STATES[0]!)).toContain('tell more than the visible blood alone.');
    expect(markup(STATES[5]!)).toContain('Total loss, coagulation, anesthesia, delivery, treatment effect, and outcome remain open.');
    expect(markup(STATES[6]!)).toContain('Hidden loss, shock, coagulation, fetal, delivery, neonatal, dignity, support, fertility, and outcome uncertainty handed off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/weigh|measure|estimat|examin|palpat|history|ultrasound|scan|sample|acquire|calculat|interpret the|fibrinogen|transfus|component|caesarean|cesarean|deliver the|anesthe|anaesthe|epidural|spinal|fluid|oxygen|dose|route|drug|infusion|prescri|procedure|laparotom|surger|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Concealed-abruption tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { obstetricsConcealedAbruptionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { obstetricsConcealedAbruptionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Believe the physiology over the eighty millilitres');
    const next = markup(STATES[1]!, { obstetricsConcealedAbruptionGuidance: 'guided' });
    expect(next).toContain('do not send for a scan to be sure');
    expect(next).not.toContain('Believe the physiology over the eighty millilitres');
  });

  it('refuses the scan and keeps the competing causes open', () => {
    const html = markup(STATES[1]!, { obstetricsConcealedAbruptionGuidance: 'guided' });
    expect(html).toContain('visible volume is not total loss');
    expect(html).toContain('stay open behind the name');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { obstetricsConcealedAbruptionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { obstetricsConcealedAbruptionGuidance: 'guided', obstetricsConcealedAbruptionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
