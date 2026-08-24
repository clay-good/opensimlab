import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { VENOUS_AIR_EMBOLISM_DURING_LINE_REMOVAL as SCENARIO } from '@anesthesia/scenarios/venous-air-embolism-during-line-removal';
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

describe('bounded venous-air-embolism scenario', () => {
  it('validates, registers, cites consensus guidance, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('consensus guideline');
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    expect(new Set(mappings.flatMap((entry) => entry.objectiveIds)))
      .toEqual(new Set(SCENARIO.metadata.objectives.map((entry) => entry.id)));
  });

  it('produces the authored abrupt pulmonary-flow monitor pattern', () => {
    const controlScenario: Scenario = {
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'venous-air-embolism'),
    };
    const affected = advance(engine(), ONSET + 200);
    const control = advance(engine(controlScenario), ONSET + 200);
    expect(affected.equipment.resuscitation.venousAirEmbolismFraction).toBeGreaterThan(0.85);
    expect(affected.state.etco2MmHg).toBeLessThan(control.state.etco2MmHg * 0.55);
    expect(affected.state.meanArterialMmHg).toBeLessThan(control.state.meanArterialMmHg * 0.7);
    expect(affected.state.cardiacOutputLPerMin).toBeLessThan(control.state.cardiacOutputLPerMin * 0.7);
    expect(affected.state.spo2Percent).toBeLessThan(control.state.spo2Percent);
  });

  it('stops new entry but clears the residual pattern gradually', () => {
    const treated = engine();
    const untreated = engine();
    advance(treated, ONSET + 200);
    advance(untreated, ONSET + 200);
    treated.apply({
      tick: treated.tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' },
    });
    const accepted = treated.step();
    expect(accepted.equipment.resuscitation.venousAirEntryControlled).toBe(true);
    expect(accepted.equipment.resuscitation.venousAirEmbolismFraction).toBeGreaterThan(0.8);
    const treatedFinal = advance(treated, 1200);
    const untreatedFinal = advance(untreated, 1201);
    expect(treatedFinal.equipment.resuscitation.venousAirEmbolismFraction).toBeLessThan(0.15);
    expect(untreatedFinal.equipment.resuscitation.venousAirEmbolismFraction).toBeGreaterThan(0.85);
    expect(treatedFinal.state.etco2MmHg).toBeGreaterThan(untreatedFinal.state.etco2MmHg + 10);
  });

  it('rejects source control before onset, unsupported methods, and duplicates', () => {
    const subject = engine();
    subject.step();
    subject.apply({ tick: subject.tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' } });
    expect(subject.step().equipment.resuscitation.venousAirEntryControlled).toBe(false);
    advance(subject, ONSET);
    subject.apply({ tick: subject.tick, type: 'control-venous-air-entry', payload: { method: 'guess' } });
    expect(subject.step().equipment.resuscitation.venousAirEntryControlled).toBe(false);
    subject.apply({ tick: subject.tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' } });
    expect(subject.step().equipment.resuscitation.venousAirEntryControlled).toBe(true);
    subject.apply({ tick: subject.tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' } });
    expect(subject.step().events.some((entry) => entry.eventId.startsWith('venous-air-entry-control-refused-')))
      .toBe(true);
  });

  it('replays the accepted response deterministically', () => {
    const run = () => {
      const subject = engine();
      advance(subject, ONSET + 100);
      subject.apply({ tick: subject.tick, type: 'call-for-help', payload: { context: 'venous-air-embolism' } });
      subject.apply({ tick: subject.tick, type: 'control-venous-air-entry', payload: { method: 'stop-entry' } });
      subject.apply({ tick: subject.tick, type: 'ventilator', payload: {
        fio2: 1, delivering: true, tidalVolumeMl: 500, respiratoryRateBpm: 12,
      } });
      return advance(subject, 900);
    };
    expect(run()).toEqual(run());
  });
});

const history = [
  { tick: ONSET, state: { etco2MmHg: 16, spo2Percent: 91 }, concentrations: [] },
  { tick: ONSET + 600, state: { etco2MmHg: 30, spo2Percent: 96 }, concentrations: [] },
] as never;

function event(eventId: string, tick: number, data?: EngineEvent['data']): EngineEvent {
  return { tick, eventId, category: 'crisis', data, severity: 'warning', message: eventId };
}

function finding(
  objectiveId: string, actions: readonly LearnerAction[], log: readonly EngineEvent[],
) {
  return objectiveFindings(SCENARIO, history, 0, 0, actions, log)
    .find((entry) => entry.objectiveId === objectiveId)!;
}

describe('venous-air-embolism debrief uses accepted response state', () => {
  const actions: LearnerAction[] = [
    { tick: 640, type: 'ventilator', payload: { fio2: 1 } },
    { tick: 650, type: 'ventilator', payload: {
      delivering: true, tidalVolumeMl: 500, respiratoryRateBpm: 12,
    } },
  ];
  const log: EngineEvent[] = [
    event('airway-help-requested-620', 620, { context: 'venous-air-embolism' }),
    event('venous-air-entry-controlled-630', 630, { method: 'stop-entry' }),
  ];

  it('scores escalation, source control, oxygen support, and observed recovery', () => {
    for (const objectiveId of SCENARIO.metadata.objectives.map((entry) => entry.id)) {
      expect(finding(objectiveId, actions, log).outcome, objectiveId).toBe('met');
    }
  });

  it('does not credit a raw source-control request without an accepted engine event', () => {
    const hostile: LearnerAction[] = [{
      tick: 630, type: 'control-venous-air-entry', payload: { method: 'stop-entry' },
    }];
    expect(finding('control-venous-air-entry', hostile, []).outcome).toBe('not-met');
    expect(finding('reassess-venous-air-recovery', hostile, []).outcome).toBe('not-met');
  });
});
