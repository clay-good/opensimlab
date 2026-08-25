import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { STEMI } from '../../src/modules/emergency-medicine/scenarios/stemi';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS as SCENARIO } from '../../src/modules/cardiology/scenarios/stemi-recognition-and-first-actions';

const CLINIC_ACTIONS = ['reconcile-clinic-stemi-pattern', 'screen-clinic-stemi-danger',
  'activate-clinic-stemi-transfer', 'record-clinic-stemi-bridge',
  'reassess-clinic-stemi-handoff'];
const ED_ACTIONS = ['review-stemi-pattern', 'activate-stemi-pathway', 'record-aspirin-load',
  'record-p2y12-anticoagulation-intent', 'reassess-and-handoff'];
const apply = (subject: AnesthesiaEngine, action: string) => subject.apply({ tick: subject.tick,
  type: 'clinic-stemi-response', payload: { action } });

describe('cardiology STEMI recognition and first actions', () => {
  it('validates a distinct non-PCI clinic and keeps unrelated state absent', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .not.toEqual(STEMI.metadata.objectives.map(({ id }) => id));
    expect(SCENARIO.metadata.objectives.map(({ statement }) => statement))
      .not.toEqual(STEMI.metadata.objectives.map(({ statement }) => statement));
    expect(SCENARIO.debrief.rubric.map(({ question }) => question))
      .not.toEqual(STEMI.debrief.rubric.map(({ question }) => question));
    expect(SCENARIO.timeline.map(({ target }) => target))
      .not.toEqual(STEMI.timeline.map(({ target }) => target));
    expect(SCENARIO.patient.procedure).toContain('non-PCI cardiology clinic');
    expect(STEMI.patient.procedure).toContain('reperfusion preparation');
    expect(CLINIC_ACTIONS).not.toEqual(ED_ACTIONS);
    expect(CARDIOLOGY_SCENARIOS.map(({ metadata }) => metadata.id).slice(0, 3)).toEqual([
      'stable-chest-pain-evaluation', 'stemi-recognition-and-first-actions',
      'nstemi-risk-reassessment',
    ]);
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 171, practiceRegion: 'US' }).step();
    const emergency = new AnesthesiaEngine({ scenario: STEMI,
      seed: 172, practiceRegion: 'US' });
    emergency.step(); apply(emergency, 'reconcile-clinic-stemi-pattern');
    const emergencyResult = emergency.step();
    expect(emergencyResult.equipment.resuscitation.clinicStemiAssessment).toBeUndefined();
    expect(emergencyResult.events.some(({ eventId }) =>
      eventId.startsWith('clinic-stemi-response-refused-'))).toBe(true);
    expect(ordinary.equipment.resuscitation.clinicStemiAssessment).toBeUndefined();

    const clinic = new AnesthesiaEngine({ scenario: SCENARIO,
      seed: 175, practiceRegion: 'US' });
    clinic.step();
    clinic.apply({ tick: clinic.tick, type: 'stemi-response',
      payload: { action: 'review-stemi-pattern' } });
    const clinicResult = clinic.step();
    expect(clinicResult.equipment.resuscitation.stemiAssessment).toMatchObject({
      patternReviewedAtTick: null, pathwayActivatedAtTick: null, aspirinAtTick: null,
      additionalAntithromboticsAtTick: null, reassessedAtTick: null });
    expect(clinicResult.events.some(({ eventId }) => eventId.startsWith('stemi-refused-')))
      .toBe(true);
  });

  it('unlocks EMS and danger review in parallel, then completes the bridge and handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 173, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 62, meanArterialMmHg: 93,
      respiratoryRateBpm: 16, spo2Percent: 96, coreTemperatureC: 36.7 });
    apply(subject, 'reconcile-clinic-stemi-pattern');
    apply(subject, 'activate-clinic-stemi-transfer');
    apply(subject, 'screen-clinic-stemi-danger');
    apply(subject, 'record-clinic-stemi-bridge');
    apply(subject, 'reassess-clinic-stemi-handoff');
    const bridged = subject.step();
    expect(bridged.equipment.resuscitation.clinicStemiAssessment?.handoffAtTick).toBeNull();
    expect(bridged.events.some(({ eventId }) =>
      eventId.startsWith('clinic-stemi-handoff-order-refused-'))).toBe(true);
    apply(subject, 'reassess-clinic-stemi-handoff');
    const completed = subject.step();
    expect(completed.equipment.resuscitation.clinicStemiAssessment).toMatchObject({
      patternAtTick: expect.any(Number), dangerAtTick: expect.any(Number),
      transferAtTick: expect.any(Number), bridgeAtTick: expect.any(Number),
      handoffAtTick: expect.any(Number), pciCapableSetting: false,
      biomarkerDelayUsed: false, downstreamTherapySelected: false,
      treatmentDelivered: false });
    const transfer = bridged.events.find((event) =>
      event.eventId.startsWith('clinic-stemi-transfer-activated-'));
    expect(transfer?.data).toMatchObject({ emsActivated: true, biomarkerDelayUsed: false,
      selfTransportSelected: false, downstreamTherapySelected: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [
      ...onset.events, ...bridged.events, ...completed.events,
    ])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('also permits danger review before EMS and refuses premature, duplicate, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 174, practiceRegion: 'US' });
    subject.step();
    apply(subject, 'record-clinic-stemi-bridge');
    apply(subject, 'reconcile-clinic-stemi-pattern');
    apply(subject, 'screen-clinic-stemi-danger');
    apply(subject, 'activate-clinic-stemi-transfer');
    apply(subject, 'activate-clinic-stemi-transfer');
    apply(subject, 'order-fibrinolysis');
    const result = subject.step();
    expect(result.equipment.resuscitation.clinicStemiAssessment).toMatchObject({
      patternAtTick: expect.any(Number), dangerAtTick: expect.any(Number),
      transferAtTick: expect.any(Number), bridgeAtTick: null, handoffAtTick: null });
    expect(result.events.some(({ eventId }) => eventId.startsWith('clinic-stemi-order-refused-'))).toBe(true);
    expect(result.events.some(({ eventId }) => eventId.startsWith('clinic-stemi-transfer-refused-'))).toBe(true);
    expect(result.events.some(({ eventId }) => eventId.startsWith('clinic-stemi-response-refused-'))).toBe(true);
  });
});
