import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE as SCENARIO } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const ONSET = 600;

function engine(scenario: Scenario = SCENARIO) {
  return new AnesthesiaEngine({ scenario, seed: 20260824, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('pneumothorax under positive pressure', () => {
  it('validates, registers, cites current guidance, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('2025');
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    expect(new Set(mappings.flatMap((entry) => entry.objectiveIds)))
      .toEqual(new Set(SCENARIO.metadata.objectives.map((entry) => entry.id)));
  });

  it('produces the authored combined oxygenation and obstructive-shock pattern', () => {
    const controlScenario: Scenario = {
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'tension-pneumothorax'),
    };
    const affected = advance(engine(), ONSET + 300);
    const control = advance(engine(controlScenario), ONSET + 300);
    expect(affected.equipment.resuscitation.tensionPneumothoraxFraction).toBeGreaterThan(0.85);
    expect(affected.state.meanArterialMmHg).toBeLessThan(control.state.meanArterialMmHg * 0.6);
    expect(affected.state.cardiacOutputLPerMin).toBeLessThan(control.state.cardiacOutputLPerMin * 0.65);
    expect(affected.state.spo2Percent).toBeLessThan(control.state.spo2Percent - 12);
    expect(affected.state.etco2MmHg).toBeLessThan(control.state.etco2MmHg * 0.75);
  });

  it('returns the bounded bilateral finding and clears gradually after decompression intent', () => {
    const treated = engine();
    const untreated = engine();
    advance(treated, ONSET + 300);
    advance(untreated, ONSET + 300);
    treated.apply({ tick: treated.tick, type: 'pneumothorax-response', payload: {
      action: 'assess-bilateral-ventilation',
    } });
    treated.apply({ tick: treated.tick, type: 'pneumothorax-response', payload: {
      action: 'decompress-left-chest',
    } });
    const accepted = treated.step();
    expect(accepted.equipment.resuscitation.pneumothoraxAssessedAtTick).not.toBeNull();
    expect(accepted.equipment.resuscitation.pneumothoraxDecompressedAtTick).not.toBeNull();
    expect(accepted.events.some((entry) => entry.eventId.startsWith('pneumothorax-assessed-')))
      .toBe(true);
    const treatedFinal = advance(treated, 600);
    const untreatedFinal = advance(untreated, 601);
    expect(treatedFinal.equipment.resuscitation.tensionPneumothoraxFraction).toBeLessThan(0.02);
    expect(untreatedFinal.equipment.resuscitation.tensionPneumothoraxFraction).toBeGreaterThan(0.85);
    expect(treatedFinal.state.meanArterialMmHg).toBeGreaterThan(untreatedFinal.state.meanArterialMmHg + 30);
    expect(treatedFinal.state.spo2Percent).toBeGreaterThan(untreatedFinal.state.spo2Percent + 10);
  });

  it('rejects pre-event, unsupported, duplicate assessment, and duplicate decompression actions', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: {
      action: 'decompress-left-chest',
    } });
    expect(subject.step().equipment.resuscitation.pneumothoraxDecompressedAtTick).toBeNull();
    subject.apply({ tick: subject.tick, type: 'call-for-help', payload: {
      context: 'tension-pneumothorax',
    } });
    expect(subject.step().equipment.airway.helpRequestedAtTick).toBeNull();
    advance(subject, ONSET);
    subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: { action: 'guess' } });
    expect(subject.step().equipment.resuscitation.pneumothoraxAssessedAtTick).toBeNull();
    let refusalSeen = false;
    for (const action of ['assess-bilateral-ventilation', 'assess-bilateral-ventilation',
      'decompress-left-chest', 'decompress-left-chest']) {
      subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: { action } });
      const result = subject.step();
      refusalSeen ||= result.events.some((entry) => entry.eventId.includes('refused'));
    }
    expect(refusalSeen).toBe(true);
  });

  it('replays the accepted response deterministically', () => {
    const run = () => {
      const subject = engine();
      advance(subject, ONSET + 100);
      subject.apply({ tick: subject.tick, type: 'call-for-help', payload: {
        context: 'tension-pneumothorax',
      } });
      subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: {
        action: 'assess-bilateral-ventilation',
      } });
      subject.apply({ tick: subject.tick, type: 'ventilator', payload: { fio2: 1 } });
      subject.apply({ tick: subject.tick, type: 'pneumothorax-response', payload: {
        action: 'decompress-left-chest',
      } });
      return advance(subject, 500);
    };
    expect(run()).toEqual(run());
  });
});

const history = [
  { tick: ONSET, state: { spo2Percent: 82, meanArterialMmHg: 42 }, concentrations: [] },
  { tick: ONSET + 500, state: { spo2Percent: 96, meanArterialMmHg: 78 }, concentrations: [] },
] as never;

function event(eventId: string, tick: number, data?: EngineEvent['data']): EngineEvent {
  return { tick, eventId, category: 'crisis', data, severity: 'warning', message: eventId };
}

function finding(objectiveId: string, actions: readonly LearnerAction[], log: readonly EngineEvent[]) {
  return objectiveFindings(SCENARIO, history, 0, 0, actions, log)
    .find((entry) => entry.objectiveId === objectiveId)!;
}

describe('pneumothorax debrief uses accepted response state', () => {
  const actions: LearnerAction[] = [
    { tick: 650, type: 'ventilator', payload: { fio2: 1 } },
  ];
  const log: EngineEvent[] = [
    event('pneumothorax-assessed-620', 620, { side: 'left' }),
    event('airway-help-requested-625', 625, { context: 'tension-pneumothorax' }),
    event('pneumothorax-decompressed-630', 630, { side: 'left' }),
  ];

  it('scores assessment, escalation, oxygen, decompression, and observed recovery', () => {
    for (const objectiveId of SCENARIO.metadata.objectives.map((entry) => entry.id)) {
      expect(finding(objectiveId, actions, log).outcome, objectiveId).toBe('met');
    }
  });

  it('does not credit raw hostile requests without accepted engine events', () => {
    const hostile: LearnerAction[] = [{
      tick: 630, type: 'pneumothorax-response', payload: { action: 'decompress-left-chest' },
    }];
    expect(finding('decompress-pneumothorax', hostile, []).outcome).toBe('not-met');
    expect(finding('reassess-pneumothorax-recovery', hostile, []).outcome).toBe('not-met');
  });
});
