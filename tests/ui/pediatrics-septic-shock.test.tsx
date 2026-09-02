/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_SEPTIC_SHOCK as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-septic-shock';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  suspectedInfectionAuthored: true as const, organDysfunctionAuthored: true as const,
  impairedPerfusionAuthored: true as const, septicShockAuthored: true as const,
  phoenixScoreAuthored: 2 as const, phoenixCardiovascularSubscoreAuthored: 2 as const,
  congestionWarningsAuthored: true as const, qualifiedCareRecordAuthored: true as const,
  sourceConfirmed: false as const, pathogenIdentified: false as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  scoreCalculatedByLearner: false as const, testAcquiredByLearner: false as const,
  testInterpretedByLearner: false as const, cultureAcquiredByLearner: false as const,
  imagingAcquiredByLearner: false as const, imagingInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, antimicrobialSelectedByLearner: false as const,
  drugSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  accessPlacedByLearner: false as const, fluidSelectedByLearner: false as const,
  fluidVolumeSelectedByLearner: false as const, fluidRateSelectedByLearner: false as const,
  fluidDeliveredByLearner: false as const, vasoactiveSelectedByLearner: false as const,
  vasoactiveRateSelectedByLearner: false as const, infusionOperatedByLearner: false as const,
  oxygenSelectedByLearner: false as const, deviceSelectedByLearner: false as const,
  oxygenFlowSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
  ventilationDeliveredByLearner: false as const, procedurePerformedByLearner: false as const,
  sourceControlPerformedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, treatmentEffectProven: false as const,
  durableRecoveryProven: false as const, dischargeReadinessProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, rescueAtTick: null,
  sourceAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  qualifiedVasoactiveOwnershipActive: over.rescueAtTick != null,
  qualifiedSourceControlOwnershipActive: over.sourceAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  persistentShockAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricSepticShockAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const RESCUE_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2 });
const SOURCE_ONLY = base({ trajectoryAtTick: 0, recognitionAtTick: 1, sourceAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2, sourceAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2, sourceAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, rescueAtTick: 2, sourceAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, RESCUE_ONLY, SOURCE_ONLY, BOTH, LATER, DONE];

const LABELS = ['Review care + perfusion trajectory', 'Recognize persistent septic shock',
  'Activate qualified shock rescue', 'Escalate source-control review',
  'Review the 90-minute report', 'Hand off active shock risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricSepticShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricSepticShockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 112, respiratoryRateBpm: 40, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricSepticShockResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricSepticShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric septic-shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-septic-shock"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-septic-shock' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricSepticShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-septic-shock-reassessment'),
    }).hasPediatricSepticShockResponse).toBe(false);
  });

  it('offers both halves of the unordered pair at once, and one action elsewhere', () => {
    // The two buttons at the recognition step are the authored design, not an
    // oversight: neither half of the pair may wait for the other.
    expect(lessonButtons(markup(RECOGNIZED))).toHaveLength(2);
    expect(markup(RECOGNIZED)).toContain('Activate qualified shock rescue');
    expect(markup(RECOGNIZED)).toContain('Escalate source-control review');
    for (const state of [EMPTY, TRAJECTORY, RESCUE_ONLY, SOURCE_ONLY, BOTH, LATER]) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(RESCUE_ONLY)).toContain('Escalate source-control review');
    expect(markup(SOURCE_ONLY)).toContain('Activate qualified shock rescue');
    expect(markup(BOTH)).toContain('Review the 90-minute report');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a bolus, an agent, an access, or a discharge', () => {
    expect(markup(EMPTY)).toContain('More fluid is not automatic.');
    expect(markup(LATER)).toContain('Some signals improved. Shock remains active.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|epinephrine|norepinephrine|bolus|mL\/kg|mcg\/kg|dose|central line|laparotom|appendectom|discharge|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric septic-shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricSepticShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricSepticShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('she is going the wrong way');
    const recognition = markup(TRAJECTORY, { pediatricSepticShockGuidance: 'guided' });
    expect(recognition).toContain('the third is not automatic');
    expect(recognition).not.toContain('she is going the wrong way');
  });

  it('answers the three ways the unordered pair can be half done', () => {
    const neither = markup(RECOGNIZED, { pediatricSepticShockGuidance: 'guided' });
    expect(neither).toContain('neither can wait for the other');
    const rescueMissing = markup(SOURCE_ONLY, { pediatricSepticShockGuidance: 'guided' });
    expect(rescueMissing).toContain('Her pressure still has no owner');
    expect(rescueMissing).not.toContain('neither can wait for the other');
    const sourceMissing = markup(RESCUE_ONLY, { pediatricSepticShockGuidance: 'guided' });
    expect(sourceMissing).toContain('The source will not clarify itself');
    expect(sourceMissing).not.toContain('Her pressure still has no owner');
  });

  it('separates real movement from resolution', () => {
    const html = markup(BOTH, { pediatricSepticShockGuidance: 'guided' });
    expect(html).toContain('read what moved and what did not');
    expect(html).toContain('This is partial stabilization with active shock');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricSepticShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricSepticShockGuidance: 'guided', pediatricSepticShockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
