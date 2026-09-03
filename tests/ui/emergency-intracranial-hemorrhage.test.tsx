/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency ICH tray.
 * tests/ui/intracranial-hemorrhage-deterioration.test.tsx already covers the
 * tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';

const base = (over: Record<string, unknown>) => ({
  deteriorationReviewedAtTick: null, pathwayActivatedAtTick: null, findingsReviewedAtTick: null,
  reversalAtTick: null, pressureControlAtTick: null, escalatedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['intracranialHemorrhageAssessment']>);

const EMPTY = base({});
const DETERIORATION = base({ deteriorationReviewedAtTick: 0 });
const PATHWAY = base({ deteriorationReviewedAtTick: 0, pathwayActivatedAtTick: 1 });
const FINDINGS = base({ deteriorationReviewedAtTick: 0, pathwayActivatedAtTick: 1, findingsReviewedAtTick: 2 });
const REVERSAL = base({ deteriorationReviewedAtTick: 0, pathwayActivatedAtTick: 1, findingsReviewedAtTick: 2, reversalAtTick: 3 });
const PRESSURE = base({ deteriorationReviewedAtTick: 0, pathwayActivatedAtTick: 1, findingsReviewedAtTick: 2, reversalAtTick: 3, pressureControlAtTick: 4 });
const DONE = base({ deteriorationReviewedAtTick: 0, pathwayActivatedAtTick: 1, findingsReviewedAtTick: 2, reversalAtTick: 3, pressureControlAtTick: 4, escalatedAtTick: 5 });
const STATES = [EMPTY, DETERIORATION, PATHWAY, FINDINGS, REVERSAL, PRESSURE, DONE];

const LABELS = ['Review serial deterioration', 'Activate ICH pathway + support',
  'Review CT + warfarin + INR'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['intracranialHemorrhageAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, intracranialHemorrhageAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onIntracranialHemorrhageResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['intracranialHemorrhageAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency intracranial hemorrhage experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/intracranial-hemorrhage-deterioration"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/intracranial-hemorrhage-deterioration' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasIntracranialHemorrhageResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'intracranial-hemorrhage-deterioration'),
    }).hasIntracranialHemorrhageResponse).toBe(false);
  });

  it('keeps the recognition controls on screen at every state', () => {
    for (const state of STATES) {
      const html = markup(state);
      for (const label of LABELS) expect(html, label).toContain(label);
    }
  });
});

describe('Emergency intracranial hemorrhage tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { intracranialHemorrhageGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { intracranialHemorrhageGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the airway is a trajectory rather than a status');
    const pathway = markup(DETERIORATION, { intracranialHemorrhageGuidance: 'guided' });
    expect(pathway).toContain('a rare combination in this disease');
    expect(pathway).not.toContain('the airway is a trajectory rather than a status');
  });

  it('names the reversal as the step the engine will not let you skip', () => {
    expect(markup(FINDINGS, { intracranialHemorrhageGuidance: 'guided' }))
      .toContain('different halves of the same clock');
  });

  it('says the manner of the lowering is itself the treatment', () => {
    expect(markup(REVERSAL, { intracranialHemorrhageGuidance: 'guided' }))
      .toContain('the manner of the lowering is itself the treatment');
  });

  it('goes quiet once the escalation is recorded', () => {
    expect(markup(DONE, { intracranialHemorrhageGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { intracranialHemorrhageGuidance: 'guided', intracranialHemorrhageDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
