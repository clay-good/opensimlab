import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';
import { PACEMAKER_CAPTURE_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';
import { COMPLETE_HEART_BLOCK } from '../../src/modules/cardiology/scenarios/complete-heart-block';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT } from '../../src/modules/cardiology/scenarios/symptomatic-sinus-bradycardia-reassessment';
import { PACEMAKER_AND_CAUTERY_PLANNING } from '@anesthesia/scenarios/pacemaker-and-cautery-planning';

const ACTIONS = {
  recognition: 'reconcile-pacemaker-capture-failure-pulse-and-pattern',
  rescue: 'activate-pacemaker-capture-failure-rescue-pathway',
  device: 'review-pacemaker-capture-failure-device-system',
  causes: 'review-pacemaker-capture-failure-causes',
  later: 'review-pacemaker-capture-failure-later-panel',
  handoff: 'handoff-pacemaker-capture-failure-reassessment',
} as const;

function apply(subject: AnesthesiaEngine, action: string,
  type = 'pacemaker-capture-failure-response') {
  subject.apply({ tick: subject.tick, type, payload: { action } });
}

describe('cardiology pacemaker capture failure', () => {
  it('is an exact-target electrical-capture-failure contract distinct from adjacent pacing lessons', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'narrative'
      && target === 'pacemaker-capture-failure-reassessment')).toBe(true);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    expect(narrative).toMatch(/pacing (?:artifact|spike)s?/i);
    expect(narrative).toMatch(/not followed by (?:a )?(?:paced )?(?:QRS|ventricular depolarization)/i);
    expect(narrative).toMatch(/intrinsic|escape/i);
    expect(narrative).toMatch(/pulse/i);
    expect(narrative).toMatch(/controls do not[^.]*interrogate/i);
    expect(narrative).toMatch(/select output, rate, pulse width/i);
    expect(narrative).toMatch(/magnet/i);
    for (const adjacent of [COMPLETE_HEART_BLOCK,
      SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT, PACEMAKER_AND_CAUTERY_PLANNING]) {
      expect(SCENARIO.metadata.objectives.map(({ id }) => id))
        .not.toEqual(adjacent.metadata.objectives.map(({ id }) => id));
      expect(SCENARIO.timeline.map(({ target }) => target))
        .not.toEqual(adjacent.timeline.map(({ target }) => target));
    }
  });

  it.each([
    [ACTIONS.rescue, ACTIONS.device, ACTIONS.causes],
    [ACTIONS.device, ACTIONS.causes, ACTIONS.rescue],
    [ACTIONS.causes, ACTIONS.rescue, ACTIONS.device],
  ])('keeps rescue independent of both parallel reviews and enforces 2 elapsed gates',
    (first, second, third) => {
      const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 191,
        practiceRegion: 'US' });
      const onset = subject.step();
      expect(onset.state).toMatchObject({ heartRateBpm: 32, systolicMmHg: 84,
        diastolicMmHg: 52, meanArterialMmHg: 63, respiratoryRateBpm: 18,
        spo2Percent: 97 });
      apply(subject, ACTIONS.recognition);
      apply(subject, first); apply(subject, second); apply(subject, third);
      apply(subject, ACTIONS.later);
      const prematurePanel = subject.step();
      expect(prematurePanel.equipment.resuscitation.pacemakerCaptureFailureAssessment)
        .toMatchObject({ recognitionAtTick: expect.any(Number), rescueAtTick: expect.any(Number),
          deviceSystemAtTick: expect.any(Number), causesAtTick: expect.any(Number),
          laterPanelAtTick: null, handoffAtTick: null, initialPulsePresent: true,
          electricalCaptureFailureAuthored: true, pacingDeliveredByLearner: false,
          captureAssessedByLearner: false, deviceInterrogatedByLearner: false,
          deviceProgrammedByLearner: false, outputSelectedByLearner: false,
          leadManipulatedByLearner: false, treatmentDeliveredByLearner: false,
          outcomePredicted: false });
      expect(prematurePanel.events.some(({ eventId }) =>
        eventId.startsWith('pacemaker-capture-failure-later-panel-time-refused-'))).toBe(true);

      apply(subject, ACTIONS.later); apply(subject, ACTIONS.handoff);
      const prematureHandoff = subject.step();
      expect(prematureHandoff.events.some(({ eventId }) =>
        eventId.startsWith('pacemaker-capture-failure-handoff-time-refused-'))).toBe(true);

      apply(subject, ACTIONS.handoff); const completed = subject.step();
      const assessment = completed.equipment.resuscitation.pacemakerCaptureFailureAssessment;
      expect(assessment?.laterPanelAtTick).toBeGreaterThan(Math.max(
        assessment?.rescueAtTick ?? 0, assessment?.deviceSystemAtTick ?? 0,
        assessment?.causesAtTick ?? 0));
      expect(assessment?.handoffAtTick).toBeGreaterThan(assessment?.laterPanelAtTick ?? 0);
      const accepted = [...prematurePanel.events, ...prematureHandoff.events,
        ...completed.events].filter(({ eventId }) =>
        /^pacemaker-capture-failure-(?:recognized|rescue-activated|device-system-reviewed|causes-reviewed|later-panel-reviewed|handoff-recorded)-\d+$/.test(eventId));
      expect(accepted).toHaveLength(6);
      for (const event of accepted) {
        expect(event.data).not.toEqual(expect.objectContaining({ pacingDeliveredByLearner: true }));
        expect(event.data).not.toEqual(expect.objectContaining({ captureAssessedByLearner: true }));
        expect(event.data).not.toEqual(expect.objectContaining({ deviceProgrammedByLearner: true }));
        expect(event.data).not.toEqual(expect.objectContaining({ treatmentDeliveredByLearner: true }));
      }
      const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
        { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
      expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
        ...prematurePanel.events, ...prematureHandoff.events, ...completed.events])
        .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    });

  it('refuses later review when rescue is omitted even after both diagnostic lanes', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 192,
      practiceRegion: 'US' });
    subject.step(); apply(subject, ACTIONS.recognition); subject.step();
    apply(subject, ACTIONS.device); apply(subject, ACTIONS.causes); subject.step();
    apply(subject, ACTIONS.later); const result = subject.step();
    expect(result.equipment.resuscitation.pacemakerCaptureFailureAssessment?.laterPanelAtTick)
      .toBeNull();
    expect(result.events.some(({ eventId }) =>
      eventId.startsWith('pacemaker-capture-failure-later-panel-order-refused-'))).toBe(true);
  });

  it('refuses all generic treatment, rhythm, device, procedure, and crisis bypasses without mutation', () => {
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
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 193,
      practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 193,
      practiceRegion: 'US' });
    hostile.step(); control.step();
    for (const type of blocked) hostile.apply({ tick: hostile.tick, type,
      payload: { drugId: 'propofol', amount: 100, unit: 'mg', rate: 100,
        volumeMl: 2_000, fluidId: 'balanced-crystalloid', doseMgPerKg: 2.5,
        micrograms: 50, rhythm: 'paced', target: 'paced', crisis: 'anaphylaxis' } } as never);
    const refused = hostile.step(); const untouched = control.step();
    expect(refused.state).toEqual(untouched.state);
    expect(refused.concentrations).toEqual(untouched.concentrations);
    expect(refused.equipment).toEqual(untouched.equipment);
    expect(refused.events.filter(({ eventId }) =>
      eventId.startsWith('pacemaker-capture-failure-generic-action-refused-')))
      .toHaveLength(blocked.length);
  });

  it.each([COMPLETE_HEART_BLOCK, SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT,
    PACEMAKER_AND_CAUTERY_PLANNING])(
    'does not activate in an adjacent pacing or bradycardia lesson', (scenario) => {
      const subject = new AnesthesiaEngine({ scenario, seed: 194, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS.recognition); const result = subject.step();
      expect(result.equipment.resuscitation.pacemakerCaptureFailureAssessment).toBeUndefined();
      expect(result.events.some(({ eventId }) =>
        eventId.startsWith('pacemaker-capture-failure-response-refused-'))).toBe(true);
    });

  it('does not activate from the boundary or a lookalike target', () => {
    for (const target of ['pacemaker-capture-failure-reassessment-boundary',
      'pacemaker-capture-failure-reassessment-extra']) {
      const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
        target: entry.target === 'pacemaker-capture-failure-reassessment' ? target : entry.target })) };
      const subject = new AnesthesiaEngine({ scenario, seed: 196, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS.recognition); const result = subject.step();
      expect(result.equipment.resuscitation.pacemakerCaptureFailureAssessment).toBeUndefined();
      expect(result.events.some(({ eventId }) =>
        eventId.startsWith('pacemaker-capture-failure-response-refused-'))).toBe(true);
    }
  });

  it('refuses foreign pacing actions and hostile capture shortcuts without changing its state', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 195,
      practiceRegion: 'US' });
    subject.step();
    for (const value of ['declare-electrical-capture', 'increase-output-to-max',
      'apply-magnet', 'program-asynchronous-mode', 'revise-lead-now', '__proto__'])
      apply(subject, value);
    apply(subject, 'activate-complete-heart-block-pathway', 'complete-heart-block-response');
    apply(subject, 'record-atropine-intent', 'unstable-bradycardia-response');
    apply(subject, 'coordinate-asynchronous-pacing', 'cied-planning-assessment');
    const result = subject.step();
    expect(result.equipment.resuscitation.pacemakerCaptureFailureAssessment)
      .toMatchObject({ recognitionAtTick: null, rescueAtTick: null, deviceSystemAtTick: null,
        causesAtTick: null, laterPanelAtTick: null, handoffAtTick: null });
    expect(result.events.filter(({ eventId }) => eventId.includes('refused')).length)
      .toBeGreaterThanOrEqual(9);
  });

  it('debriefs only anchored accepted events with both strict elapsed boundaries', () => {
    const event = (eventId: string, tick: number): EngineEvent => ({ eventId, tick,
      category: 'assessment', severity: 'warning', message: eventId });
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const exact = [event('pacemaker-capture-failure-recognized-10', 10),
      event('pacemaker-capture-failure-rescue-activated-20', 20),
      event('pacemaker-capture-failure-device-system-reviewed-20', 20),
      event('pacemaker-capture-failure-causes-reviewed-20', 20),
      event('pacemaker-capture-failure-later-panel-reviewed-30', 30),
      event('pacemaker-capture-failure-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], exact)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const prematurePanel = [...exact.slice(0, 4),
      event('pacemaker-capture-failure-later-panel-reviewed-20', 20),
      event('pacemaker-capture-failure-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], prematurePanel)[4]?.outcome)
      .toBe('not-met');
    const prematureHandoff = [...exact.slice(0, -1),
      event('pacemaker-capture-failure-handoff-recorded-30', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], prematureHandoff)[5]?.outcome)
      .toBe('not-met');
    const hostile = [event('complete-heart-block-pathway-activated-10', 10),
      event('pacemaker-capture-failure-recognized-extra-10', 10),
      event('pacemaker-capture-failure-device-system-refused-20', 20),
      event('pacemaker-capture-failure-later-panel-time-refused-30', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], hostile)
      .every(({ outcome }) => outcome === 'not-met')).toBe(true);
  });
});
