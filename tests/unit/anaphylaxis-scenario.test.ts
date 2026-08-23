import { describe, expect, it } from 'vitest';
import { PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC } from '@anesthesia/scenarios/perioperative-anaphylaxis-after-antibiotic';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';

const ONSET = 1800;
const sample = (tick: number, spo2Percent = 98) => ({
  tick, state: { spo2Percent, meanArterialMmHg: 55 },
  concentrations: [], attribution: [], alarms: [],
}) as never;

function advance(subject: AnesthesiaEngine, targetTick: number) {
  let result = subject.step();
  while (result.tick < targetTick) result = subject.step();
  return result;
}

function finding(id: string, actions: readonly LearnerAction[], history = [sample(ONSET + 1200)]) {
  return objectiveFindings(
    PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC, history, 0, 0, actions,
  ).find((entry) => entry.objectiveId === id)!;
}

describe('Requirement: antibiotic-triggered perioperative anaphylaxis is a complete bundled case', () => {
  it('validates, is registered, begins as induction, and names cefazolin rather than a blocker', () => {
    expect(validateScenario(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC)).toEqual([]);
    expect(SCENARIOS).toContain(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC);
    expect(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.equipment.ventilator.delivering).toBe(false);
    expect(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.timeline).toContainEqual(
      expect.objectContaining({
        id: 'cefazolin-exposure', type: 'anaphylaxis', target: 'cefazolin', value: 0.9,
      }),
    );
    expect(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.formulary.some(
      (entry) => entry.drugId === 'rocuronium' || entry.drugId === 'succinylcholine',
    )).toBe(false);
  });

  it('uses NAP6 figures and declares the diagnostic and treatment boundaries', () => {
    const sources = PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.metadata.clinicalReview.sources.join(' ');
    const briefing = PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.timeline[0]!.message!;
    expect(sources).toContain('PMID 29935567');
    expect(sources).toContain('PMID 29935569');
    expect(briefing).toContain('1 in 10,000');
    expect(briefing).toContain('hypotension was the first feature in 46%');
    expect(briefing).toContain('94 versus 65 of 199');
    expect(PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.metadata.limitations).toEqual(
      expect.arrayContaining([
        'anaphylaxis-syndrome-is-a-teaching-model',
        'no-cutaneous-signs-or-tryptase',
        'anaphylaxis-initial-treatment-only',
      ]),
    );
  });

  it('maps declared objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter(
      (entry) => entry.scenarioId === PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC.metadata.id,
    );
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
  });

  it('runs the bundled exposure and records the competent initial treatment bundle', () => {
    const subject = new AnesthesiaEngine({
      scenario: PERIOPERATIVE_ANAPHYLAXIS_AFTER_ANTIBIOTIC,
      seed: 20260823,
      practiceRegion: 'US',
    });
    subject.apply({ tick: 0, type: 'ventilator', payload: { fio2: 1, delivering: true } });
    let result = advance(subject, ONSET);
    expect(result.equipment.lastExposure).toEqual({ agentId: 'cefazolin', tick: ONSET });
    subject.apply({
      tick: subject.tick, type: 'epinephrine', payload: { route: 'iv', doseMicrograms: 50 },
    });
    subject.apply({
      tick: subject.tick, type: 'fluid',
      payload: { fluidId: 'balanced-crystalloid', volumeMl: 1000 },
    });
    result = advance(subject, ONSET + 600);
    expect(result.equipment.resuscitation).toMatchObject({
      epinephrineTotalMicrograms: 50, crystalloidTotalMl: 1000,
    });
    expect(result.equipment.airway.bronchospasmSeverity).toBeLessThan(0.9);
  });
});

describe('Requirement: anaphylaxis debrief scores accepted actions without diagnosing', () => {
  it('ignores hostile epinephrine before the valid 50 microgram IV action', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 10, type: 'epinephrine', payload: { route: 'im', doseMicrograms: 50 } },
      { tick: ONSET + 20, type: 'epinephrine', payload: { route: 'iv', doseMicrograms: 100 } },
      { tick: ONSET + 100, type: 'epinephrine', payload: { route: 'iv', doseMicrograms: 50 } },
    ];
    expect(finding('give-initial-epinephrine', actions).outcome).toBe('met');
    expect(finding('give-initial-epinephrine', actions).finding).toContain('50 micrograms');
    expect(finding('recognize-anaphylaxis-pattern', actions).finding).toContain('not proof');
  });

  it('sums only engine-acceptable balanced crystalloid actions', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 10, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: -500 } },
      { tick: ONSET + 20, type: 'fluid', payload: { fluidId: 'unknown', volumeMl: 1000 } },
      { tick: ONSET + 30, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 } },
      { tick: ONSET + 40, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl: 500 } },
    ];
    expect(finding('support-anaphylaxis-circulation', actions).outcome).toBe('met');
    expect(finding('support-anaphylaxis-circulation', actions).finding).toContain('1000 mL');
  });

  it('reconstructs oxygen and delivery from separate controls and reports saturation honestly', () => {
    const actions: LearnerAction[] = [
      { tick: ONSET + 10, type: 'ventilator', payload: { fio2: 1 } },
      { tick: ONSET + 20, type: 'ventilator', payload: { delivering: true } },
    ];
    const result = finding('support-anaphylaxis-oxygenation', actions, [
      sample(ONSET, 98), sample(ONSET + 400, 94),
    ]);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('does not establish a definitive diagnosis');
  });

  it('does not score objectives before exposure', () => {
    expect(finding('give-initial-epinephrine', [], [sample(ONSET - 1)]).outcome)
      .toBe('not-exercised');
  });
});
