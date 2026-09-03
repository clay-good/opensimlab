/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency PE tray.
 * tests/ui/pulmonary-embolism-deterioration.test.tsx already covers the tray's
 * pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PULMONARY_EMBOLISM_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pulmonary-embolism-deterioration';

const base = (over: Record<string, unknown>) => ({
  severityReviewedAtTick: null, oxygenAtTick: null, anticoagulationAtTick: null,
  deteriorationAtTick: null, escalationAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pulmonaryEmbolismAssessment']>);

const EMPTY = base({});
const SEVERITY = base({ severityReviewedAtTick: 0 });
const OXYGEN = base({ severityReviewedAtTick: 0, oxygenAtTick: 1 });
const ANTICOAG_ONLY = base({ severityReviewedAtTick: 0, anticoagulationAtTick: 1 });
const BOTH = base({ severityReviewedAtTick: 0, oxygenAtTick: 1, anticoagulationAtTick: 2 });
const DETERIORATED = base({ severityReviewedAtTick: 0, oxygenAtTick: 1, anticoagulationAtTick: 2, deteriorationAtTick: 3 });
const DONE = base({ severityReviewedAtTick: 0, oxygenAtTick: 1, anticoagulationAtTick: 2, deteriorationAtTick: 3, escalationAtTick: 4 });
const STATES = [EMPTY, SEVERITY, OXYGEN, ANTICOAG_ONLY, BOTH, DETERIORATED, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pulmonaryEmbolismAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pulmonaryEmbolismAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPulmonaryEmbolismResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pulmonaryEmbolismAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency pulmonary embolism experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/pulmonary-embolism-deterioration"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/pulmonary-embolism-deterioration' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPulmonaryEmbolismResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: [] })
      .hasPulmonaryEmbolismResponse).toBe(false);
  });

  it('never renders a dose or a reperfusion modality on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/alteplase|tenecteplase|thrombectom|embolectom|\d\s?mg\b|prognos/iu);
    }
  });
});

describe('Emergency pulmonary embolism tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pulmonaryEmbolismGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pulmonaryEmbolismGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('he is still compensating');
    const initial = markup(SEVERITY, { pulmonaryEmbolismGuidance: 'guided' });
    expect(initial).toContain('the airway intervention is the more dangerous choice');
    expect(initial).not.toContain('he is still compensating');
  });

  it('puts the intubation claim where every path passes through', () => {
    expect(markup(SEVERITY, { pulmonaryEmbolismGuidance: 'guided' }))
      .toContain('can convert a compensating circulation into an arrest in under a minute');
  });

  it('picks up the missing intent whichever one the learner left', () => {
    expect(markup(ANTICOAG_ONLY, { pulmonaryEmbolismGuidance: 'guided' }))
      .toContain('not a reflex response to a saturation of 90%');
    expect(markup(OXYGEN, { pulmonaryEmbolismGuidance: 'guided' }))
      .toContain('an interval in which more clot forms on the existing one');
  });

  it('names the trap in miniature before the escalation', () => {
    expect(markup(BOTH, { pulmonaryEmbolismGuidance: 'guided' }))
      .toContain('the number you were watching got better and the patient got worse');
  });

  it('goes quiet once the escalation is recorded', () => {
    expect(markup(DONE, { pulmonaryEmbolismGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { pulmonaryEmbolismGuidance: 'guided', pulmonaryEmbolismDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
