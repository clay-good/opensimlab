import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { PULSE_OXIMETER_MOTION_ARTIFACT as SCENARIO } from '../../src/modules/critical-care/scenarios/pulse-oximeter-motion-artifact';

const ACTIONS = ['recognize-pulse-oximeter-discordance', 'inspect-pleth-and-pulse-rate-coherence',
  'review-probe-motion-and-perfusion', 'corroborate-oxygenation-independently',
  'reassess-pulse-oximeter-signal'];

describe('critical-care pulse-oximeter motion artifact', () => {
  it('validates independent patient, sensor, display, and corroboration boundaries', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    const narrative = SCENARIO.timeline.map((event) => event.message).join(' ');
    expect(narrative).toContain('separate teaching states');
    expect(narrative).toContain('does not exclude hypoxemia');
    expect(narrative).toContain('If a real patient is unstable');
    const ordinary = new AnesthesiaEngine({
      scenario: ROUTINE_INDUCTION, seed: 132, practiceRegion: 'US',
    }).step();
    expect(ordinary.equipment.resuscitation.pulseOximeterArtifactAssessment).toBeUndefined();
  });

  it('orders discordance, pleth, probe/perfusion, corroboration, and reassessment', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 130, practiceRegion: 'US' });
    const onset = subject.step();
    expect(onset.state).toMatchObject({ heartRateBpm: 86, meanArterialMmHg: 76,
      respiratoryRateBpm: 16, spo2Percent: 97, etco2MmHg: 37 });
    expect(onset.equipment.resuscitation.pulseOximeterArtifactAssessment).toMatchObject({
      displayedSpo2Percent: 82, displayedPulseRateBpm: 132, signalQuality: 'poor' });
    expect(onset.equipment.artifactParameters).toContain('spo2Percent');
    expect(onset.equipment.waveformArtifacts).toContain('pleth');
    for (const action of ACTIONS) subject.apply({ tick: subject.tick,
      type: 'pulse-oximeter-artifact-response', payload: { action } });
    const completed = subject.step();
    expect(completed.state).toMatchObject({ heartRateBpm: 86, meanArterialMmHg: 76,
      respiratoryRateBpm: 16, spo2Percent: 97, etco2MmHg: 37 });
    expect(completed.equipment.resuscitation.pulseOximeterArtifactAssessment).toMatchObject({
      discordanceAtTick: expect.any(Number), plethAtTick: expect.any(Number),
      probePerfusionAtTick: expect.any(Number), corroboratedAtTick: expect.any(Number),
      reassessedAtTick: expect.any(Number), displayedSpo2Percent: 97,
      displayedPulseRateBpm: 86, signalQuality: 'good' });
    expect(completed.equipment.artifactParameters).not.toContain('spo2Percent');
    expect(completed.equipment.waveformArtifacts).not.toContain('pleth');
    const history = [{ tick: onset.tick, state: onset.state, concentrations: [] },
      { tick: completed.tick, state: completed.state, concentrations: [] }] as never;
    expect(objectiveFindings(SCENARIO, history, 0, 0, [], [...onset.events, ...completed.events])
      .map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
  });

  it('refuses premature corroboration, duplicates, and unknown actions', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 131, practiceRegion: 'US' });
    subject.step();
    const apply = (action: string) => subject.apply({ tick: subject.tick,
      type: 'pulse-oximeter-artifact-response', payload: { action } });
    apply('corroborate-oxygenation-independently'); apply('treat-the-number');
    apply('recognize-pulse-oximeter-discordance'); apply('recognize-pulse-oximeter-discordance');
    const refused = subject.step();
    expect(refused.equipment.resuscitation.pulseOximeterArtifactAssessment).toMatchObject({
      discordanceAtTick: expect.any(Number), plethAtTick: null, probePerfusionAtTick: null,
      corroboratedAtTick: null, reassessedAtTick: null });
    expect(refused.events.some((e) => e.eventId.startsWith('pulse-ox-discordance-order-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('pulse-ox-response-refused-'))).toBe(true);
    expect(refused.events.some((e) => e.eventId.startsWith('pulse-ox-discordance-refused-'))).toBe(true);
  });
});
