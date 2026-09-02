/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-foreign-body-airway-obstruction';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  witnessedAbruptChokingAuthored: true as const,
  initialEffectiveCoughAuthored: true as const, initialPulsePresent: true as const,
  patientExaminedByLearner: false as const, responsivenessAssessedByLearner: false as const,
  pulseAssessedByLearner: false as const, airwayAssessedByLearner: false as const,
  coughAssessedByLearner: false as const, coughEncouragedByLearner: false as const,
  monitoringAcquiredByLearner: false as const, testAcquiredByLearner: false as const,
  testInterpretedByLearner: false as const, diagnosisMadeByLearner: false as const,
  objectVisualizedByLearner: false as const, objectRemovedByLearner: false as const,
  maneuverPerformedByLearner: false as const, backBlowsPerformedByLearner: false as const,
  abdominalThrustsPerformedByLearner: false as const,
  chestThrustsPerformedByLearner: false as const,
  blindFingerSweepPerformedByLearner: false as const, cprDeliveredByLearner: false as const,
  chestCompressionsDeliveredByLearner: false as const,
  oxygenDeliveredByLearner: false as const, ventilationDeliveredByLearner: false as const,
  accessPlacedByLearner: false as const, drugSelectedByLearner: false as const,
  deviceSelectedByLearner: false as const, suctionPerformedByLearner: false as const,
  laryngoscopyPerformedByLearner: false as const, forcepsUsedByLearner: false as const,
  airwayManeuverPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const, treatmentDeliveredByLearner: false as const,
  objectClearanceReported: false as const, completeClearanceProven: false as const,
  aspirationExcluded: false as const, airwayInjuryExcluded: false as const,
  treatmentEffectProven: false as const, cardiacArrestDeclared: false as const,
  pulseLossProven: false as const, roscReported: false as const,
  durableRecoveryProven: false as const,
};
const base = (over: Record<string, unknown>) => ({
  reconciledAtTick: null, effectiveCoughAtTick: null, severeResponsiveAtTick: null,
  responsivePathwayAtTick: null, unresponsivePathwayAtTick: null, handoffAtTick: null,
  continuousSurveillanceAuthored: over.effectiveCoughAtTick != null,
  severeResponsiveTransitionAuthored: over.severeResponsiveAtTick != null,
  severeResponsivePulsePresent: over.severeResponsiveAtTick != null,
  qualifiedResponsivePathwayActive: over.responsivePathwayAtTick != null,
  unresponsiveNoNormalBreathingAuthored: over.unresponsivePathwayAtTick != null,
  unresponsivePulseStatusUnavailable: over.unresponsivePathwayAtTick != null,
  qualifiedUnresponsiveCprPathwayActive: over.unresponsivePathwayAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricForeignBodyAirwayObstructionAssessment']>);

const EMPTY = base({});
const RECONCILED = base({ reconciledAtTick: 0 });
const COUGH = base({ reconciledAtTick: 0, effectiveCoughAtTick: 1 });
const SEVERE = base({ reconciledAtTick: 0, effectiveCoughAtTick: 1, severeResponsiveAtTick: 2 });
const RESPONSIVE = base({ reconciledAtTick: 0, effectiveCoughAtTick: 1, severeResponsiveAtTick: 2, responsivePathwayAtTick: 3 });
const UNRESPONSIVE = base({ reconciledAtTick: 0, effectiveCoughAtTick: 1, severeResponsiveAtTick: 2, responsivePathwayAtTick: 3, unresponsivePathwayAtTick: 4 });
const DONE = base({ reconciledAtTick: 0, effectiveCoughAtTick: 1, severeResponsiveAtTick: 2, responsivePathwayAtTick: 3, unresponsivePathwayAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECONCILED, COUGH, SEVERE, RESPONSIVE, UNRESPONSIVE, DONE];

const LABELS = ['Review choking + whole-child signs', 'Preserve effective cough + watch closely',
  'Recognize severe responsive obstruction', 'Activate qualified choking rescue',
  'Review transition + activate unresponsive care', 'Hand off active obstruction risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricForeignBodyAirwayObstructionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricForeignBodyAirwayObstructionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 140, respiratoryRateBpm: 24, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricForeignBodyAirwayObstructionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricForeignBodyAirwayObstructionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric foreign-body airway experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-foreign-body-airway-obstruction"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-foreign-body-airway-obstruction' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricForeignBodyAirwayObstructionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-foreign-body-airway-obstruction-reassessment'),
    }).hasPediatricForeignBodyAirwayObstructionResponse).toBe(false);
  });

  it('shows one clear current action at every rung of the ladder', () => {
    for (const state of STATES.slice(0, -1)) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(RECONCILED)).toContain('Preserve effective cough + watch closely');
    expect(markup(COUGH)).toContain('Recognize severe responsive obstruction');
    expect(markup(SEVERE)).toContain('Activate qualified choking rescue');
    expect(markup(RESPONSIVE)).toContain('Review transition + activate unresponsive care');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a thrust, a sweep, a removal, or a compression', () => {
    expect(markup(EMPTY)).toContain('Let the child’s sound guide urgency.');
    expect(markup(UNRESPONSIVE)).toContain('Responsiveness changes the pathway.');
    expect(markup(UNRESPONSIVE)).toContain('no blind sweep is exposed');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|back blow|thrust|sweep|suction|forceps|laryngoscop|compress|remove the|diagnose|prognos/iu);
    }
  });
});

describe('Pediatric foreign-body airway tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricFbaoGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricFbaoGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Listen before you touch him');
    const cough = markup(RECONCILED, { pediatricFbaoGuidance: 'guided' });
    expect(cough).toContain('Do not interrupt it');
    expect(cough).not.toContain('Listen before you touch him');
  });

  it('argues the restraint and forbids the sweep by name', () => {
    const html = markup(RECONCILED, { pediatricFbaoGuidance: 'guided' });
    expect(html).toContain('the hardest instruction in the lesson');
    expect(html).toContain('no blind finger sweep');
  });

  it('reads silence as the transition rather than as improvement', () => {
    const html = markup(COUGH, { pediatricFbaoGuidance: 'guided' });
    expect(html).toContain('Silence in a choking child is not improvement');
  });

  it('refuses to read an ECG trace as a pulse or an arrest', () => {
    const html = markup(RESPONSIVE, { pediatricFbaoGuidance: 'guided' });
    expect(html).toContain('That trace is not a pulse');
    expect(html).toContain('does not make this a declared cardiac arrest');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricFbaoGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricFbaoGuidance: 'guided', pediatricFbaoDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
