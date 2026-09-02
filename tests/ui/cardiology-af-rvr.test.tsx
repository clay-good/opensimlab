/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE as SCENARIO } from '../../src/modules/cardiology/scenarios/atrial-fibrillation-with-rapid-response';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  hemodynamicallyStable: true as const,
  durationCertain: false as const,
  exactScoreCalculated: false as const,
  treatmentDelivered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  stabilityAtTick: null, contextAtTick: null, rateIntentAtTick: null,
  strokePreventionAtTick: null, reassessmentAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['afRvrAssessment']>);

const EMPTY = base({});
const STABILITY = base({ stabilityAtTick: 0 });
const CONTEXT = base({ stabilityAtTick: 0, contextAtTick: 1 });
const RATE = base({ stabilityAtTick: 0, contextAtTick: 1, rateIntentAtTick: 2 });
const STROKE = base({ stabilityAtTick: 0, contextAtTick: 1, rateIntentAtTick: 2, strokePreventionAtTick: 3 });
const DONE = base({ stabilityAtTick: 0, contextAtTick: 1, rateIntentAtTick: 2, strokePreventionAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, STABILITY, CONTEXT, RATE, STROKE, DONE];

const LABELS = ['Reconcile rhythm + stability', 'Review duration + contributors',
  'Record patient-specific rate intent', 'Review stroke prevention + cardioversion context',
  'Reassess trajectory + ownership'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['afRvrAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, afRvrAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAfRvrResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['afRvrAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('AF with rapid ventricular response experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/atrial-fibrillation-with-rapid-response"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/atrial-fibrillation-with-rapid-response' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAfRvrResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'atrial-fibrillation-with-rapid-response'),
    }).hasAfRvrResponse).toBe(false);
  });

  it('keeps all five steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('never offers an agent, a target rate, a score, or a cardioversion', () => {
    expect(markup(EMPTY)).toContain('Treat the patient before the number.');
    expect(markup(RATE)).toContain('Rate is one lane. Stroke prevention is another.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/metoprolol|diltiazem|digoxin|amiodarone|apixaban|warfarin|CHA2DS2|HAS-BLED|cardiovert|mg\b|diagnos|prognos/iu);
    }
  });
});

describe('AF-RVR tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { afRvrGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { afRvrGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Both halves of that matter');
    const context = markup(STABILITY, { afRvrGuidance: 'guided' });
    expect(context).toContain('find out how long this has been going on');
    expect(context).not.toContain('Both halves of that matter');
  });

  it('names the duration gap as the consequential fact', () => {
    const html = markup(STABILITY, { afRvrGuidance: 'guided' });
    expect(html).toContain('the single most consequential fact in the consultation');
  });

  it('keeps the stroke question on its own lane', () => {
    const html = markup(RATE, { afRvrGuidance: 'guided' });
    expect(html).toContain('a more comfortable patient with exactly the same atrium');
    expect(html).toContain('not by whether she now feels better');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { afRvrGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { afRvrGuidance: 'guided', afRvrDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
