/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_BRADYCARDIC_ARREST as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-bradycardic-arrest';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  effectiveAssistedVentilationAuthored: true as const,
  persistentBradycardiaWithCompromiseAuthored: true as const,
  patientExaminedByLearner: false as const, pulseAssessedByLearner: false as const,
  monitoringAcquiredByLearner: false as const, ecgAcquiredByLearner: false as const,
  ecgInterpretedByLearner: false as const, testAcquiredByLearner: false as const,
  testInterpretedByLearner: false as const, diagnosisMadeByLearner: false as const,
  causeAssignedByLearner: false as const, cprDeliveredByLearner: false as const,
  chestCompressionsDeliveredByLearner: false as const,
  oxygenDeliveredByLearner: false as const, ventilationDeliveredByLearner: false as const,
  accessPlacedByLearner: false as const, drugSelectedByLearner: false as const,
  epinephrineSelectedByLearner: false as const, productSelectedByLearner: false as const,
  concentrationSelectedByLearner: false as const, doseSelectedByLearner: false as const,
  routeSelectedByLearner: false as const, intervalSelectedByLearner: false as const,
  volumeSelectedByLearner: false as const, rateSelectedByLearner: false as const,
  fluidDeliveredByLearner: false as const, pacingSelectedByLearner: false as const,
  deviceSelectedByLearner: false as const, currentSelectedByLearner: false as const,
  energySelectedByLearner: false as const, shockDeliveredByLearner: false as const,
  defibrillationPerformedByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  causeProven: false as const, conductionMechanismProven: false as const,
  treatmentEffectProven: false as const, roscReported: false as const,
  durableRoscProven: false as const, durableRecoveryProven: false as const,
  neurologicRecoveryProven: false as const, recurrenceExcluded: false as const,
  deathDeclared: false as const, resuscitationTerminated: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, recognitionAtTick: null, resuscitationAtTick: null,
  safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
  laterPulseLossAuthored: over.laterResponseAtTick != null,
  laterPeaAuthored: over.laterResponseAtTick != null,
  qualifiedResuscitationOwnershipActive: over.resuscitationAtTick != null,
  qualifiedSafetyReviewActive: over.safetyAtTick != null,
  laterReportAuthored: over.laterResponseAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricBradycardicArrestAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const RECOGNIZED = base({ trajectoryAtTick: 0, recognitionAtTick: 1 });
const OWNED = base({ trajectoryAtTick: 0, recognitionAtTick: 1, resuscitationAtTick: 2 });
const REVIEWED = base({ trajectoryAtTick: 0, recognitionAtTick: 1, resuscitationAtTick: 2, safetyAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, recognitionAtTick: 1, resuscitationAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, recognitionAtTick: 1, resuscitationAtTick: 2, safetyAtTick: 3, laterResponseAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, RECOGNIZED, OWNED, REVIEWED, LATER, DONE];

const LABELS = ['Review breathing + rhythm + whole child', 'Recognize persistent bradycardic compromise',
  'Activate qualified pediatric resuscitation', 'Review pulse + breathing + causes',
  'Review the 2-minute pulse-loss report', 'Hand off active arrest risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricBradycardicArrestAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricBradycardicArrestAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 20, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 6 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricBradycardicArrestResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricBradycardicArrestAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric bradycardic-arrest experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-bradycardic-arrest"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-bradycardic-arrest' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricBradycardicArrestResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-bradycardic-arrest-reassessment'),
    }).hasPediatricBradycardicArrestResponse).toBe(false);
  });

  it('shows one clear current action at every recorded step', () => {
    for (const state of STATES.slice(0, -1)) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(RECOGNIZED)).toContain('Activate qualified pediatric resuscitation');
    expect(markup(OWNED)).toContain('Review pulse + breathing + causes');
    expect(markup(REVIEWED)).toContain('Review the 2-minute pulse-loss report');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a compression, a drug, a shock, or a termination', () => {
    expect(markup(EMPTY)).toContain('Read the pulse behind the rate.');
    expect(markup(REVIEWED)).toContain('A rhythm is not circulation.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|compress|CPR|epinephrine|atropine|pacing|defibrillat|shock|joule|mg\/kg|dose|terminat|stop resus|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric bradycardic-arrest tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricBradycardicArrestGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricBradycardicArrestGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the heart did not follow');
    const recognition = markup(TRAJECTORY, { pediatricBradycardicArrestGuidance: 'guided' });
    expect(recognition).toContain('despite effective ventilation');
    expect(recognition).not.toContain('the heart did not follow');
  });

  it('says a remaining pulse is not a reason to wait', () => {
    const html = markup(TRAJECTORY, { pediatricBradycardicArrestGuidance: 'guided' });
    expect(html).toContain('that is not a reason to wait');
  });

  it('leads the ownership beat with the sentence the lesson exists for', () => {
    const html = markup(RECOGNIZED, { pediatricBradycardicArrestGuidance: 'guided' });
    expect(html).toContain('Do not wait for the pulse to go');
    expect(html).toContain('running a resuscitation rather than watching a rate');
  });

  it('refuses to read a rhythm as circulation or a complex as shockable', () => {
    const html = markup(REVIEWED, { pediatricBradycardicArrestGuidance: 'guided' });
    expect(html).toContain('A rhythm on a monitor is not circulation');
    expect(html).toContain('does not change to defibrillation because a complex is visible');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricBradycardicArrestGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricBradycardicArrestGuidance: 'guided', pediatricBradycardicArrestDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
