/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COMPLETE_HEART_BLOCK as SCENARIO } from '../../src/modules/cardiology/scenarios/complete-heart-block';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  hemodynamicallyStable: true as const,
  pacingDelivered: false as const,
  captureAssessed: false as const,
};
const base = (over: Record<string, unknown>) => ({
  stabilityAtTick: null, contextAtTick: null, pathwayAtTick: null,
  reassessmentAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['completeHeartBlockAssessment']>);

const EMPTY = base({});
const STABILITY = base({ stabilityAtTick: 0 });
const CONTEXT = base({ stabilityAtTick: 0, contextAtTick: 1 });
const PATHWAY = base({ stabilityAtTick: 0, pathwayAtTick: 1 });
const BOTH = base({ stabilityAtTick: 0, pathwayAtTick: 1, contextAtTick: 2 });
const REASSESSED = base({ stabilityAtTick: 0, pathwayAtTick: 1, contextAtTick: 2, reassessmentAtTick: 3 });
const DONE = base({ stabilityAtTick: 0, pathwayAtTick: 1, contextAtTick: 2, reassessmentAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, STABILITY, CONTEXT, PATHWAY, BOTH, REASSESSED, DONE];

const LABELS = ['Reconcile block + stability', 'Review causes + escape rhythm',
  'Activate monitored pacing pathway', 'Reassess block + perfusion',
  'Record pacing evaluation + handoff'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['completeHeartBlockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, completeHeartBlockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCompleteHeartBlockResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['completeHeartBlockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Complete heart block experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/complete-heart-block"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/complete-heart-block' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCompleteHeartBlockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'complete-heart-block'),
    }).hasCompleteHeartBlockResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('offers both lanes at once, and neither before stability', () => {
    const opening = markup(EMPTY);
    for (const lane of ['Review causes \\+ escape rhythm', 'Activate monitored pacing pathway']) {
      expect(opening).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
    const ready = markup(STABILITY);
    for (const lane of ['Review causes \\+ escape rhythm', 'Activate monitored pacing pathway']) {
      expect(ready).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('never offers to pace, select a device, or name a cause', () => {
    expect(markup(EMPTY)).toContain('Two rhythms. One patient.');
    expect(markup(BOTH)).toContain('Prepare early. Decide together.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|atropine|implant|program|capture|joule|\bmA\b|diagnos|prognos|eligib/iu);
    }
  });
});

describe('Complete heart block tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { completeHeartBlockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { completeHeartBlockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('That is not a slow sinus rhythm');
    const parallel = markup(STABILITY, { completeHeartBlockGuidance: 'guided' });
    expect(parallel).toContain('Two things need doing and they do not queue');
    expect(parallel).not.toContain('That is not a slow sinus rhythm');
  });

  it('follows whichever lane the learner left open', () => {
    expect(markup(CONTEXT, { completeHeartBlockGuidance: 'guided' }))
      .toContain('Do not let that hold up the escalation');
    expect(markup(PATHWAY, { completeHeartBlockGuidance: 'guided' }))
      .toContain('be careful what you conclude from not finding one');
  });

  it('says why an uneventful hour is dangerous rather than reassuring', () => {
    const html = markup(BOTH, { completeHeartBlockGuidance: 'guided' });
    expect(html).toContain('most likely to talk a team out of the urgency it correctly felt');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { completeHeartBlockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { completeHeartBlockGuidance: 'guided', completeHeartBlockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
