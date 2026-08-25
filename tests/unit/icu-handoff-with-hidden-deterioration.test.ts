import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ICU_HANDOFF_WITH_HIDDEN_DETERIORATION as SCENARIO } from '../../src/modules/critical-care/scenarios/icu-handoff-with-hidden-deterioration';

describe('critical-care ICU handoff with hidden deterioration', () => {
  it('validates active receiver scrutiny and communication boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('contradicts it');
    expect(narrative).toContain('before receiver synthesis and acceptance');
    expect(narrative).toContain('not simulated');
  });
  it('orders readiness, content, cross-check, escalation, and accepted reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 124, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 118, meanArterialMmHg: 64,
      respiratoryRateBpm: 18, spo2Percent: 96, etco2MmHg: 30, coreTemperatureC: 39.1 });
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'icu-hidden-deterioration-handoff-response', payload: { action } });
    for (const action of ['establish-icu-handoff-readiness', 'receive-icu-handoff-content',
      'cross-check-hidden-deterioration', 'escalate-icu-handoff-deterioration',
      'synthesize-accept-and-reassess-icu-handoff']) apply(action);
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 108, meanArterialMmHg: 70,
      respiratoryRateBpm: 18, spo2Percent: 96, etco2MmHg: 33, coreTemperatureC: 38.9 });
    expect(completed.equipment.resuscitation.icuHiddenDeteriorationHandoffAssessment).toMatchObject({
      readinessAtTick: expect.any(Number), contentAtTick: expect.any(Number),
      crossCheckAtTick: expect.any(Number), escalationAtTick: expect.any(Number),
      acceptanceAtTick: expect.any(Number) });
    expect(completed.events.find((e) => /^icu-hidden-handoff-deterioration-cross-checked-\d+$/.test(e.eventId))?.data)
      .toMatchObject({ stableClaimCorrected: true, severity: 'worsening-shock', verificationPerformed: false });
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });
  it('refuses premature acceptance, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 125, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'icu-hidden-deterioration-handoff-response', payload: { action } });
    apply('synthesize-accept-and-reassess-icu-handoff'); apply('accept-stable');
    apply('establish-icu-handoff-readiness'); apply('establish-icu-handoff-readiness');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.icuHiddenDeteriorationHandoffAssessment).toMatchObject({
      readinessAtTick: expect.any(Number), contentAtTick: null, crossCheckAtTick: null,
      escalationAtTick: null, acceptanceAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('icu-hidden-handoff-readiness-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('icu-hidden-handoff-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('icu-hidden-handoff-readiness-refused-'))).toBe(true);
  });
});
