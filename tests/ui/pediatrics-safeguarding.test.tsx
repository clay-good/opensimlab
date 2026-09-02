/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-injury-safeguarding-escalation';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  stablePhysiologyAuthored: true as const, independentlyMobileAuthored: true as const,
  concerningInjuryPatternAuthored: true as const,
  suppliedHistoryDevelopmentMismatchAuthored: true as const,
  medicalAlternativesRemainOpen: true as const,
  patientExaminedByLearner: false as const, developmentAssessedByLearner: false as const,
  historyTakenByLearner: false as const, caregiverInterviewedByLearner: false as const,
  disclosureSolicitedByLearner: false as const, identifyingInformationCollected: false as const,
  freeTextDisclosureCollected: false as const, bruiseIdentifiedByLearner: false as const,
  bruiseDatedByLearner: false as const, photographCapturedByLearner: false as const,
  bodyMapCreatedByLearner: false as const, screeningRuleCalculatedByLearner: false as const,
  testAcquiredByLearner: false as const, testInterpretedByLearner: false as const,
  imagingAcquiredByLearner: false as const, imagingInterpretedByLearner: false as const,
  diagnosisMadeByLearner: false as const, abuseDiagnosedByLearner: false as const,
  perpetratorNamedByLearner: false as const,
  caregiverCredibilityJudgedByLearner: false as const,
  caregiverConfrontedByLearner: false as const, caregiverSeparatedByLearner: false as const,
  reportingThresholdDeterminedByLearner: false as const,
  jurisdictionSelectedByLearner: false as const, agencySelectedByLearner: false as const,
  agencyContactedByLearner: false as const, referralSubmittedByLearner: false as const,
  reportSubmittedByLearner: false as const, custodyActionSelectedByLearner: false as const,
  childRemovedByLearner: false as const, safetyPlanDeterminedByLearner: false as const,
  monitoringAcquiredByLearner: false as const, drugSelectedByLearner: false as const,
  doseSelectedByLearner: false as const, routeSelectedByLearner: false as const,
  accessPlacedByLearner: false as const, fluidSelectedByLearner: false as const,
  oxygenSelectedByLearner: false as const, deviceSelectedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, procedurePerformedByLearner: false as const,
  abuseFinallyProven: false as const, perpetratorIdentified: false as const,
  caregiverCredibilityDetermined: false as const, medicalMimicExcluded: false as const,
  occultInjuryExcluded: false as const, immediateSafetyProven: false as const,
  futureHarmExcluded: false as const, referralCompletionProven: false as const,
  legalReportingCompleted: false as const, custodyDetermined: false as const,
  durableSafetyProven: false as const, dischargeReadinessProven: false as const,
  dispositionDetermined: false as const, prognosisPredicted: false as const,
  outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, concernAtTick: null, safeguardingAtTick: null,
  alternativesAtTick: null, laterSafetyAtTick: null, handoffAtTick: null,
  safeguardingConcernAuthored: over.concernAtTick != null,
  qualifiedSafeguardingOwnershipActive: over.safeguardingAtTick != null,
  qualifiedImmediateSafetyOwnershipActive: over.safeguardingAtTick != null,
  laterChildRemainsInQualifiedCareAuthored: over.laterSafetyAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pediatricInjurySafeguardingAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const CONCERN = base({ trajectoryAtTick: 0, concernAtTick: 1 });
const OWNED = base({ trajectoryAtTick: 0, concernAtTick: 1, safeguardingAtTick: 2 });
const ALTERNATIVES = base({ trajectoryAtTick: 0, concernAtTick: 1, safeguardingAtTick: 2, alternativesAtTick: 3 });
const LATER = base({ trajectoryAtTick: 0, concernAtTick: 1, safeguardingAtTick: 2, alternativesAtTick: 3, laterSafetyAtTick: 4 });
const DONE = base({ trajectoryAtTick: 0, concernAtTick: 1, safeguardingAtTick: 2, alternativesAtTick: 3, laterSafetyAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, TRAJECTORY, CONCERN, OWNED, ALTERNATIVES, LATER, DONE];

const LABELS = ['Review child + supplied record', 'Recognize concern without diagnosing',
  'Activate qualified safeguarding care', 'Review alternatives + privacy',
  'Review the team safety checkpoint', 'Hand off concern + open questions'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricInjurySafeguardingAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pediatricInjurySafeguardingAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 84, respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPediatricInjurySafeguardingResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pediatricInjurySafeguardingAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pediatric safeguarding-escalation experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics' }));
    expect(index).toContain('href="/pediatrics/scenario/pediatric-injury-safeguarding-escalation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/pediatrics/scenario/pediatric-injury-safeguarding-escalation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPediatricInjurySafeguardingResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pediatric-injury-safeguarding-escalation-reassessment'),
    }).hasPediatricInjurySafeguardingResponse).toBe(false);
  });

  it('shows one clear current action at every recorded step', () => {
    for (const state of STATES.slice(0, -1)) {
      expect(lessonButtons(markup(state))).toHaveLength(1);
    }
    expect(markup(TRAJECTORY)).toContain('Recognize concern without diagnosing');
    expect(markup(CONCERN)).toContain('Activate qualified safeguarding care');
    expect(markup(OWNED)).toContain('Review alternatives + privacy');
    expect(lessonButtons(markup(DONE))).toHaveLength(0);
  });

  it('never offers a diagnosis, an accusation, a referral, or a placement', () => {
    expect(markup(EMPTY)).toContain('Hold concern without closing the story.');
    expect(markup(LATER)).toContain('Safety is shared work.');
    expect(markup(LATER)).toContain('need-to-know rather than absolutely confidential');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|interview|photograph|body map|diagnose abuse|perpetrat|confront|separat|report to|refer to|custody|remove|discharge|prognos/iu);
    }
  });
});

describe('Pediatric safeguarding tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pediatricInjurySafeguardingGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pediatricInjurySafeguardingGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('keep it separate from what it might mean');
    const concern = markup(TRAJECTORY, { pediatricInjurySafeguardingGuidance: 'guided' });
    expect(concern).toContain('narrower than the one you are tempted to say');
    expect(concern).not.toContain('keep it separate from what it might mean');
  });

  it('refuses both widening and narrowing the concern', () => {
    const html = markup(TRAJECTORY, { pediatricInjurySafeguardingGuidance: 'guided' });
    expect(html).toContain('Widening it invents a finding nobody has made');
    expect(html).toContain('is how these are missed');
  });

  it('names the process steps that are not the learner’s', () => {
    const html = markup(CONCERN, { pediatricInjurySafeguardingGuidance: 'guided' });
    expect(html).toContain('no confronting the caregiver');
    expect(html).toContain('this lab teaches none of them as the answer');
  });

  it('keeps the medical alternatives open and the information narrow', () => {
    const html = markup(OWNED, { pediatricInjurySafeguardingGuidance: 'guided' });
    expect(html).toContain('a child with a coagulopathy nobody has tested for looks exactly like this');
    expect(html).toContain('You solicit no disclosure and collect no free text');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pediatricInjurySafeguardingGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pediatricInjurySafeguardingGuidance: 'guided', pediatricInjurySafeguardingDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
