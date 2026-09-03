/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency hyponatraemia
 * tray. tests/ui/severe-hyponatremia-with-seizure.test.tsx already covers the
 * tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, stabilizedAtTick: null, hypertonicAtTick: null,
  reassessedAtTick: null, guardrailsAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['hyponatremiaAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const STABILIZED = base({ patternReviewedAtTick: 0, stabilizedAtTick: 1 });
const HYPERTONIC = base({ patternReviewedAtTick: 0, stabilizedAtTick: 1, hypertonicAtTick: 2 });
const REASSESSED = base({ patternReviewedAtTick: 0, stabilizedAtTick: 1, hypertonicAtTick: 2, reassessedAtTick: 3 });
const DONE = base({ patternReviewedAtTick: 0, stabilizedAtTick: 1, hypertonicAtTick: 2, reassessedAtTick: 3, guardrailsAtTick: 4 });
const STATES = [EMPTY, PATTERN, STABILIZED, HYPERTONIC, REASSESSED, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hyponatremiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, hyponatremiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHyponatremiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hyponatremiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency severe hyponatremia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/severe-hyponatremia-with-seizure"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/severe-hyponatremia-with-seizure' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasSevereHyponatremiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'severe-hyponatremia-with-seizure'),
    }).hasSevereHyponatremiaResponse).toBe(false);
  });

  it('never renders a concentration or a normal-sodium target on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/\b3\s?%|\d+\s?mL\b|135|discharg|prognos/iu);
    }
  });
});

describe('Emergency severe hyponatremia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { severeHyponatremiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { severeHyponatremiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a different problem with a different tempo');
    const stabilization = markup(PATTERN, { severeHyponatremiaGuidance: 'guided' });
    expect(stabilization).toContain('while you are drawing up the treatment for the first');
    expect(stabilization).not.toContain('a different problem with a different tempo');
  });

  it('targets a safe sodium rather than a normal one', () => {
    expect(markup(STABILIZED, { severeHyponatremiaGuidance: 'guided' }))
      .toContain('not a normal sodium but a safe one');
  });

  it('names the urine output as the thing that changed the danger', () => {
    expect(markup(HYPERTONIC, { severeHyponatremiaGuidance: 'guided' }))
      .toContain('The danger has just changed direction');
  });

  it('holds the thiazide at the guardrails beat', () => {
    expect(markup(REASSESSED, { severeHyponatremiaGuidance: 'guided' }))
      .toContain('the commonest drug cause of exactly this picture');
  });

  it('goes quiet once the guardrails are recorded', () => {
    expect(markup(DONE, { severeHyponatremiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { severeHyponatremiaGuidance: 'guided', severeHyponatremiaDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
