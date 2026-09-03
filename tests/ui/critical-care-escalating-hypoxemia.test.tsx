/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ESCALATING_HYPOXEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/escalating-hypoxemia';

const base = (over: Record<string, unknown>) => ({
  signalAtTick: null, supportAtTick: null, deliveryPathAtTick: null,
  bedsidePatternAtTick: null, escalationAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['escalatingHypoxemiaAssessment']>);

const EMPTY = base({});
const SIGNAL = base({ signalAtTick: 0 });
const SUPPORTED = base({ signalAtTick: 0, supportAtTick: 1 });
const PATH = base({ signalAtTick: 0, supportAtTick: 1, deliveryPathAtTick: 2 });
const PATTERN = base({ signalAtTick: 0, supportAtTick: 1, deliveryPathAtTick: 2, bedsidePatternAtTick: 3 });
const DONE = base({ signalAtTick: 0, supportAtTick: 1, deliveryPathAtTick: 2, bedsidePatternAtTick: 3, escalationAtTick: 4 });
const STATES = [EMPTY, SIGNAL, SUPPORTED, PATH, PATTERN, DONE];

const LABELS = ['Corroborate the decline', 'Support oxygenation + call help',
  'Trace source → circuit → tube', 'Integrate chest + pressure + flow',
  'Escalate + review 15-min response'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['escalatingHypoxemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, escalatingHypoxemiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 430, respiratoryRateBpm: 22, fio2: 0.5, peep: 10, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onEscalatingHypoxemiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['escalatingHypoxemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Escalating-hypoxemia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/escalating-hypoxemia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/escalating-hypoxemia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasEscalatingHypoxemiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'escalating-hypoxemia'),
    }).hasEscalatingHypoxemiaResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens exactly one step at a time, because the chain is the lesson', () => {
    const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0])).length;
    for (const state of [EMPTY, SIGNAL, SUPPORTED, PATH, PATTERN]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a setting, proning, recruitment, or a tube exchange', () => {
    expect(markup(EMPTY)).toContain('Believe the drop. Verify the signal.');
    expect(markup(SUPPORTED)).toContain('Trace oxygen from wall to alveolus.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|PEEP|FiO|prone|recruit|bronchoscop|exchange|ECMO|diagnos|prognos/iu);
    }
  });
});

describe('Escalating-hypoxemia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { escalatingHypoxemiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { escalatingHypoxemiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('how a team ends up treating a probe');
    const support = markup(SIGNAL, { escalatingHypoxemiaGuidance: 'guided' });
    expect(support).toContain('those two facts do not compete');
    expect(support).not.toContain('how a team ends up treating a probe');
  });

  it('gives the direction of the trace', () => {
    expect(markup(SUPPORTED, { escalatingHypoxemiaGuidance: 'guided' }))
      .toContain('outside-in, in order');
  });

  it('marks the parenchymal conclusion as what remains', () => {
    expect(markup(PATH, { escalatingHypoxemiaGuidance: 'guided' }))
      .toContain('rather than what was assumed at the start');
  });

  it('goes quiet once the escalation is recorded', () => {
    expect(markup(DONE, { escalatingHypoxemiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { escalatingHypoxemiaGuidance: 'guided', escalatingHypoxemiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
