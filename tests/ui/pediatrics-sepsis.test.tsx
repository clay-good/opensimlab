/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_SEPSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-sepsis';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  suspectedInfectionAuthored: true as const, coagulationDysfunctionAuthored: true as const,
  phoenixSepsisScoreAuthored: 2 as const, phoenixCardiovascularSubscoreAuthored: 0 as const,
  sepsisWithoutShockAuthored: true as const, hypotensionAuthored: false as const,
  respiratoryDysfunctionAuthored: false as const, neurologicDysfunctionAuthored: false as const,
  sourceConfirmed: false as const, pathogenIdentified: false as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  scoreCalculatedByLearner: false as const, testAcquiredByLearner: false as const,
  testInterpretedByLearner: false as const, cultureAcquiredByLearner: false as const,
  diagnosisMadeByLearner: false as const, antimicrobialSelectedByLearner: false as const,
  drugSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  accessPlacedByLearner: false as const, fluidSelectedByLearner: false as const,
  fluidVolumeSelectedByLearner: false as const, fluidRateSelectedByLearner: false as const,
  fluidDeliveredByLearner: false as const, vasoactiveSelectedByLearner: false as const,
  oxygenSelectedByLearner: false as const, deviceSelectedByLearner: false as const,
  oxygenFlowSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  treatmentEffectProven: false as const, durableRecoveryProven: false as const,
  dischargeReadinessProven: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  patternAtTick: null, shockBoundaryAtTick: null, careAtTick: null,
  sourceReviewAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedCareOwnershipConfirmed: over.careAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricSepsisAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternAtTick: 0 });
const BOUNDARY = base({ patternAtTick: 0, shockBoundaryAtTick: 1 });
const CARE = base({ patternAtTick: 0, shockBoundaryAtTick: 1, careAtTick: 2 });
const SOURCE = base({ patternAtTick: 0, shockBoundaryAtTick: 1, careAtTick: 2, sourceReviewAtTick: 3 });
const LATER = base({ patternAtTick: 0, shockBoundaryAtTick: 1, careAtTick: 2, sourceReviewAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ patternAtTick: 0, shockBoundaryAtTick: 1, careAtTick: 2, sourceReviewAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, PATTERN, BOUNDARY, CARE, SOURCE, LATER, DONE];

const LABELS = ['Review infection + organ dysfunction', 'Separate sepsis from shock',
  'Confirm qualified care ownership', 'Review source + organ support',
  'Review the 120-minute report', 'Hand off active sepsis risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricSepsisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricSepsisAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricSepsisResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricSepsisAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric sepsis experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-sepsis"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-sepsis' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricSepsisResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-sepsis-reassessment'),
    }).hasPediatricSepsisResponse).toBe(false);
  });

  it('shows one clear current action at every recorded step', () => {
    for (const state of STATES.slice(0, -1)) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(PATTERN)).toContain('Separate sepsis from shock');
    expect(markup(CARE)).toContain('Review source + organ support');
    expect(markup(LATER)).toContain('Hand off active sepsis risk');
    // And nothing is left to press once the handoff is recorded.
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a bolus, an antimicrobial, an access, or a discharge', () => {
    expect(markup(EMPTY)).toContain('Fever is context. Organ dysfunction changes the question.');
    expect(markup(BOUNDARY)).toContain('No shock now does not mean no urgency');
    expect(markup(DONE)).toContain('Active infection, organ, and shock-surveillance work handed off');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|ceftriaxone|vancomycin|bolus|norepinephrine|mg\/kg|dose|infusion|cannula|intubat|ventilat|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric sepsis tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricSepsisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricSepsisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('does not look like the emergency his blood results say he is');
    const boundary = markup(PATTERN, { pediatricSepsisGuidance: 'guided' });
    expect(boundary).toContain('Say what this is and what it is not, in both directions');
    expect(boundary).not.toContain('does not look like the emergency his blood results say he is');
  });

  it('argues the boundary in both directions on the same beat', () => {
    const html = markup(PATTERN, { pediatricSepsisGuidance: 'guided' });
    expect(html).toContain('buys nothing and costs something');
    expect(html).toContain('do not establish low risk');
  });

  it('separates improved physiology from unchanged organ dysfunction', () => {
    const html = markup(SOURCE, { pediatricSepsisGuidance: 'guided' });
    expect(html).toContain('read the fixed report against what has not moved');
    expect(html).toContain('The physiology got better and the organ dysfunction did not');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricSepsisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricSepsisGuidance: 'guided', pediatricSepsisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
