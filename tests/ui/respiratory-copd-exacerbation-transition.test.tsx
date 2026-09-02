/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/copd-exacerbation-transition-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  treatmentDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
  longTermOxygenEligibilityDetermined: false as const, regimenSelected: false as const,
  techniquePerformedByLearner: false as const, rehabilitationEnrolled: false as const,
  appointmentGuaranteed: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const EMPTY = { readinessAtTick: null, respiratoryNeedsAtTick: null, medicationAtTick: null, coordinationAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Reconcile recovery + readiness', 'Review residual breathing + oxygen needs', 'Review medication + technique ownership', 'Coordinate rehab + follow-up', 'Hand off unresolved transition work'];
const STATES = [EMPTY,
  { ...EMPTY, readinessAtTick: 0 },
  { ...EMPTY, readinessAtTick: 0, respiratoryNeedsAtTick: 1 },
  { ...EMPTY, readinessAtTick: 0, respiratoryNeedsAtTick: 1, medicationAtTick: 2 },
  { ...EMPTY, readinessAtTick: 0, respiratoryNeedsAtTick: 1, medicationAtTick: 2, coordinationAtTick: 3 },
  { readinessAtTick: 0, respiratoryNeedsAtTick: 1, medicationAtTick: 2, coordinationAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['copdTransitionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, copdTransitionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCopdTransitionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['copdTransitionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory COPD-transition experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/copd-exacerbation-transition-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/copd-exacerbation-transition-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a treatment, an eligibility, or a booking', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCopdTransitionResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasCopdTransitionResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('Better is not the same as ready.');
    expect(markup(STATES[4]!)).toContain('Coordination recorded');
    expect(markup(STATES[5]!)).toContain('Open transition work handed off with named owners');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|walk test|blood gas|sample|acquire|tiotropium|salbutamol|albuterol|steroid|antibiotic|prescri|switch|titrat|home oxygen|eligib|enrol|book |refer |dose|drug|procedure|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('COPD-transition tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { copdTransitionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { copdTransitionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('not from today’s numbers');
    const next = markup(STATES[1]!, { copdTransitionGuidance: 'guided' });
    expect(next).toContain('because that is the answer');
    expect(next).not.toContain('not from today’s numbers');
  });

  it('refuses to settle the oxygen from an acute snapshot', () => {
    const html = markup(STATES[1]!, { copdTransitionGuidance: 'guided' });
    expect(html).toContain('function is what decides whether home works');
    expect(html).toContain('does not establish long-term oxygen eligibility');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { copdTransitionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { copdTransitionGuidance: 'guided', copdTransitionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
