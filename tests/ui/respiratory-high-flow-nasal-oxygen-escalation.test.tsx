/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HIGH_FLOW_NASAL_OXYGEN_ESCALATION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/high-flow-nasal-oxygen-escalation';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  acuteHypoxemicRespiratoryFailureAuthored: true as const,
  acuteHypercapnicAcidosisAuthored: false as const,
  conventionalOxygenFunctionAuthored: true as const,
  immediateAirwayFailureAuthored: false as const,
  patientExaminedByLearner: false as const, bloodGasAcquiredByLearner: false as const,
  bloodGasInterpretedByLearner: false as const, imagingAcquiredByLearner: false as const,
  deviceInspectedByLearner: false as const, deviceSelectedByLearner: false as const,
  cannulaSelectedByLearner: false as const, flowSelectedByLearner: false as const,
  fio2SelectedByLearner: false as const, oxygenTargetSelectedByLearner: false as const,
  deviceOperatedByLearner: false as const, oxygenDeliveredByLearner: false as const,
  treatmentDeliveredByLearner: false as const, intubationPerformedByLearner: false as const,
  durableSuccessProven: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, suitabilityAtTick: null, selectionAtTick: null,
  responseAtTick: null, guardsAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null, highFlowTrialIntentRecorded: false,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['highFlowOxygenEscalationAssessment']>);

const EMPTY = base({});
const SUITABLE = base({ trajectoryAtTick: 0, suitabilityAtTick: 1 });
const AFTER_CONVENTIONAL = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, lastUnsupportedChoice: 'conventional' });
const AFTER_BILEVEL = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, lastUnsupportedChoice: 'bilevel' });
const SELECTED = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, highFlowTrialIntentRecorded: true });
const RESPONDED = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, highFlowTrialIntentRecorded: true });
const AFTER_RESOLVED = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, highFlowTrialIntentRecorded: true, lastUnsupportedChoice: 'resolved' });
const AFTER_REDUCED = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, highFlowTrialIntentRecorded: true, lastUnsupportedChoice: 'reduced-monitoring' });
const DONE = base({ trajectoryAtTick: 0, suitabilityAtTick: 1, selectionAtTick: 2, responseAtTick: 3, guardsAtTick: 4, handoffAtTick: 5, highFlowTrialIntentRecorded: true });
const STATES = [EMPTY, SUITABLE, AFTER_CONVENTIONAL, AFTER_BILEVEL, SELECTED, RESPONDED, AFTER_RESOLVED, AFTER_REDUCED, DONE];

const LABELS = ['Review oxygen + work trend', 'Review suitability + rescue',
  'High-flow nasal oxygen', 'Continue reservoir mask', 'Bilevel NIV',
  'Review 30-minute response', 'Continue + watch triggers',
  'Mark respiratory failure resolved', 'Reduce monitoring now',
  'Hand off active support + rescue plan'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['highFlowOxygenEscalationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, highFlowOxygenEscalationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 400, respiratoryRateBpm: 34, fio2: 0.5, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHighFlowOxygenEscalationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['highFlowOxygenEscalationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory high-flow escalation experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/high-flow-nasal-oxygen-escalation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/high-flow-nasal-oxygen-escalation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('offers each set of choices only at the moment it belongs to', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHighFlowOxygenEscalationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'high-flow-nasal-oxygen-escalation'),
    }).hasHighFlowOxygenEscalationResponse).toBe(false);
    const opening = markup(EMPTY);
    expect(opening).not.toContain('Continue reservoir mask');
    expect(opening).not.toContain('Mark respiratory failure resolved');
    const ready = markup(SUITABLE);
    expect(ready).toContain('High-flow nasal oxygen');
    expect(ready).toContain('Continue reservoir mask');
    expect(ready).toContain('Bilevel NIV');
    // The second decision point only appears once the response has been read.
    const responded = markup(RESPONDED);
    expect(responded).toContain('Continue + watch triggers');
    expect(responded).toContain('Mark respiratory failure resolved');
    expect(responded).toContain('Reduce monitoring now');
  });

  it('says what happened after each of the four refusals', () => {
    expect(markup(AFTER_CONVENTIONAL)).toContain('remain inadequate on the documented conventional support');
    expect(markup(AFTER_BILEVEL)).toContain('this person-preference case follows the HFNO pathway');
    expect(markup(AFTER_RESOLVED)).toContain('substantial support and active risk remain');
    expect(markup(AFTER_REDUCED)).toContain('still needs close reassessment and rapid rescue access');
  });

  it('never offers a flow, an FiO₂, a ratio, or an intubation', () => {
    expect(markup(EMPTY)).toContain('Match the support to the breath.');
    expect(markup(DONE)).toContain('A calmer breath still deserves a watchful plan.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|acquire|interpret|ROX|PaO₂\/FiO₂|FiO|flow rate|L\/min|temperatur|humidif|intubat|pron|suction|drug|dose|diagnose|disposition|discharge|prognos/iu);
    }
  });
});

describe('High-flow escalation tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { highFlowOxygenEscalationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { highFlowOxygenEscalationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('He is still not managing');
    const ready = markup(SUITABLE, { highFlowOxygenEscalationGuidance: 'guided' });
    expect(ready).toContain('keep the rescue plan next to it');
    expect(ready).not.toContain('He is still not managing');
  });

  it('answers the specific wrong choice at the first decision point', () => {
    const conventional = markup(AFTER_CONVENTIONAL, { highFlowOxygenEscalationGuidance: 'guided' });
    expect(conventional).toContain('Staying is a decision too');
    expect(conventional).not.toContain('Not a bad instinct');
    const bilevel = markup(AFTER_BILEVEL, { highFlowOxygenEscalationGuidance: 'guided' });
    expect(bilevel).toContain('Not a bad instinct');
    expect(bilevel).toContain('not a misunderstanding of the physiology');
    expect(bilevel).not.toContain('Staying is a decision too');
  });

  it('answers the specific wrong choice at the second decision point', () => {
    const resolved = markup(AFTER_RESOLVED, { highFlowOxygenEscalationGuidance: 'guided' });
    expect(resolved).toContain('Better is not resolved');
    expect(resolved).not.toContain('earns its keep');
    const reduced = markup(AFTER_REDUCED, { highFlowOxygenEscalationGuidance: 'guided' });
    expect(reduced).toContain('earns its keep');
    expect(reduced).toContain('the window in which delayed intubation happens');
    expect(reduced).not.toContain('Better is not resolved');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { highFlowOxygenEscalationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { highFlowOxygenEscalationGuidance: 'guided', highFlowOxygenEscalationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
