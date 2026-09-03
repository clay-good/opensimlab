/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ICU_HANDOFF_WITH_HIDDEN_DETERIORATION as SCENARIO } from '../../src/modules/critical-care/scenarios/icu-handoff-with-hidden-deterioration';

const base = (over: Record<string, unknown>) => ({
  readinessAtTick: null, contentAtTick: null, crossCheckAtTick: null,
  escalationAtTick: null, acceptanceAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['icuHiddenDeteriorationHandoffAssessment']>);

const EMPTY = base({});
const READY = base({ readinessAtTick: 0 });
const CONTENT = base({ readinessAtTick: 0, contentAtTick: 1 });
const CHECKED = base({ readinessAtTick: 0, contentAtTick: 1, crossCheckAtTick: 2 });
const ESCALATED = base({ readinessAtTick: 0, contentAtTick: 1, crossCheckAtTick: 2, escalationAtTick: 3 });
const DONE = base({ readinessAtTick: 0, contentAtTick: 1, crossCheckAtTick: 2, escalationAtTick: 3, acceptanceAtTick: 4 });
const STATES = [EMPTY, READY, CONTENT, CHECKED, ESCALATED, DONE];

const LABELS = ['Establish readiness + bedside coverage', 'Receive severity + support + pending work',
  'Cross-check patient + trends + devices', 'Escalate + assign triggers + owners',
  'Synthesize + accept + reassess'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['icuHiddenDeteriorationHandoffAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, icuHiddenDeteriorationHandoffAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 420, respiratoryRateBpm: 18, fio2: 0.35, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onIcuHiddenDeteriorationHandoffResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['icuHiddenDeteriorationHandoffAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('ICU handoff experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/icu-handoff-with-hidden-deterioration"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/icu-handoff-with-hidden-deterioration' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasIcuHiddenDeteriorationHandoffResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'icu-handoff-with-hidden-deterioration'),
    }).hasIcuHiddenDeteriorationHandoffResponse).toBe(false);
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
    for (const state of [EMPTY, READY, CONTENT, CHECKED, ESCALATED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a titration, an order, or a diagnosis', () => {
    expect(markup(EMPTY)).toContain('Receive the story. Check the patient.');
    expect(markup(CHECKED)).toContain('Make the next move unmistakable.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/noradren|norepine|mcg\/kg|bolus|antibiotic|diagnos|prognos/iu);
    }
  });
});

describe('ICU handoff tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { icuHiddenDeteriorationHandoffGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { icuHiddenDeteriorationHandoffGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('stops being examined');
    const content = markup(READY, { icuHiddenDeteriorationHandoffGuidance: 'guided' });
    expect(content).toContain('you cannot cross-check what you did not hear');
    expect(content).not.toContain('stops being examined');
  });

  it('reads the pressure and the EtCO2 the hard way', () => {
    expect(markup(CONTENT, { icuHiddenDeteriorationHandoffGuidance: 'guided' }))
      .toContain('because the number was held up');
  });

  it('puts names on the tasks', () => {
    expect(markup(CHECKED, { icuHiddenDeteriorationHandoffGuidance: 'guided' }))
      .toContain('Unowned tasks at shift change are the ones that do not happen');
  });

  it('goes quiet once the handoff is accepted', () => {
    expect(markup(DONE, { icuHiddenDeteriorationHandoffGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { icuHiddenDeteriorationHandoffGuidance: 'guided', icuHiddenDeteriorationHandoffDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
