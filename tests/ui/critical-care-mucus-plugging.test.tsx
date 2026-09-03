/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MUCUS_PLUGGING as SCENARIO } from '../../src/modules/critical-care/scenarios/mucus-plugging';

const base = (over: Record<string, unknown>) => ({
  supportAtTick: null, indicatorsAtTick: null, suctionAtTick: null,
  reassessmentAtTick: null, escalationAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['mucusPluggingAssessment']>);

const EMPTY = base({});
const SUPPORTED = base({ supportAtTick: 0 });
const INDICATORS = base({ supportAtTick: 0, indicatorsAtTick: 1 });
const SUCTIONED = base({ supportAtTick: 0, indicatorsAtTick: 1, suctionAtTick: 2 });
const REASSESSED = base({ supportAtTick: 0, indicatorsAtTick: 1, suctionAtTick: 2, reassessmentAtTick: 3 });
const DONE = base({ supportAtTick: 0, indicatorsAtTick: 1, suctionAtTick: 2, reassessmentAtTick: 3, escalationAtTick: 4 });
const STATES = [EMPTY, SUPPORTED, INDICATORS, SUCTIONED, REASSESSED, DONE];

const LABELS = ['Support oxygenation + call help', 'Review airway + graphics + mechanics',
  'Record indicated suction intent', 'Review post-clearance response',
  'Escalate persistent focal concern'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['mucusPluggingAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, mucusPluggingAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 450, respiratoryRateBpm: 20, fio2: 0.45, peep: 6, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onMucusPluggingResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['mucusPluggingAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Mucus-plugging experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/mucus-plugging"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/mucus-plugging' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasMucusPluggingResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'mucus-plugging'),
    }).hasMucusPluggingResponse).toBe(false);
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
    for (const state of [EMPTY, SUPPORTED, INDICATORS, SUCTIONED, REASSESSED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers to suction, instil saline, or scope', () => {
    expect(markup(EMPTY)).toContain('Listen to the resistance.');
    expect(markup(INDICATORS)).toContain('Clear, then prove it.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|saline|french|bronchoscop|catheter|\bmL\b|diagnos|prognos/iu);
    }
  });
});

describe('Mucus-plugging tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { mucusPluggingGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { mucusPluggingGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('oxygen does not require a diagnosis');
    const indicators = markup(SUPPORTED, { mucusPluggingGuidance: 'guided' });
    expect(indicators).toContain('the most persuasive item here and the least specific');
    expect(indicators).not.toContain('oxygen does not require a diagnosis');
  });

  it('holds the no-routine-saline boundary', () => {
    expect(markup(INDICATORS, { mucusPluggingGuidance: 'guided' }))
      .toContain('a habit rather than a treatment');
  });

  it('names the partial response as the reason it is easy to stop', () => {
    expect(markup(SUCTIONED, { mucusPluggingGuidance: 'guided' }))
      .toContain('makes it easy to stop');
  });

  it('goes quiet once the escalation is recorded', () => {
    expect(markup(DONE, { mucusPluggingGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { mucusPluggingGuidance: 'guided', mucusPluggingDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
