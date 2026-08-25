import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { NSTEMI_RISK_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/nstemi-risk-reassessment';

const ACTIONS = ['reconcile-nstemi-serial-trajectory', 'verify-nstemi-and-alternatives',
  'screen-nstemi-very-high-risk-features', 'record-nstemi-invasive-strategy',
  'record-nstemi-monitoring-and-handoff'];

describe('cardiology NSTEMI risk reassessment', () => {
  it('validates the serial, risk, regional-timing, and no-live-care boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('18 to 146 ng/L');
    expect(narrative).toContain('no current very-high-risk feature');
    expect(narrative).toContain('exact timing follows the applicable region');
    expect(narrative).toContain('does not examine, acquire or interpret tests');
    const ordinary = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION,
      seed: 162, practiceRegion: 'US' }).step();
    expect(ordinary.equipment.resuscitation.nstemiRiskAssessment).toBeUndefined();
  });

  it('orders serial reconciliation, verification, current danger, strategy, and ownership', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 161, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 88, meanArterialMmHg: 96,
      respiratoryRateBpm: 16, spo2Percent: 97, coreTemperatureC: 36.7 });
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'nstemi-risk-response', payload: { action } });
    const completed = subject.step();
    expect(completed.equipment.resuscitation.nstemiRiskAssessment).toMatchObject({
      trajectoryAtTick: expect.any(Number), verificationAtTick: expect.any(Number),
      veryHighRiskAtTick: expect.any(Number), strategyAtTick: expect.any(Number),
      handoffAtTick: expect.any(Number), ischemicRisk: 'high', currentVeryHighRisk: false,
      exactScoreCalculated: false, procedurePerformed: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature strategy, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 163, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'nstemi-risk-response', payload: { action } });
    apply(ACTIONS[3]!); apply('order-angiography'); apply(ACTIONS[0]!); apply(ACTIONS[0]!);
    const refused = subject.step();
    expect(refused.equipment.resuscitation.nstemiRiskAssessment).toMatchObject({
      trajectoryAtTick: expect.any(Number), verificationAtTick: null, veryHighRiskAtTick: null,
      strategyAtTick: null, handoffAtTick: null, procedurePerformed: false });
    expect(refused.events.some((e) => e.eventId.startsWith('nstemi-risk-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('nstemi-risk-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('nstemi-risk-trajectory-refused-'))).toBe(true);
  });
});
