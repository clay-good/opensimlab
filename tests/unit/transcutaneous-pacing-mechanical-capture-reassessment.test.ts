import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';
import { TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/transcutaneous-pacing-mechanical-capture-reassessment';
import { PACEMAKER_CAPTURE_FAILURE } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';
import { COMPLETE_HEART_BLOCK } from '../../src/modules/cardiology/scenarios/complete-heart-block';
import { UNSTABLE_BRADYCARDIA } from '../../src/modules/emergency-medicine/scenarios/unstable-bradycardia';
import { getRhythm } from '@anesthesia/waveforms/rhythms';

const ACTIONS = {
  recognition: 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture',
  pulseless: 'activate-transcutaneous-pacing-pulseless-response',
  causes: 'review-transcutaneous-pacing-open-causes-and-bridge',
  handoff: 'handoff-transcutaneous-pacing-reassessment',
} as const;
function apply(subject: AnesthesiaEngine, action: string,
  type = 'transcutaneous-pacing-capture-response') {
  subject.apply({ tick: subject.tick, type, payload: { action } });
}

describe('cardiology transcutaneous pacing electrical capture without mechanical capture', () => {
  it('renders paced electrical complexes while both mechanical traces stay flat', () => {
    const rhythm = getRhythm('paced-electrical-no-mechanical-capture');
    expect(rhythm.morphology).toMatchObject({ pacingSpike: true, mechanicalPulse: false });
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 210,
      practiceRegion: 'US' });
    const ecg: number[] = []; const arterial: number[] = []; const pleth: number[] = [];
    for (let tick = 0; tick < 100; tick += 1) {
      const result = subject.step();
      ecg.push(...result.waveforms.ecg.samples);
      arterial.push(...result.waveforms.arterial.samples);
      pleth.push(...result.waveforms.pleth.samples);
    }
    expect(Math.max(...ecg)).toBeGreaterThan(0.8);
    expect(Math.max(...arterial) - Math.min(...arterial)).toBeLessThan(6);
    expect(Math.max(...pleth) - Math.min(...pleth)).toBeLessThan(0.1);
  });

  it('is an exact-target pulseless PEA contract distinct from capture failure and bradycardia', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.timeline.some(({ type, target }) => type === 'narrative'
      && target === 'transcutaneous-pacing-mechanical-capture-reassessment')).toBe(true);
    const narrative = SCENARIO.timeline.map(({ message }) => message).join(' ');
    expect(narrative).toMatch(/70\/min/i);
    expect(narrative).toMatch(/pacing (?:artifact|spike|stimulus|stimuli).*broad QRS/i);
    expect(narrative).toMatch(/electrical capture/i);
    expect(narrative).toMatch(/no (?:carotid|femoral|palpable).*pulse|pulse loss/i);
    expect(narrative).toMatch(/no (?:pulsatile )?pleth|pleth.*(?:absent|nonpulsatile)/i);
    expect(narrative).toMatch(/no (?:pulsatile )?arterial|arterial.*(?:absent|nonpulsatile)/i);
    expect(narrative).toMatch(/no measurable (?:blood )?pressure|unmeasurable (?:blood )?pressure|unobtainable BP/i);
    expect(narrative).toMatch(/pulseless electrical activity|\bPEA\b/i);
    expect(narrative).toMatch(/return of spontaneous circulation.*(?:unreported|not reported)/i);
    expect(narrative).not.toMatch(/ROSC (?:was |is )?(?:achieved|obtained)|restored mechanical capture/i);
    expect(narrative).toMatch(/no (?:setting|output|current|pulse width)|does not select/i);
    for (const adjacent of [PACEMAKER_CAPTURE_FAILURE, COMPLETE_HEART_BLOCK,
      UNSTABLE_BRADYCARDIA]) {
      expect(SCENARIO.metadata.objectives.map(({ id }) => id))
        .not.toEqual(adjacent.metadata.objectives.map(({ id }) => id));
      expect(SCENARIO.timeline.map(({ target }) => target))
        .not.toEqual(adjacent.timeline.map(({ target }) => target));
    }
  });

  it('enforces serial recognition, pulseless response, open causes/bridge, and later handoff', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 211,
      practiceRegion: 'US' });
    const onset = subject.step();
    apply(subject, ACTIONS.pulseless); apply(subject, ACTIONS.causes);
    apply(subject, ACTIONS.handoff);
    const refusedBeforeRecognition = subject.step();
    expect(refusedBeforeRecognition.equipment.resuscitation
      .transcutaneousPacingCaptureAssessment).toMatchObject({ recognitionAtTick: null,
        pulselessResponseAtTick: null, causesBridgeAtTick: null, handoffAtTick: null,
        initialPulsePresent: false, electricalCaptureAuthored: true,
        mechanicalCaptureAbsent: true, nonshockableArrestPathwayActivated: false,
        pacingDeliveredByLearner: false,
        captureAssessedByLearner: false, cprDeliveredByLearner: false,
        procedurePerformedByLearner: false, roscReported: false,
        treatmentDeliveredByLearner: false, outcomePredicted: false });
    expect(refusedBeforeRecognition.events.filter(({ eventId }) =>
      eventId.startsWith('transcutaneous-pacing-order-refused-'))).toHaveLength(3);

    apply(subject, ACTIONS.recognition); apply(subject, ACTIONS.pulseless);
    apply(subject, ACTIONS.causes); apply(subject, ACTIONS.handoff);
    const prematureHandoff = subject.step();
    expect(prematureHandoff.events.some(({ eventId }) =>
      eventId.startsWith('transcutaneous-pacing-handoff-time-refused-'))).toBe(true);
    expect(prematureHandoff.equipment.resuscitation
      .transcutaneousPacingCaptureAssessment?.handoffAtTick).toBeNull();

    apply(subject, ACTIONS.handoff); const completed = subject.step();
    const assessment = completed.equipment.resuscitation.transcutaneousPacingCaptureAssessment;
    expect(assessment?.handoffAtTick).toBeGreaterThan(assessment?.causesBridgeAtTick ?? 0);
    const accepted = [...prematureHandoff.events, ...completed.events].filter(({ eventId }) =>
      /^transcutaneous-pacing-(?:capture-reconciled|pulseless-response-activated|causes-bridge-reviewed|handoff-recorded)-\d+$/.test(eventId));
    expect(accepted).toHaveLength(4);
    for (const event of accepted) {
      for (const key of ['pacingDeliveredByLearner', 'captureAssessedByLearner',
        'cprDeliveredByLearner', 'drugSelectedByLearner', 'procedurePerformedByLearner',
        'treatmentDeliveredByLearner', 'outcomePredicted'])
        expect(event.data).not.toEqual(expect.objectContaining({ [key]: true }));
    }
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events,
      ...refusedBeforeRecognition.events, ...prematureHandoff.events, ...completed.events])
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met']);
  });

  it('does not allow recognition or electrical capture alone to satisfy the later handoff', () => {
    const missingResponse = new AnesthesiaEngine({ scenario: SCENARIO, seed: 212,
      practiceRegion: 'US' });
    missingResponse.step(); apply(missingResponse, ACTIONS.recognition); missingResponse.step();
    apply(missingResponse, ACTIONS.causes); apply(missingResponse, ACTIONS.handoff);
    const first = missingResponse.step();
    expect(first.equipment.resuscitation.transcutaneousPacingCaptureAssessment?.handoffAtTick)
      .toBeNull();
    expect(first.events.filter(({ eventId }) =>
      eventId.startsWith('transcutaneous-pacing-pulseless-order-refused-'))).toHaveLength(2);
  });

  it('refuses generic treatment, pacing, rhythm, procedure, and crisis actions before mutation', () => {
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
    const hostile = new AnesthesiaEngine({ scenario: SCENARIO, seed: 213,
      practiceRegion: 'US' });
    const control = new AnesthesiaEngine({ scenario: SCENARIO, seed: 213,
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
      eventId.startsWith('transcutaneous-pacing-generic-action-refused-')))
      .toHaveLength(blocked.length);
  });

  it.each([PACEMAKER_CAPTURE_FAILURE, COMPLETE_HEART_BLOCK, UNSTABLE_BRADYCARDIA])(
    'does not leak into an adjacent pacing or bradycardia scenario', (scenario) => {
      const subject = new AnesthesiaEngine({ scenario, seed: 214, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS.recognition); const result = subject.step();
      expect(result.equipment.resuscitation.transcutaneousPacingCaptureAssessment).toBeUndefined();
      expect(result.events.some(({ eventId }) =>
        eventId.startsWith('transcutaneous-pacing-response-refused-'))).toBe(true);
    });

  it('requires the exact target and refuses false capture, setting, and outcome shortcuts', () => {
    for (const target of ['transcutaneous-pacing-mechanical-capture-reassessment-boundary',
      'transcutaneous-pacing-mechanical-capture-reassessment-extra']) {
      const scenario = { ...SCENARIO, timeline: SCENARIO.timeline.map((entry) => ({ ...entry,
        target: entry.target === 'transcutaneous-pacing-mechanical-capture-reassessment'
          ? target : entry.target })) };
      const subject = new AnesthesiaEngine({ scenario, seed: 215, practiceRegion: 'US' });
      subject.step(); apply(subject, ACTIONS.recognition); const result = subject.step();
      expect(result.equipment.resuscitation.transcutaneousPacingCaptureAssessment).toBeUndefined();
      expect(result.events.some(({ eventId }) =>
        eventId.startsWith('transcutaneous-pacing-response-refused-'))).toBe(true);
    }
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 216,
      practiceRegion: 'US' });
    subject.step();
    for (const value of ['declare-mechanical-capture', 'increase-current', 'set-rate-70',
      'give-sedation', 'place-transvenous-wire', 'declare-rosc', '__proto__']) apply(subject, value);
    apply(subject, 'reconcile-pacemaker-capture-failure-pulse-and-pattern',
      'pacemaker-capture-failure-response');
    apply(subject, 'record-atropine-intent', 'unstable-bradycardia-response');
    const result = subject.step();
    expect(result.equipment.resuscitation.transcutaneousPacingCaptureAssessment)
      .toMatchObject({ recognitionAtTick: null, pulselessResponseAtTick: null,
        causesBridgeAtTick: null, handoffAtTick: null });
    expect(result.events.filter(({ eventId }) => eventId.includes('refused')).length)
      .toBeGreaterThanOrEqual(9);
  });

  it('debriefs only anchored serial events and a strictly later handoff', () => {
    const event = (eventId: string, tick: number): EngineEvent => ({ eventId, tick,
      category: 'assessment', severity: 'warning', message: eventId });
    const history = [{ tick: 0, state: {}, concentrations: [] }] as never;
    const exact = [event('transcutaneous-pacing-capture-reconciled-10', 10),
      event('transcutaneous-pacing-pulseless-response-activated-20', 20),
      event('transcutaneous-pacing-causes-bridge-reviewed-30', 30),
      event('transcutaneous-pacing-handoff-recorded-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], exact)
      .map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met']);
    const premature = [...exact.slice(0, -1),
      event('transcutaneous-pacing-handoff-recorded-30', 30)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], premature)[3]?.outcome)
      .toBe('not-met');
    const hostile = [event('transcutaneous-pacing-capture-reconciled-extra-10', 10),
      event('transcutaneous-pacing-pulseless-response-refused-20', 20),
      event('pacemaker-capture-failure-causes-reviewed-30', 30),
      event('transcutaneous-pacing-handoff-time-refused-40', 40)];
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], hostile)
      .every(({ outcome }) => outcome === 'not-met')).toBe(true);
  });
});
