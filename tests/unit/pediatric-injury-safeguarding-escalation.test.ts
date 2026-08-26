import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_INJURY_SAFEGUARDING_ESCALATION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-injury-safeguarding-escalation';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';
import { PEDIATRIC_ANAPHYLAXIS } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION } from '../../src/modules/pediatrics/scenarios/pediatric-foreign-body-airway-obstruction';
import { TRAUMA_PRIMARY_SURVEY } from '../../src/modules/emergency-medicine/scenarios/trauma-primary-survey';
import { HEMORRHAGIC_SHOCK } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';

const ACTIONS = [
  'reconcile-pediatric-injury-development-history-and-whole-child',
  'recognize-pediatric-injury-safeguarding-concern-without-diagnosis',
  'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership',
  'review-pediatric-injury-medical-alternatives-and-information-boundary',
  'review-pediatric-injury-later-safety-state',
  'handoff-pediatric-injury-unresolved-safeguarding-risk',
] as const;

const responseType = 'pediatric-injury-safeguarding-escalation-response';
const make = (scenario = SCENARIO, seed = 1601) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });
const apply = (subject: AnesthesiaEngine, action: unknown,
  extras: Record<string, unknown> = {}) => subject.apply({ tick: subject.tick,
  type: responseType, payload: { action: action as never, ...extras } as never });

describe('pediatric injury safeguarding escalation engine contract', () => {
  it('uses exact identity, targets, objectives, and a stable no-recipe fixture', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 2, weightKg: 12, heightCm: 88 });
    expect(SCENARIO.timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'narrative',
        target: 'pediatric-injury-safeguarding-escalation-reassessment' }),
      expect.objectContaining({ type: 'narrative',
        target: 'pediatric-injury-safeguarding-escalation-reassessment-boundary' }),
    ]));
    expect(SCENARIO.timeline.some(({ type }) => type !== 'narrative')).toBe(false);
    expect(SCENARIO.timeline.map(({ message }) => message).join(' '))
      .not.toMatch(/\b(?:child protective services|CPS|police|mandated report|case number)\b/i);
  });

  it('holds stable fixed physiology while only qualified ownership and review state advance', () => {
    const subject = make();
    let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 108, respiratoryRateBpm: 22,
      systolicMmHg: 96, diastolicMmHg: 60, meanArterialMmHg: 72,
      spo2Percent: 99, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment)
      .toMatchObject({ initialPulsePresent: true, spontaneousBreathingAuthored: true,
        stablePhysiologyAuthored: true, independentlyMobileAuthored: true,
        concerningInjuryPatternAuthored: true,
        suppliedHistoryDevelopmentMismatchAuthored: true,
        safeguardingConcernAuthored: false, qualifiedSafeguardingOwnershipActive: false,
        qualifiedImmediateSafetyOwnershipActive: false,
        medicalAlternativesRemainOpen: true,
        laterChildRemainsInQualifiedCareAuthored: false });

    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    subject.step(); apply(subject, ACTIONS[4]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 104, respiratoryRateBpm: 22,
      systolicMmHg: 98, diastolicMmHg: 62, meanArterialMmHg: 74,
      spo2Percent: 99, coreTemperatureC: 36.8 });
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null,
      pediatricInjurySafeguardingAssessment: {
        safeguardingConcernAuthored: true, qualifiedSafeguardingOwnershipActive: true,
        qualifiedImmediateSafetyOwnershipActive: true,
        laterChildRemainsInQualifiedCareAuthored: true,
        patientExaminedByLearner: false, historyTakenByLearner: false,
        caregiverInterviewedByLearner: false, disclosureSolicitedByLearner: false,
        identifyingInformationCollected: false, freeTextDisclosureCollected: false,
        photographCapturedByLearner: false, bodyMapCreatedByLearner: false,
        testAcquiredByLearner: false, imagingAcquiredByLearner: false,
        diagnosisMadeByLearner: false, abuseDiagnosedByLearner: false,
        reportingThresholdDeterminedByLearner: false,
        jurisdictionSelectedByLearner: false, agencyContactedByLearner: false,
        reportSubmittedByLearner: false, childRemovedByLearner: false,
        monitoringAcquiredByLearner: false, drugSelectedByLearner: false,
        doseSelectedByLearner: false, routeSelectedByLearner: false,
        accessPlacedByLearner: false, fluidSelectedByLearner: false,
        oxygenSelectedByLearner: false, deviceSelectedByLearner: false,
        treatmentDeliveredByLearner: false, procedurePerformedByLearner: false,
        abuseFinallyProven: false, perpetratorIdentified: false,
        caregiverCredibilityDetermined: false, medicalMimicExcluded: false,
        occultInjuryExcluded: false, immediateSafetyProven: false,
        futureHarmExcluded: false, referralCompletionProven: false,
        legalReportingCompleted: false, custodyDetermined: false,
        durableSafetyProven: false, dischargeReadinessProven: false,
        dispositionDetermined: false, prognosisPredicted: false, outcomePredicted: false,
      } });
  });

  it('enforces full serial prerequisites without assessment or physiology mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, attempted] of cases) {
      const subject = make(SCENARIO, 1602); const control = make(SCENARIO, 1602);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, attempted);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    }
  });

  it('requires separate elapsed ticks for later review and handoff without mutation', () => {
    const subject = make(SCENARIO, 1603); const control = make(SCENARIO, 1603);
    subject.step(); control.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(control, action); }
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricInjurySafeguardingAssessment)
      .toMatchObject({ trajectoryAtTick: 1, concernAtTick: 1, safeguardingAtTick: 1,
        alternativesAtTick: 1, laterSafetyAtTick: 2, handoffAtTick: 3 });
  });

  it('drops hostile PII, disclosures, accusations, agencies, and jurisdiction fields without echo', () => {
    const subject = make(SCENARIO, 1604); subject.step();
    const secrets = ['Ava Example', 'Caregiver Example', '312-555-0199', '101 Example Street',
      'verbatim sensitive disclosure', 'case-12345', 'Example Police', 'Illinois'];
    apply(subject, ACTIONS[0], { childName: secrets[0], caregiverName: secrets[1],
      phone: secrets[2], address: secrets[3], verbatimDisclosure: secrets[4],
      caseNumber: secrets[5], agency: secrets[6], jurisdiction: secrets[7],
      diagnosis: 'physical abuse', accusation: 'caregiver is lying', race: 'injected',
      insurance: 'injected' });
    for (const action of ACTIONS.slice(1, 4)) apply(subject, action);
    const frame = subject.step();
    const serialized = JSON.stringify({ events: frame.events,
      assessment: frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment });
    for (const secret of secrets) expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain('caregiver is lying');
    expect(frame.equipment.resuscitation.pediatricInjurySafeguardingAssessment)
      .toMatchObject({ identifyingInformationCollected: false,
        freeTextDisclosureCollected: false, caregiverCredibilityDetermined: false,
        abuseFinallyProven: false, agencyContactedByLearner: false,
        jurisdictionSelectedByLearner: false });
  });

  it('calmly refuses malformed, null-prototype, duplicate, and hostile shortcut actions', () => {
    const subject = make(SCENARIO, 1605); const control = make(SCENARIO, 1605);
    subject.step(); control.step();
    const nullPrototype = Object.create(null) as Record<string, unknown>;
    for (const malformed of [undefined, null, [],
      { type: responseType, payload: null }, { type: responseType, payload: [] },
      { type: responseType, payload: Object.create(null) }]) subject.apply(malformed as never);
    for (const malformed of [undefined, null, [], {}, nullPrototype, '__proto__', 'constructor',
      'diagnose-abuse', 'name-perpetrator', 'confront-caregiver', 'separate-caregiver',
      'call-police', 'file-CPS-report', 'remove-child', 'select-jurisdiction']) apply(subject, malformed);
    for (const [type, payload] of [
      ['trauma-primary-survey-response', { action: 'activate-trauma-primary-survey' }],
      ['hemorrhagic-shock-assessment', { action: 'recognize' }],
      ['pediatric-anaphylaxis-response', { action: 'recognize' }],
      ['bolus', { drugId: 'epinephrine', amount: 1, unit: 'mg' }],
      ['fluid', { fluidId: 'balanced-crystalloid', volumeMl: 240 }],
      ['airway-device', { deviceId: 'ett' }], ['laryngoscopy', {}],
      ['chest-compressions', { active: true }], ['defibrillation', { energyJ: 200 }],
      ['rhythm-change', { target: 'pea' }],
    ] as const) subject.apply({ tick: -999, type, payload: payload as never });
    const refused = subject.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);

    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[0]);
    expect(subject.step().equipment.resuscitation.pediatricInjurySafeguardingAssessment)
      .toMatchObject({ trajectoryAtTick: 2, concernAtTick: null });
  });

  it('preserves accepted duplicate ticks and replays the stable trajectory deterministically', () => {
    const subject = make(SCENARIO, 1606); subject.step();
    for (const action of ACTIONS.slice(0, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricInjurySafeguardingAssessment)
      .toMatchObject({ trajectoryAtTick: 1, concernAtTick: 1, safeguardingAtTick: 1,
        alternativesAtTick: 1, laterSafetyAtTick: 2, handoffAtTick: 3 });

    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 4 ? 0 : index - 3, type: responseType, payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1606, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 104, respiratoryRateBpm: 22,
      systolicMmHg: 98, meanArterialMmHg: 74, spo2Percent: 99, coreTemperatureC: 36.8 });
  });

  it('emits only the six exact structured evidence prefixes for accepted actions', () => {
    const subject = make(SCENARIO, 1608); const events = [...subject.step().events];
    for (const action of ACTIONS.slice(0, 4)) apply(subject, action);
    let frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    expect(events.map(({ eventId }) => eventId)).toEqual(expect.arrayContaining([
      expect.stringMatching(/^pediatric-safeguarding-trajectory-reconciled-\d+$/),
      expect.stringMatching(/^pediatric-safeguarding-concern-recognized-\d+$/),
      expect.stringMatching(/^pediatric-safeguarding-qualified-ownership-activated-\d+$/),
      expect.stringMatching(/^pediatric-safeguarding-alternatives-and-information-boundary-reviewed-\d+$/),
      expect.stringMatching(/^pediatric-safeguarding-later-safety-reviewed-\d+$/),
      expect.stringMatching(/^pediatric-safeguarding-unresolved-risk-handoff-recorded-\d+$/),
    ]));
  });

  it('requires exact metadata and both targets and does not leak across injury-adjacent scenarios', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'pediatric-safeguarding' } },
      ...['pediatric-injury-safeguarding-escalation-reassessment',
        'pediatric-injury-safeguarding-escalation-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA, PEDIATRIC_ANAPHYLAXIS,
      PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION, TRAUMA_PRIMARY_SURVEY, HEMORRHAGIC_SHOCK,
    ];
    for (const scenario of wrong) {
      const subject = make(scenario, 1607); const control = make(scenario, 1607);
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation.pediatricInjurySafeguardingAssessment).toBeUndefined();
    }
  });
});
