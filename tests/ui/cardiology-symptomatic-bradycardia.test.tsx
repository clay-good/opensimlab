/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/symptomatic-sinus-bradycardia-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  hemodynamicallyStable: true as const,
  mechanismProven: false as const,
  treatmentDelivered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  stabilityAtTick: null, contextAtTick: null, correlationAtTick: null,
  pacingEvaluationAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['symptomaticBradycardiaAssessment']>);

const EMPTY = base({});
const STABILITY = base({ stabilityAtTick: 0 });
const CONTEXT = base({ stabilityAtTick: 0, contextAtTick: 1 });
const CORRELATED = base({ stabilityAtTick: 0, correlationAtTick: 1 });
const BOTH = base({ stabilityAtTick: 0, contextAtTick: 1, correlationAtTick: 2 });
const PACING = base({ stabilityAtTick: 0, contextAtTick: 1, correlationAtTick: 2, pacingEvaluationAtTick: 3 });
const DONE = base({ stabilityAtTick: 0, contextAtTick: 1, correlationAtTick: 2, pacingEvaluationAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, STABILITY, CONTEXT, CORRELATED, BOTH, PACING, DONE];

const LABELS = ['Reconcile rate + stability', 'Review symptom-rhythm record',
  'Review reversible context', 'Record shared pacing evaluation', 'Record safety net + owner'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['symptomaticBradycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, symptomaticBradycardiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onSymptomaticBradycardiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['symptomaticBradycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Symptomatic sinus-bradycardia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/symptomatic-sinus-bradycardia-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/symptomatic-sinus-bradycardia-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasSymptomaticBradycardiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'symptomatic-sinus-bradycardia-reassessment'),
    }).hasSymptomaticBradycardiaResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('offers both review lanes at once, and neither before stability', () => {
    const opening = markup(EMPTY);
    for (const lane of ['Review symptom-rhythm record', 'Review reversible context']) {
      expect(opening).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
    const ready = markup(STABILITY);
    for (const lane of ['Review symptom-rhythm record', 'Review reversible context']) {
      expect(ready).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('never offers a threshold, a device, a medication change, or a mechanism', () => {
    expect(markup(EMPTY)).toContain('Slow rhythm. Match the symptom.');
    expect(markup(BOTH)).toContain('Review causes. Plan together.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|atropine|implant|program|mg\b|dose|diagnos|prognos|eligib/iu);
    }
  });
});

describe('Symptomatic bradycardia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { symptomaticBradycardiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { symptomaticBradycardiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Symptomatic and unstable are different words');
    const review = markup(STABILITY, { symptomaticBradycardiaGuidance: 'guided' });
    expect(review).toContain('Two review lanes are open');
    expect(review).not.toContain('Symptomatic and unstable are different words');
  });

  it('follows whichever lane the learner left open', () => {
    expect(markup(CONTEXT, { symptomaticBradycardiaGuidance: 'guided' }))
      .toContain('whether her episodes and the slow rate happen at the same time');
    expect(markup(CORRELATED, { symptomaticBradycardiaGuidance: 'guided' }))
      .toContain('without stopping her medication');
  });

  it('refuses to let a low rate earn a device', () => {
    const html = markup(BOTH, { symptomaticBradycardiaGuidance: 'guided' });
    expect(html).toContain('not something a rate of 44 earns on its own');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { symptomaticBradycardiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { symptomaticBradycardiaGuidance: 'guided', symptomaticBradycardiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
