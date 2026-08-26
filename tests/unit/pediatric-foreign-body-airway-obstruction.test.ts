import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { replay } from '@anesthesia/debrief/replay';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-foreign-body-airway-obstruction';
import { PEDIATRIC_BRADYCARDIC_ARREST } from '../../src/modules/pediatrics/scenarios/pediatric-bradycardic-arrest';
import { PEDIATRIC_ANAPHYLAXIS } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { PEDIATRIC_RESPIRATORY_DISTRESS } from '../../src/modules/pediatrics/scenarios/pediatric-respiratory-distress';
import { BRONCHIOLITIS } from '../../src/modules/pediatrics/scenarios/bronchiolitis';
import { CROUP } from '../../src/modules/pediatrics/scenarios/croup';
import { PEDIATRIC_STATUS_ASTHMATICUS } from '../../src/modules/pediatrics/scenarios/pediatric-status-asthmaticus';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';

const ACTIONS = [
  'reconcile-pediatric-foreign-body-airway-obstruction-event-cough-and-whole-child',
  'preserve-pediatric-foreign-body-airway-obstruction-effective-cough-and-surveillance',
  'recognize-pediatric-foreign-body-airway-obstruction-severe-responsive-transition',
  'activate-pediatric-foreign-body-airway-obstruction-qualified-responsive-pathway',
  'activate-pediatric-foreign-body-airway-obstruction-unresponsive-cpr-pathway',
  'handoff-pediatric-foreign-body-airway-obstruction-active-risk',
] as const;

const apply = (engine: AnesthesiaEngine, action: unknown,
  type = 'pediatric-foreign-body-airway-obstruction-response') =>
  engine.apply({ tick: engine.tick, type, payload: { action: action as never } });

const engine = (scenario = SCENARIO, seed = 1501) =>
  new AnesthesiaEngine({ scenario, seed, practiceRegion: 'US' });

describe('pediatric foreign-body airway-obstruction engine contract', () => {
  it('uses the exact intent-only contract without generic airway physics or treatment recipes', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual(ACTIONS);
    expect(SCENARIO.patient).toMatchObject({ ageYears: 6, weightKg: 20, heightCm: 115 });
    expect(SCENARIO.timeline.some(({ type }) => [
      'upper-airway-obstruction', 'obstruction', 'laryngospasm', 'cardiac-arrest',
    ].includes(type))).toBe(false);
    expect(SCENARIO.timeline.map(({ message }) => message).join(' '))
      .not.toMatch(/\b(?:mg|mcg|joules?|\d+\s*J)\b/i);
  });

  it('reports fixed effective-cough, severe-responsive, and unresponsive states without arrest claims', () => {
    const subject = engine();
    let frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 118, respiratoryRateBpm: 24,
      systolicMmHg: 100, diastolicMmHg: 64, meanArterialMmHg: 76,
      spo2Percent: 98, coreTemperatureC: 36.7 });
    expect(frame.equipment.invalidParameters).toContain('etco2MmHg');
    expect(frame.equipment.invalidParameters).not.toContain('respiratoryRateBpm');

    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]); subject.step();
    apply(subject, ACTIONS[2]); frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 138, respiratoryRateBpm: 0,
      systolicMmHg: 98, diastolicMmHg: 60, meanArterialMmHg: 73,
      spo2Percent: 91, coreTemperatureC: 36.7 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining([
      'respiratoryRateBpm', 'etco2MmHg',
    ]));
    expect(frame.equipment.invalidParameters).not.toContain('spo2Percent');

    apply(subject, ACTIONS[3]); subject.step(); apply(subject, ACTIONS[4]);
    frame = subject.step();
    expect(frame.state).toMatchObject({ heartRateBpm: 132, respiratoryRateBpm: 0,
      systolicMmHg: 0, diastolicMmHg: 0, meanArterialMmHg: 0,
      spo2Percent: 0, coreTemperatureC: 36.7 });
    expect(frame.equipment.invalidParameters).toEqual(expect.arrayContaining([
      'etco2MmHg', 'spo2Percent', 'systolicMmHg', 'diastolicMmHg', 'meanArterialMmHg',
    ]));
    expect(frame.equipment.invalidParameters).not.toContain('respiratoryRateBpm');
    expect(frame.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
      chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
      defibrillationShockCount: 0, roscAtTick: null,
      pediatricForeignBodyAirwayObstructionAssessment: {
        initialPulsePresent: true, severeResponsivePulsePresent: true,
        unresponsiveNoNormalBreathingAuthored: true,
        unresponsivePulseStatusUnavailable: true,
        qualifiedUnresponsiveCprPathwayActive: true,
        pulseAssessedByLearner: false, objectRemovedByLearner: false,
        backBlowsPerformedByLearner: false, abdominalThrustsPerformedByLearner: false,
        chestThrustsPerformedByLearner: false, blindFingerSweepPerformedByLearner: false,
        cprDeliveredByLearner: false, chestCompressionsDeliveredByLearner: false,
        cardiacArrestDeclared: false, pulseLossProven: false, roscReported: false,
        objectClearanceReported: false, treatmentDeliveredByLearner: false,
        dispositionDetermined: false, outcomePredicted: false,
      },
    });
  });

  it('enforces every prerequisite and all three elapsed gates without mutation', () => {
    const cases: readonly [readonly string[], string][] = [
      [[], ACTIONS[1]], [[], ACTIONS[2]], [[], ACTIONS[3]], [[], ACTIONS[4]], [[], ACTIONS[5]],
      [[ACTIONS[0]], ACTIONS[2]], [[ACTIONS[0], ACTIONS[1]], ACTIONS[3]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2]], ACTIONS[4]],
      [[ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[3]], ACTIONS[5]],
    ];
    for (const [prepare, action] of cases) {
      const subject = engine(SCENARIO, 1502); const control = engine(SCENARIO, 1502);
      subject.step(); control.step();
      for (const item of prepare) { apply(subject, item); apply(control, item); }
      subject.step(); control.step(); apply(subject, action);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
    }

    const subject = engine(SCENARIO, 1503); const control = engine(SCENARIO, 1503);
    subject.step(); control.step();
    apply(subject, ACTIONS[0]); apply(control, ACTIONS[0]);
    apply(subject, ACTIONS[1]); apply(control, ACTIONS[1]);
    apply(subject, ACTIONS[2]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[2]); apply(control, ACTIONS[2]);
    apply(subject, ACTIONS[3]); apply(control, ACTIONS[3]);
    apply(subject, ACTIONS[4]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
    apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricForeignBodyAirwayObstructionAssessment)
      .toMatchObject({ reconciledAtTick: 1, effectiveCoughAtTick: 1,
        severeResponsiveAtTick: 2, responsivePathwayAtTick: 2,
        unresponsivePathwayAtTick: 3, handoffAtTick: 4 });
  });

  it('blocks generic, adult, adjacent, and hostile treatment shortcuts before and after unresponsiveness', () => {
    const blocked: readonly [string, unknown][] = [
      ['pediatric-bradycardic-arrest-response', 'review-pediatric-bradycardic-arrest-pulse-loss-response'],
      ['pediatric-anaphylaxis-response', 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership'],
      ['pediatric-respiratory-distress-response', 'activate-pediatric-respiratory-distress-qualified-care'],
      ['croup-response', 'activate-croup-qualified-airway-care'],
      ['acute-tracheostomy-obstruction-response', 'activate-acute-tracheostomy-obstruction-response'],
      ['chest-compressions', { active: true }],
      ['cardiac-arrest-epinephrine', { doseMg: 1, route: 'iv' }],
      ['defibrillation', { energyJ: 200, waveform: 'biphasic' }],
      ['bolus', { drugId: 'epinephrine', amount: 1, unit: 'mg' }],
      ['airway-device', { deviceId: 'ett' }], ['ventilator', { delivering: true, fio2: 1 }],
      ['rhythm-change', { target: 'pea' }], ['inject-crisis', { crisisId: 'laryngospasm' }],
    ];
    for (const afterUnresponsive of [false, true]) {
      const subject = engine(SCENARIO, 1504); const control = engine(SCENARIO, 1504);
      subject.step(); control.step();
      if (afterUnresponsive) {
        for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(control, action); }
        subject.step(); control.step();
        for (const action of ACTIONS.slice(2, 4)) { apply(subject, action); apply(control, action); }
        subject.step(); control.step(); apply(subject, ACTIONS[4]); apply(control, ACTIONS[4]);
        subject.step(); control.step();
      }
      for (const [type, payload] of blocked) subject.apply({ tick: -999, type,
        payload: (type.endsWith('-response') ? { action: payload } : payload) as never });
      for (const hostile of ['perform-back-blows', 'perform-abdominal-thrusts',
        'perform-infant-chest-thrusts', 'blind-finger-sweep', 'suction-object',
        'laryngoscopy-and-forceps', 'declare-pulse-loss', 'declare-cardiac-arrest',
        'report-object-clearance', 'declare-rosc', '__proto__', 'constructor', '', null, {}, []]) {
        apply(subject, hostile);
      }
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation).toMatchObject({ cardiacArrestActive: false,
        chestCompressionsActive: false, arrestEpinephrineTotalMg: 0,
        defibrillationShockCount: 0, roscAtTick: null });
    }
  });

  it.each([undefined, null, [],
    { type: 'pediatric-foreign-body-airway-obstruction-response', payload: null },
    { type: 5, payload: {} },
    { type: 'pediatric-foreign-body-airway-obstruction-response', payload: [] }] as const)(
    'calmly refuses malformed runtime action %# and continues', (malformed) => {
      const subject = engine(SCENARIO, 1505); const control = engine(SCENARIO, 1505);
      subject.step(); control.step(); subject.apply(malformed as never);
      expect(subject.step().equipment.resuscitation).toEqual(control.step().equipment.resuscitation);
      apply(subject, ACTIONS[0]);
      expect(subject.step().equipment.resuscitation
        .pediatricForeignBodyAirwayObstructionAssessment?.reconciledAtTick).not.toBeNull();
    });

  it('preserves first accepted duplicate ticks and replays deterministically', () => {
    const subject = engine(SCENARIO, 1506); subject.step();
    for (const action of ACTIONS.slice(0, 2)) { apply(subject, action); apply(subject, action); }
    subject.step();
    for (const action of ACTIONS.slice(2, 4)) { apply(subject, action); apply(subject, action); }
    subject.step(); apply(subject, ACTIONS[4]); apply(subject, ACTIONS[4]);
    subject.step(); apply(subject, ACTIONS[5]); apply(subject, ACTIONS[5]);
    expect(subject.step().equipment.resuscitation.pediatricForeignBodyAirwayObstructionAssessment)
      .toMatchObject({ reconciledAtTick: 1, effectiveCoughAtTick: 1,
        severeResponsiveAtTick: 2, responsivePathwayAtTick: 2,
        unresponsivePathwayAtTick: 3, handoffAtTick: 4 });

    const actions: LearnerAction[] = ACTIONS.map((action, index) => ({
      tick: index < 2 ? 0 : index < 4 ? 1 : index - 2,
      type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action },
    }));
    const options = { scenario: SCENARIO, seed: 1506, practiceRegion: 'US', ticks: 11 };
    const first = replay(actions, options);
    expect(replay(actions, options)).toEqual(first);
    expect(first.at(-1)?.state).toMatchObject({ heartRateBpm: 132, respiratoryRateBpm: 0,
      systolicMmHg: 0, spo2Percent: 0, coreTemperatureC: 36.7 });
  });

  it('requires exact metadata and both targets and cannot leak into neighboring lessons', () => {
    const wrong = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'foreign-body-airway-obstruction' } },
      ...['pediatric-foreign-body-airway-obstruction-reassessment',
        'pediatric-foreign-body-airway-obstruction-reassessment-boundary'].map((target) => ({
        ...SCENARIO, timeline: SCENARIO.timeline.map((event) => event.target === target
          ? { ...event, target: `${target}-suffix` } : event),
      })),
      PEDIATRIC_RESPIRATORY_DISTRESS, BRONCHIOLITIS, CROUP, PEDIATRIC_STATUS_ASTHMATICUS,
      PEDIATRIC_ANAPHYLAXIS, PEDIATRIC_BRADYCARDIC_ARREST, ACUTE_TRACHEOSTOMY_OBSTRUCTION,
    ];
    for (const scenario of wrong) {
      const subject = engine(scenario, 1507); const control = engine(scenario, 1507);
      subject.step(); control.step(); apply(subject, ACTIONS[0]);
      const refused = subject.step(); const untouched = control.step();
      expect(refused.state).toEqual(untouched.state);
      expect(refused.equipment.resuscitation).toEqual(untouched.equipment.resuscitation);
      expect(refused.equipment.resuscitation
        .pediatricForeignBodyAirwayObstructionAssessment).toBeUndefined();
    }
  });

  it('maps all six exact ordered events to debrief evidence', () => {
    const subject = engine(SCENARIO, 1509);
    const initial = subject.step(); const events = [...initial.events];
    apply(subject, ACTIONS[0]); apply(subject, ACTIONS[1]);
    let frame = subject.step(); events.push(...frame.events);
    apply(subject, ACTIONS[2]); apply(subject, ACTIONS[3]);
    frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[4]);
    frame = subject.step(); events.push(...frame.events); apply(subject, ACTIONS[5]);
    frame = subject.step(); events.push(...frame.events);
    const history = [{ tick: initial.tick, state: initial.state, concentrations: [] },
      { tick: frame.tick, state: frame.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], events).map(({ outcome }) => outcome))
      .toEqual(Array(6).fill('met'));
    expect(events.map(({ eventId }) => eventId)).toEqual(expect.arrayContaining([
      expect.stringMatching(/^pediatric-fbao-event-reconciled-\d+$/),
      expect.stringMatching(/^pediatric-fbao-effective-cough-preserved-\d+$/),
      expect.stringMatching(/^pediatric-fbao-severe-responsive-transition-recognized-\d+$/),
      expect.stringMatching(/^pediatric-fbao-qualified-responsive-pathway-activated-\d+$/),
      expect.stringMatching(/^pediatric-fbao-unresponsive-cpr-pathway-activated-\d+$/),
      expect.stringMatching(/^pediatric-fbao-active-risk-handoff-recorded-\d+$/),
    ]));
  });
});
