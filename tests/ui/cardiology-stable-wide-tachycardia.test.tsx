/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { WIDE_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/wide-complex-tachycardia';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  hemodynamicallyStable: true as const,
  mechanismProven: false as const,
  learnerTreatmentDelivered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  stabilityAtTick: null, contextAtTick: null, readinessAtTick: null, medicationAtTick: null,
  nonresponseAtTick: null, cardioversionAtTick: null, reassessmentAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['stableWideTachycardiaAssessment']>);

const EMPTY = base({});
const STABILITY = base({ stabilityAtTick: 0 });
const CONTEXT = base({ stabilityAtTick: 0, contextAtTick: 1 });
const READY = base({ stabilityAtTick: 0, contextAtTick: 1, readinessAtTick: 2 });
const MEDICATION = base({ stabilityAtTick: 0, contextAtTick: 1, readinessAtTick: 2, medicationAtTick: 3 });
const SEEN = base({ stabilityAtTick: 0, contextAtTick: 1, readinessAtTick: 2, medicationAtTick: 3, nonresponseAtTick: 4 });
const SHOCK = base({ stabilityAtTick: 0, contextAtTick: 1, readinessAtTick: 2, medicationAtTick: 3, nonresponseAtTick: 4, cardioversionAtTick: 5 });
const DONE = base({ stabilityAtTick: 0, contextAtTick: 1, readinessAtTick: 2, medicationAtTick: 3, nonresponseAtTick: 4, cardioversionAtTick: 5, reassessmentAtTick: 6 });
const STATES = [EMPTY, STABILITY, CONTEXT, READY, MEDICATION, SEEN, SHOCK, DONE];

const LABELS = ['Reconcile pulse + stability', 'Review morphology + context',
  'Prepare monitored WCT pathway', 'Record expert-guided medication path',
  'Review observed medication response', 'Record synchronized-cardioversion intent',
  'Reassess rhythm + ownership'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stableWideTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, stableWideTachycardiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onStableWideTachycardiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stableWideTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Stable wide-complex tachycardia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/wide-complex-tachycardia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/wide-complex-tachycardia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasStableWideTachycardiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'wide-complex-tachycardia'),
    }).hasStableWideTachycardiaResponse).toBe(false);
  });

  it('keeps all seven steps on screen, one more than there are objectives', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(7);
    }
  });

  it('never offers a dose, an energy, a sedative, or a mechanism', () => {
    expect(markup(EMPTY)).toContain('Wide rhythm. Steady patient.');
    expect(markup(MEDICATION)).toContain('One pathway. Watch closely.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|mg\/kg|joule|\d+ ?J\b|midazolam|amiodarone|ablat|ICD|diagnos|prognos/iu);
    }
  });
});

describe('Stable wide-tachycardia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { stableWideTachycardiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { stableWideTachycardiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Confirm the pulse first');
    const context = markup(STABILITY, { stableWideTachycardiaGuidance: 'guided' });
    expect(context).toContain('Preserve the differential');
    expect(context).not.toContain('Confirm the pulse first');
  });

  it('declines to litigate morphology criteria', () => {
    const html = markup(STABILITY, { stableWideTachycardiaGuidance: 'guided' });
    expect(html).toContain('not an argument about morphology criteria');
    expect(html).toContain('safe when wrong in either direction');
  });

  it('says readiness ordering is the point', () => {
    const html = markup(CONTEXT, { stableWideTachycardiaGuidance: 'guided' });
    expect(html).toContain('that ordering is the point rather than housekeeping');
  });

  it('has a beat for the unchecked medication path', () => {
    const html = markup(MEDICATION, { stableWideTachycardiaGuidance: 'guided' });
    expect(html).toContain('This is its own step for a reason');
    expect(html).toContain('nonresponse rather than deterioration');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { stableWideTachycardiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { stableWideTachycardiaGuidance: 'guided', stableWideTachycardiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
