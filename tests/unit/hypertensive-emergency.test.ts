import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';
import { HYPERTENSIVE_EMERGENCY as SCENARIO } from '../../src/modules/cardiology/scenarios/hypertensive-emergency';
import { ACUTE_PULMONARY_EDEMA } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';
import { ACUTE_AORTIC_SYNDROME } from '../../src/modules/emergency-medicine/scenarios/acute-aortic-syndrome';
import { ACUTE_ISCHEMIC_STROKE } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION } from '../../src/modules/emergency-medicine/scenarios/intracranial-hemorrhage-deterioration';

const ACTIONS = {
  measurement: 'reconcile-hypertensive-emergency-measurement-and-trajectory',
  organ: 'review-hypertensive-emergency-organ-injury',
  phenotype: 'review-hypertensive-emergency-phenotype-and-causes',
  reduction: 'record-hypertensive-emergency-controlled-reduction-intent',
  later: 'review-hypertensive-emergency-later-panel',
  handoff: 'handoff-hypertensive-emergency-reassessment',
} as const;
function apply(subject: AnesthesiaEngine, action: string,
  type = 'hypertensive-emergency-response') {
  subject.apply({ tick: subject.tick, type, payload: { action } });
}

describe('cardiology hypertensive emergency', () => {
  it('is a valid renal-retinal contract distinct from adjacent organ-specific emergencies', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.timeline.filter(({ target }) =>
      target === 'hypertensive-emergency-reassessment')).toHaveLength(3);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    for (const fact of ['238/134', '236/132', '232/130', 'flame hemorrhages',
      'cotton-wool spots', 'optic-disc edema', '2.1 mg/dL', '0.9 mg/dL',
      '212/122', '188/106', '38 mL/h']) expect(narrative).toContain(fact);
    expect(narrative).toContain('Marked pressure alone does not establish hypertensive emergency');
    expect(narrative).toMatch(/No drug, dose, infusion rate, fixed percentage, universal target, or rapid normalization/);
    for (const adjacent of [ACUTE_PULMONARY_EDEMA, ACUTE_AORTIC_SYNDROME,
      ACUTE_ISCHEMIC_STROKE, INTRACRANIAL_HEMORRHAGE_DETERIORATION]) {
      expect(SCENARIO.metadata.objectives.map(({ id }) => id))
        .not.toEqual(adjacent.metadata.objectives.map(({ id }) => id));
      expect(SCENARIO.timeline.map(({ target }) => target))
        .not.toEqual(adjacent.timeline.map(({ target }) => target));
    }
  });

  it.each([[ACTIONS.phenotype, ACTIONS.reduction], [ACTIONS.reduction, ACTIONS.phenotype]])(
    'accepts either parallel lane order and enforces two separate elapsed gates',
    (firstLane, secondLane) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 181,
        practiceRegion: 'US' });
      const onset = subject.step();
      expect(onset.state).toMatchObject({ heartRateBpm: 86, systolicMmHg: 236,
        diastolicMmHg: 132, meanArterialMmHg: 167, respiratoryRateBpm: 16,
        spo2Percent: 98, coreTemperatureC: 36.8 });
      apply(subject, ACTIONS.measurement); apply(subject, ACTIONS.organ);
      apply(subject, firstLane); apply(subject, secondLane); apply(subject, ACTIONS.later);
      const prematurePanel = subject.step();
      expect(prematurePanel.equipment.resuscitation.hypertensiveEmergencyAssessment)
        .toMatchObject({ measurementAtTick: expect.any(Number), organInjuryAtTick: expect.any(Number),
          phenotypeAtTick: expect.any(Number), reductionIntentAtTick: expect.any(Number),
          laterPanelAtTick: null, handoffAtTick: null, initialPulsePresent: true,
          acuteTargetOrganDamage: true, treatmentDeliveredByLearner: false,
          drugSelected: false, doseSelected: false, infusionRateSelected: false,
          universalTargetSelected: false, rapidNormalizationSelected: false,
          testAcquiredByLearner: false, procedurePerformed: false,
          dispositionDetermined: false, outcomePredicted: false });
      expect(prematurePanel.events.some(({ eventId }) =>
        eventId.startsWith('hypertensive-emergency-later-panel-time-refused-'))).toBe(true);

      apply(subject, ACTIONS.later); apply(subject, ACTIONS.handoff);
      const prematureHandoff = subject.step();
      expect(prematureHandoff.state).toMatchObject({ heartRateBpm: 82,
        systolicMmHg: 212, diastolicMmHg: 122, meanArterialMmHg: 152 });
      expect(prematureHandoff.events.some(({ eventId }) =>
        eventId.startsWith('hypertensive-emergency-handoff-time-refused-'))).toBe(true);

      apply(subject, ACTIONS.handoff); const completed = subject.step();
      expect(completed.state).toMatchObject({ heartRateBpm: 80,
        systolicMmHg: 188, diastolicMmHg: 106, meanArterialMmHg: 133 });
      expect(completed.equipment.resuscitation.hypertensiveEmergencyAssessment?.handoffAtTick)
        .toBeGreaterThan(completed.equipment.resuscitation
          .hypertensiveEmergencyAssessment?.laterPanelAtTick ?? 0);
      const accepted = [...prematurePanel.events, ...prematureHandoff.events,
        ...completed.events].filter(({ eventId }) =>
        /^hypertensive-emergency-(?:measurement-reconciled|organ-injury-reviewed|phenotype-causes-reviewed|reduction-intent-recorded|later-panel-reviewed|handoff-recorded)-\d+$/.test(eventId));
      expect(accepted).toHaveLength(6);
      for (const event of accepted) {
        expect(event.data).not.toEqual(expect.objectContaining({ treatmentDeliveredByLearner: true }));
        expect(event.data).not.toEqual(expect.objectContaining({ drugSelected: true }));
      }
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [],
        [...onset.events, ...prematurePanel.events, ...prematureHandoff.events,
          ...completed.events]).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    });

  it('refuses every generic treatment, device, procedure, rhythm, and crisis bypass before mutation', () => {
    const blocked = ['bolus', 'infusion', 'ventilator', 'call-for-help', 'airway-device',
      'laryngoscopy', 'vasopressor', 'ephedrine', 'inhaled-bronchodilator', 'epinephrine',
      'inject-crisis', 'neuromuscular-reversal', 'chest-compressions',
      'cardiac-arrest-epinephrine', 'defibrillation', 'seizure-suppression',
      'lipid-emulsion', 'dantrolene', 'active-cooling', 'fluid', 'blood-bank-request',
      'blood-product', 'coagulation-labs', 'hypnotic-line', 'airway-maneuver',
      'silence-alarm', 'artifact', 'arterial-line', 'capnography-line',
      'breathing-circuit', 'rhythm', 'anaphylaxis', 'blood-loss', 'cardiac-tamponade',
      'crystalloid', 'difficult-airway', 'equipment-failure', 'high-spinal',
      'laryngospasm', 'local-anesthetic-toxicity', 'malignant-hyperthermia', 'obstruction',
      'opioid-ventilatory-impairment', 'perioperative-hyperglycemia',
      'perioperative-hypothermia', 'rhythm-change', 'sepsis-pattern', 'shock-pattern',
      'status-epilepticus', 'surgical-stimulus', 'tension-pneumothorax',
      'thermal-response', 'upper-airway-obstruction', 'venous-air-embolism'] as const;
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 182,
      practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 182,
      practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { drugId: 'propofol', amount: 100, unit: 'mg', rate: 100,
        volumeMl: 2_000, fluidId: 'balanced-crystalloid', doseMgPerKg: 2.5,
        micrograms: 50, rhythm: 'ventricular-fibrillation', crisis: 'anaphylaxis' } } as never);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('hypertensive-emergency-generic-action-refused-'))).toHaveLength(blocked.length);
    expect(refused.events.some(({ eventId }) => /^fluid-|^bolus-|^defibrillation-/.test(eventId)))
      .toBe(false);
  });

  it.each([ACUTE_PULMONARY_EDEMA, ACUTE_AORTIC_SYNDROME, ACUTE_ISCHEMIC_STROKE,
    INTRACRANIAL_HEMORRHAGE_DETERIORATION])(
    'does not leak its actions or assessment into an adjacent scenario', (scenario) => {
      const subject = new AnesthesiaEngine({ scenario, seed: 183, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS.measurement); const result = subject.step();
      expect(result.equipment.resuscitation.hypertensiveEmergencyAssessment).toBeUndefined();
      expect(result.events.some(({ eventId }) =>
        eventId.startsWith('hypertensive-emergency-response-refused-'))).toBe(true);
    });

  it('debriefs only exact accepted events and both strict elapsed boundaries', () => {
    const event = (eventId: string, tick: number): EngineEvent => ({ eventId, tick,
      category: 'assessment', severity: 'warning', message: eventId });
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const exact = [event('hypertensive-emergency-measurement-reconciled-10', 10),
      event('hypertensive-emergency-organ-injury-reviewed-20', 20),
      event('hypertensive-emergency-phenotype-causes-reviewed-30', 30),
      event('hypertensive-emergency-reduction-intent-recorded-30', 30),
      event('hypertensive-emergency-later-panel-reviewed-40', 40),
      event('hypertensive-emergency-handoff-recorded-50', 50)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], exact)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const prematurePanel = [...exact.slice(0, 4),
      event('hypertensive-emergency-later-panel-reviewed-30', 30),
      event('hypertensive-emergency-handoff-recorded-50', 50)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], prematurePanel)[4]?.outcome)
      .toBe('not-met');
    const prematureHandoff = [...exact.slice(0, -1),
      event('hypertensive-emergency-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], prematureHandoff)[5]?.outcome)
      .toBe('not-met');
    const hostile = [event('acute-pulmonary-edema-assessment-reconciled-10', 10),
      event('hypertensive-emergency-organ-injury-refused-20', 20),
      event('hypertensive-emergency-later-panel-time-refused-30', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], hostile)
      .every(({ outcome }) => outcome === 'not-met')).toBe(true);
  });
});
