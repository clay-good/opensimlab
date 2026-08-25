import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/obstructive-shock-tension-pneumothorax';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let index = 1; index < ticks; index += 1) result = subject.step();
  return result;
}

describe('obstructive shock from tension pneumothorax', () => {
  it('creates a distinct spontaneous-trauma pattern and accepts the bounded expert response', () => {
    const subject = new AnesthesiaEngine({ scenario: SCENARIO, seed: 42, practiceRegion: 'US' });
    const baseline = subject.step();
    const affected = advance(subject, 80);
    expect(SCENARIO.equipment.airwayDevice).toBe('facemask');
    expect(SCENARIO.patient.airway.assessment).toContain('no tracheal tube');
    expect(affected.state.meanArterialMmHg).toBeLessThan(baseline.state.meanArterialMmHg);
    subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: { action: 'assess-bilateral-ventilation' } });
    subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'tension-pneumothorax' } });
    subject.apply({ tick: subject.tick, type: 'ventilator', payload: { fio2: 1 } });
    subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: { action: 'decompress-left-chest' } });
    const accepted = subject.step();
    expect(accepted.events.find((event) => event.eventId.startsWith('pneumothorax-assessed-'))?.message)
      .toContain('No tracheal tube is present');
    expect(accepted.equipment.resuscitation.pneumothoraxDecompressedAtTick).not.toBeNull();
    const recovered = advance(subject, 600);
    expect(recovered.equipment.resuscitation.tensionPneumothoraxFraction).toBeLessThan(0.02);
    expect(recovered.state.meanArterialMmHg).toBeGreaterThan(65);
    expect(recovered.state.spo2Percent).toBeGreaterThanOrEqual(94);
  });

  it('debriefs accepted emergency events without borrowing the anesthesia concept map', () => {
    const history = [
      { tick: 0, state: { spo2Percent: 82, meanArterialMmHg: 42 }, concentrations: [] },
      { tick: 500, state: { spo2Percent: 96, meanArterialMmHg: 76 }, concentrations: [] },
    ] as never;
    const actions: LearnerAction[] = [{ tick: 30, type: 'ventilator', payload: { fio2: 1 } }];
    const event = (eventId: string, tick: number, data?: EngineEvent['data']): EngineEvent => ({
      eventId, tick, data, category: 'crisis', severity: 'warning', message: eventId,
    });
    const log = [
      event('pneumothorax-assessed-10', 10),
      event('airway-help-requested-20', 20, { context: 'tension-pneumothorax' }),
      event('pneumothorax-decompressed-40', 40),
    ];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, actions, log);
    expect(findings.map((finding) => finding.outcome)).toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(findings.every((finding) => finding.concept === undefined)).toBe(true);
  });
});
