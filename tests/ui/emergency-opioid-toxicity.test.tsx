/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency
 * opioid-toxicity tray. tests/ui/opioid-toxicity.test.tsx already covers the
 * tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OPIOID_TOXICITY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/opioid-toxicity';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, ventilationAtTick: null, antagonistAtTick: null,
  initialReassessmentAtTick: null, recurrenceReviewedAtTick: null, recurrencePlanAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['opioidToxicityAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const VENTILATED = base({ patternReviewedAtTick: 0, ventilationAtTick: 1 });
const NALOXONE = base({ patternReviewedAtTick: 0, ventilationAtTick: 1, antagonistAtTick: 2 });
const INITIAL = base({ patternReviewedAtTick: 0, ventilationAtTick: 1, antagonistAtTick: 2, initialReassessmentAtTick: 3 });
const RECURRENCE = base({ patternReviewedAtTick: 0, ventilationAtTick: 1, antagonistAtTick: 2, initialReassessmentAtTick: 3, recurrenceReviewedAtTick: 4 });
const DONE = base({ patternReviewedAtTick: 0, ventilationAtTick: 1, antagonistAtTick: 2, initialReassessmentAtTick: 3, recurrenceReviewedAtTick: 4, recurrencePlanAtTick: 5 });
const STATES = [EMPTY, PATTERN, VENTILATED, NALOXONE, INITIAL, RECURRENCE, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['opioidToxicityAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, opioidToxicityAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onOpioidToxicityResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['opioidToxicityAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency opioid toxicity experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/opioid-toxicity"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/opioid-toxicity' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasOpioidToxicityResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'opioid-toxicity'),
    }).hasOpioidToxicityResponse).toBe(false);
  });
});

describe('Emergency opioid toxicity tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { opioidToxicityGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { opioidToxicityGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('which supplemental oxygen can paper over');
    const ventilation = markup(PATTERN, { opioidToxicityGuidance: 'guided' });
    expect(ventilation).toContain('Nothing about naloxone is faster than a bag-mask');
    expect(ventilation).not.toContain('which supplemental oxygen can paper over');
  });

  it('aims the antagonist at breathing rather than arousal', () => {
    expect(markup(VENTILATED, { opioidToxicityGuidance: 'guided' }))
      .toContain('Full arousal is not the target');
  });

  it('warns that the antagonist wears off before the opioid does', () => {
    expect(markup(INITIAL, { opioidToxicityGuidance: 'guided' }))
      .toContain('the antagonist wears off while the agonist is still bound');
  });

  it('goes quiet once the safety plan is recorded', () => {
    expect(markup(DONE, { opioidToxicityGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { opioidToxicityGuidance: 'guided', opioidToxicityDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });

  it('never renders a dose or a discharge on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/\d\s?mg\b|discharg|prognos/iu);
    }
  });
});
