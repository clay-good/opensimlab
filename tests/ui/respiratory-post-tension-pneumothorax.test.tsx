/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/spontaneous-tension-pneumothorax-post-drainage-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, priorTensionPhysiologyAuthored: true as const,
  experiencedTeamDrainageAuthored: true as const,
  decompressionPerformedByLearner: false as const, chestDrainPlacedByLearner: false as const,
  drainManipulatedByLearner: false as const, suctionOrClampSelected: false as const,
  deviceOrSiteSelected: false as const, oxygenDeliveredByLearner: false as const,
  medicationDeliveredByLearner: false as const, testAcquiredByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  dispositionDetermined: false as const, recurrencePredicted: false as const,
  outcomePredicted: false as const,
};
const EMPTY = { trajectoryAtTick: null, drainageResponseAtTick: null, systemAtTick: null, etiologyAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Reconcile tension event + prior care', 'Review post-drainage response', 'Review drain system + complications', 'Review causes + definitive planning', 'Hand off unresolved pleural work'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, drainageResponseAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, drainageResponseAtTick: 1, systemAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, drainageResponseAtTick: 1, systemAtTick: 2, etiologyAtTick: 3 },
  { trajectoryAtTick: 0, drainageResponseAtTick: 1, systemAtTick: 2, etiologyAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postTensionPneumothoraxAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, postTensionPneumothoraxAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPostTensionPneumothoraxResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['postTensionPneumothoraxAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory post-drainage pneumothorax experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/spontaneous-tension-pneumothorax-post-drainage-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/spontaneous-tension-pneumothorax-post-drainage-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a drain action, suction, or a procedure', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPostTensionPneumothoraxResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'spontaneous-tension-pneumothorax-post-drainage-reassessment'),
    }).hasPostTensionPneumothoraxResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('Relief is the start of the next watch.');
    expect(markup(STATES[5]!)).toContain('Unresolved pleural work handed off');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|sample|acquire|order the|send the|clamp|suction|milk the|pull the|reposition|insert|needle|pleurodesis|thoracoscop|dose|drug|prescri|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Post-drainage pneumothorax tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { postTensionPneumothoraxGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { postTensionPneumothoraxGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('how close this was six hours ago');
    const next = markup(STATES[1]!, { postTensionPneumothoraxGuidance: 'guided' });
    expect(next).toContain('without upgrading it into a resolution');
    expect(next).not.toContain('how close this was six hours ago');
  });

  it('pairs the drain observations with what failure would look like', () => {
    const html = markup(STATES[2]!, { postTensionPneumothoraxGuidance: 'guided' });
    expect(html).toContain('the bubbling says the air leak has not sealed');
    expect(html).toContain('fine right up until he is not');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { postTensionPneumothoraxGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { postTensionPneumothoraxGuidance: 'guided', postTensionPneumothoraxDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
