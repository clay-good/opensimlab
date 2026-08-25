import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { PREECLAMPSIA_URGENT_DELIVERY as SCENARIO } from '@anesthesia/scenarios/preeclampsia-urgent-delivery';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

function engine() {
  return new AnesthesiaEngine({ scenario: SCENARIO, seed: 31, practiceRegion: 'US' });
}

function advance(subject: AnesthesiaEngine, ticks: number) {
  let result = subject.step();
  for (let tick = 1; tick < ticks; tick += 1) result = subject.step();
  return result;
}

describe('bounded preeclampsia response before urgent delivery', () => {
  it('validates, registers the 28th scenario, cites current guidance, and maps every objective', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(34);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('reaffirmed 2026');
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    expect(mapped).toEqual(new Set(SCENARIO.metadata.objectives.map((entry) => entry.id)));
  });

  it('confirms severe pressure, accepts the bounded bundle, and produces an observable response', () => {
    const subject = engine();
    const baseline = subject.step();
    expect(baseline.state.systolicMmHg).toBeCloseTo(164.6271377763, 8);
    expect(baseline.state.diastolicMmHg).toBeCloseTo(120.1864311119, 8);

    subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
      action: 'repeat-blood-pressure',
    } });
    const confirmation = subject.step();
    expect(confirmation.events.some((entry) =>
      entry.eventId.startsWith('preeclampsia-blood-pressure-'))).toBe(true);

    subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
      action: 'labetalol-20mg-iv',
    } });
    subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
      action: 'magnesium-sulfate-4g-iv',
    } });
    const accepted = subject.step();
    expect(accepted.equipment.resuscitation.labetalolTotalMg).toBe(20);
    expect(accepted.equipment.resuscitation.magnesiumSulfateTotalG).toBe(4);
    expect(accepted.events.find((entry) => entry.eventId.startsWith('magnesium-sulfate-iv-'))
      ?.data?.antihypertensive).toBe(false);

    const response = advance(subject, 600);
    expect(response.state.systolicMmHg).toBeLessThan(160);
    expect(response.state.diastolicMmHg).toBeLessThan(110);
    expect(response.state.meanArterialMmHg).toBeGreaterThan(65);
    subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
      action: 'repeat-blood-pressure',
    } });
    const reassessed = subject.step();
    expect(reassessed.equipment.resuscitation.preeclampsiaBloodPressureChecks).toBe(2);
    expect(reassessed.equipment.resuscitation.lastPreeclampsiaBloodPressure?.systolicMmHg)
      .toBeCloseTo(response.state.systolicMmHg, 8);
  });

  it('does not give magnesium an antihypertensive effect', () => {
    const run = (includeMagnesium: boolean) => {
      const subject = engine();
      subject.step();
      subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
        action: 'repeat-blood-pressure',
      } });
      subject.step();
      subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
        action: 'labetalol-20mg-iv',
      } });
      if (includeMagnesium) subject.apply({
        tick: subject.tick, type: 'preeclampsia-response',
        payload: { action: 'magnesium-sulfate-4g-iv' },
      });
      return advance(subject, 600).state;
    };
    expect(run(true)).toEqual(run(false));
  });

  it('rejects treatment before confirmation, duplicate doses, unsupported actions, and other scenarios', () => {
    const subject = engine();
    subject.step();
    for (const action of ['labetalol-20mg-iv', 'magnesium-sulfate-4g-iv']) {
      subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: { action } });
    }
    let result = subject.step();
    expect(result.equipment.resuscitation.labetalolTotalMg).toBe(0);
    expect(result.equipment.resuscitation.magnesiumSulfateTotalG).toBe(0);
    subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
      action: 'repeat-blood-pressure',
    } });
    subject.step();
    for (const action of [
      'labetalol-20mg-iv', 'labetalol-20mg-iv',
      'magnesium-sulfate-4g-iv', 'magnesium-sulfate-4g-iv', 'invented-agent',
    ]) subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: { action } });
    result = subject.step();
    expect(result.equipment.resuscitation.labetalolTotalMg).toBe(20);
    expect(result.equipment.resuscitation.magnesiumSulfateTotalG).toBe(4);
    expect(result.events.filter((entry) => entry.eventId.includes('refused')).length)
      .toBeGreaterThanOrEqual(3);

    const unsupported = new AnesthesiaEngine({
      scenario: SCENARIOS[0]!, seed: 31, practiceRegion: 'US',
    });
    unsupported.step();
    unsupported.apply({ tick: unsupported.tick, type: 'preeclampsia-response', payload: {
      action: 'repeat-blood-pressure',
    } });
    expect(unsupported.step().equipment.resuscitation.preeclampsiaBloodPressureChecks).toBe(0);
  });

  it('replays the accepted sequence deterministically', () => {
    const run = () => {
      const subject = engine();
      subject.step();
      subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
        action: 'repeat-blood-pressure',
      } });
      subject.step();
      subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
        action: 'labetalol-20mg-iv',
      } });
      subject.apply({ tick: subject.tick, type: 'preeclampsia-response', payload: {
        action: 'magnesium-sulfate-4g-iv',
      } });
      return advance(subject, 600);
    };
    expect(run()).toEqual(run());
  });
});

const history = [
  { tick: 0, state: { systolicMmHg: 165, diastolicMmHg: 120, meanArterialMmHg: 135 }, concentrations: [] },
  { tick: 700, state: { systolicMmHg: 143, diastolicMmHg: 104, meanArterialMmHg: 117 }, concentrations: [] },
] as never;

function event(eventId: string, tick: number, data: EngineEvent['data']): EngineEvent {
  return { tick, eventId, category: 'maternal-response', data, severity: 'warning', message: eventId };
}

describe('preeclampsia debrief uses accepted actions and observed reassessment', () => {
  const log = [
    event('preeclampsia-blood-pressure-10', 10, {
      systolicMmHg: 165, diastolicMmHg: 120, meanArterialMmHg: 135,
    }),
    event('labetalol-iv-20', 20, { doseMg: 20 }),
    event('magnesium-sulfate-iv-21', 21, {
      doseG: 4, indication: 'seizure-prophylaxis', antihypertensive: false,
    }),
    event('preeclampsia-blood-pressure-620', 620, {
      systolicMmHg: 143, diastolicMmHg: 104, meanArterialMmHg: 117,
    }),
  ];

  it('credits the full accepted confirmation-to-reassessment sequence', () => {
    const findings = objectiveFindings(SCENARIO, history, 0, 0, [], log);
    for (const objective of SCENARIO.metadata.objectives) {
      expect(findings.find((entry) => entry.objectiveId === objective.id)?.outcome,
        objective.id).toBe('met');
    }
  });

  it('does not credit raw requests without accepted engine events', () => {
    const hostile: LearnerAction[] = [
      { tick: 10, type: 'preeclampsia-response', payload: { action: 'repeat-blood-pressure' } },
      { tick: 20, type: 'preeclampsia-response', payload: { action: 'labetalol-20mg-iv' } },
      { tick: 21, type: 'preeclampsia-response', payload: { action: 'magnesium-sulfate-4g-iv' } },
    ];
    const findings = objectiveFindings(SCENARIO, history, 0, 0, hostile, []);
    expect(findings.every((entry) => entry.outcome !== 'met')).toBe(true);
  });
});
