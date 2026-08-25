import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { BLOOD_BANK_HANDOFF as SCENARIO } from '@anesthesia/scenarios/blood-bank-handoff';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const engine = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: 515, practiceRegion: 'US' });

function run(mode: 'expert' | 'none' | 'out-of-order') {
  const subject = engine();
  const actions: LearnerAction[] = [];
  const events: EngineEvent[] = [];
  const history: { tick: number; state: Readonly<Record<string, number>>;
    concentrations: never[]; attribution: never[]; alarms: never[] }[] = [];
  let result = subject.step();
  for (let index = 1; index < 3600; index += 1) {
    const apply = (action: LearnerAction) => { actions.push(action); subject.apply(action); };
    if (subject.tick === 601 && mode === 'out-of-order') {
      apply({ tick: subject.tick, type: 'blood-product', payload: {
        productId: 'packed-red-blood-cells', units: 2,
      } });
    }
    if (subject.tick === (mode === 'out-of-order' ? 602 : 601) && mode !== 'none') {
      apply({ tick: subject.tick, type: 'blood-bank-request', payload: {} });
    }
    if (subject.tick === (mode === 'out-of-order' ? 603 : 900) && mode !== 'none') {
      apply({ tick: subject.tick, type: 'blood-product', payload: {
        productId: 'packed-red-blood-cells', units: 2,
      } });
    }
    result = subject.step();
    events.push(...result.events);
    if (subject.tick % 10 === 0) {
      history.push({
        tick: subject.tick, state: result.state,
        concentrations: [], attribution: [], alarms: [],
      });
    }
  }
  return { subject, result, actions, events, history };
}

describe('Requirement: the blood-bank handoff is ordered and bounded', () => {
  it('validates, registers, maps every objective, and starts in established maintenance', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIOS).toHaveLength(30);
    const subject = engine();
    expect(subject.equipment()).toMatchObject({
      airway: { intubated: true, device: 'tracheal-tube' },
      ventilator: { delivering: true, sevofluranePercent: 1.2 },
      resuscitation: { bloodProductsReleased: false, packedRedBloodCellUnits: 0 },
    });
    const initial = subject.step();
    expect(initial.alarms).toEqual([]);
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
    const mapped = new Set(mappings.flatMap((entry) => entry.objectiveIds));
    for (const objective of SCENARIO.metadata.objectives) expect(mapped).toContain(objective.id);
  });

  it('records release, fixed-unit response, and deterministic recovery', () => {
    const first = run('expert');
    const replay = run('expert');
    expect(first.events.map((entry) => entry.eventId)).toEqual(expect.arrayContaining([
      'blood-bank-release-601', 'blood-product-packed-red-blood-cells-900',
    ]));
    expect(first.result.equipment.resuscitation).toMatchObject({
      bloodProductsReleased: true, packedRedBloodCellUnits: 2, bloodProductTotalMl: 600,
    });
    expect(first.result.state.bloodVolumeMl).toBeCloseTo(4400, 6);
    expect(first.result.state.hemoglobinGPerDl).toBeCloseTo(11.4000816382, 6);
    expect(first.result.state.meanArterialMmHg).toBeCloseTo(68.2278060172, 6);
    expect(replay.result).toEqual(first.result);
  });

  it('scores expert, no-action, and out-of-order transcripts differently', () => {
    const findings = (mode: 'expert' | 'none' | 'out-of-order') => {
      const session = run(mode);
      return objectiveFindings(
        SCENARIO, session.history as never, 0, 0, session.actions, session.events,
      );
    };
    expect(findings('expert').map((entry) => entry.outcome)).toEqual(['met', 'met', 'met']);
    expect(findings('none').map((entry) => entry.outcome)).toEqual([
      'not-met', 'not-met', 'not-met',
    ]);
    expect(findings('out-of-order').find((entry) => entry.objectiveId === 'use-released-red-cells')?.outcome)
      .toBe('partly-met');
  });
});
