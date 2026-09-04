/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency septic-shock
 * tray. tests/ui/septic-shock.test.tsx already covers the tray's pre-existing
 * behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEPTIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/septic-shock';

const base = (over: Record<string, unknown>) => ({
  infectionAndOrganDysfunctionReviewedAtTick: null, culturesAndLactateAtTick: null,
  antimicrobialIntentAtTick: null, initialCrystalloidAtTick: null,
  postFluidReassessmentAtTick: null, norepinephrineIntentAtTick: null,
  sourceControlEscalationAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['septicShockAssessment']>);

const EMPTY = base({});
const REVIEWED = base({ infectionAndOrganDysfunctionReviewedAtTick: 1 });
const CULTURED = base({ infectionAndOrganDysfunctionReviewedAtTick: 1, culturesAndLactateAtTick: 2 });
const DOSED = base({ infectionAndOrganDysfunctionReviewedAtTick: 1, culturesAndLactateAtTick: 2, antimicrobialIntentAtTick: 3 });
const FLUID = base({ infectionAndOrganDysfunctionReviewedAtTick: 1, culturesAndLactateAtTick: 2, antimicrobialIntentAtTick: 3, initialCrystalloidAtTick: 4 });
const REASSESSED = base({ infectionAndOrganDysfunctionReviewedAtTick: 1, culturesAndLactateAtTick: 2, antimicrobialIntentAtTick: 3, initialCrystalloidAtTick: 4, postFluidReassessmentAtTick: 5 });
const PRESSED = base({ infectionAndOrganDysfunctionReviewedAtTick: 1, culturesAndLactateAtTick: 2, antimicrobialIntentAtTick: 3, initialCrystalloidAtTick: 4, postFluidReassessmentAtTick: 5, norepinephrineIntentAtTick: 6 });
const DONE = base({ infectionAndOrganDysfunctionReviewedAtTick: 1, culturesAndLactateAtTick: 2, antimicrobialIntentAtTick: 3, initialCrystalloidAtTick: 4, postFluidReassessmentAtTick: 5, norepinephrineIntentAtTick: 6, sourceControlEscalationAtTick: 7 });
const STATES = [EMPTY, REVIEWED, CULTURED, DOSED, FLUID, REASSESSED, PRESSED, DONE];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['septicShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, septicShockAssessment: assessment } as never,
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onSepticShockAssessment: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['septicShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

describe('Emergency septic shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/septic-shock"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/septic-shock' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the sepsis-pattern event rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasSepticShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'sepsis-pattern'),
    }).hasSepticShockResponse).toBe(false);
  });

  it('never renders an agent name or an outcome claim on any control', () => {
    for (const html of STATES.map((state) => markup(state))) {
      const labels = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]!).join(' ');
      expect(labels).not.toMatch(/piperacillin|meropenem|vancomycin|discharg|prognos|cured/iu);
    }
  });
});

describe('Emergency septic shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { emergencySepticShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { emergencySepticShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Sepsis is that conjunction rather than either half');
    const cultures = markup(REVIEWED, { emergencySepticShockGuidance: 'guided' });
    expect(cultures).toContain('can sterilise a bottle within minutes');
    expect(cultures).not.toContain('Sepsis is that conjunction rather than either half');
  });

  it('gives the honest reason the fluid course is bounded', () => {
    expect(markup(DOSED, { emergencySepticShockGuidance: 'guided' }))
      .toContain('rather than a tap left running');
  });

  it('reads persistent shock as tone rather than volume', () => {
    expect(markup(FLUID, { emergencySepticShockGuidance: 'guided' }))
      .toContain('the problem is vascular tone rather than volume');
  });

  it('names the step the engine never gated', () => {
    expect(markup(PRESSED, { emergencySepticShockGuidance: 'guided' }))
      .toContain('stays septic on perfect antibiotics until somebody drains it');
  });

  it('goes quiet once source control is escalated', () => {
    expect(markup(DONE, { emergencySepticShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const watching = markup(EMPTY, { emergencySepticShockGuidance: 'guided', emergencySepticShockDemonstrating: true });
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
