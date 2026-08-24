import { describe, expect, it } from 'vitest';
import { LOCAL_ANESTHETIC_SYSTEMIC_TOXICITY as SCENARIO } from '@anesthesia/scenarios/local-anesthetic-systemic-toxicity';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';

const ONSET = 600;
const history = [{
  tick: ONSET + 600,
  state: { spo2Percent: 98, meanArterialMmHg: 72 }, concentrations: [],
}] as never;

function logEvent(eventId: string, tick: number, data?: EngineEvent['data']): EngineEvent {
  return { tick, eventId, data, severity: 'warning', category: 'drug', message: eventId };
}

function finding(id: string, actions: readonly LearnerAction[], log: readonly EngineEvent[]) {
  return objectiveFindings(SCENARIO, history, 0, 0, actions, log)
    .find((entry) => entry.objectiveId === id)!;
}

describe('bounded local-anesthetic systemic-toxicity scenario', () => {
  it('validates, registers, cites ASRA 2020, and does not leak a diagnosis in the live event', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.estimatedMinutes).toBeLessThan(20);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('PMID 33148630');
    const live = SCENARIO.timeline.find((event) => event.id === 'bupivacaine-exposure')!;
    expect(live.type).toBe('local-anesthetic-toxicity');
    expect(live.target).toBe('bupivacaine');
    expect(live.message?.toLowerCase()).not.toContain('systemic toxicity');
    expect(live.message?.toLowerCase()).not.toContain('last');
  });

  it('makes every ASRA checklist step and every excluded branch explicit', () => {
    const briefing = SCENARIO.timeline[0]!.message!;
    for (const phrase of [
      'manage the airway', 'benzodiazepine', 'smaller-than-normal epinephrine',
      'vasopressin', 'beta blockers', 'calcium-channel blockers',
      'further local anesthetic', '20% lipid emulsion',
    ]) expect(briefing).toContain(phrase);
    expect(SCENARIO.metadata.limitations).toEqual(expect.arrayContaining([
      'last-syndrome-is-a-teaching-model', 'last-initial-response-only',
      'no-regional-anaesthesia', 'no-team-or-communication',
    ]));
  });

  it('maps its objectives into every supported framework', () => {
    const mappings = SCENARIO_MAPPINGS.filter((entry) => entry.scenarioId === SCENARIO.metadata.id);
    expect(new Set(mappings.map((entry) => entry.frameworkId))).toEqual(new Set([
      'nbcrna-nce', 'coa-standards', 'acgme-anesthesiology-milestones-2',
    ]));
  });
});

describe('LAST debrief uses accepted engine events', () => {
  const acceptedLog: EngineEvent[] = [
    logEvent('seizure-suppression-650', 650),
    logEvent('lipid-emulsion-660', 660, {
      concentrationPercent: 20, initialBolusMl: 90, infusionMlPerMin: 15,
      maxTotalMl: 720, weightBand: 'under-70-kg', teachingModel: true,
    }),
    logEvent('epinephrine-iv-670', 670, {
      doseMicrograms: 50, route: 'iv', teachingModel: true,
    }),
  ];
  const actions: LearnerAction[] = [
    { tick: 620, type: 'ventilator', payload: { fio2: 1 } },
    { tick: 630, type: 'ventilator', payload: { delivering: true } },
  ];

  it('recognizes the prompt response without claiming diagnostic proof', () => {
    const result = finding('recognize-last-pattern', actions, acceptedLog);
    expect(result.outcome).toBe('met');
    expect(result.finding).toContain('do not prove a diagnosis');
  });

  it('requires both active oxygen delivery and an accepted benzodiazepine action', () => {
    expect(finding('support-last-airway-and-seizure', actions, acceptedLog).outcome).toBe('met');
    expect(finding('support-last-airway-and-seizure', actions, []).outcome).toBe('partly-met');
  });

  it('does not call zero-volume or zero-rate settings active ventilation', () => {
    const zeroDelivery: LearnerAction[] = [{
      tick: 620, type: 'ventilator', payload: {
        fio2: 1, delivering: true, tidalVolumeMl: 0, respiratoryRateBpm: 0,
      },
    }];
    const result = finding('support-last-airway-and-seizure', zeroDelivery, acceptedLog);
    expect(result.outcome).toBe('partly-met');
    expect(result.finding).toContain('were not both in effect');
  });

  it('scores the exact weight-banded lipid protocol and reduced epinephrine from accepted events', () => {
    const lipid = finding('start-last-lipid', actions, acceptedLog);
    expect(lipid.outcome).toBe('met');
    expect(lipid.finding).toContain('90 mL initial bolus');
    expect(lipid.finding).toContain('15.0 mL/min');
    const epinephrine = finding('use-reduced-last-epinephrine', actions, acceptedLog);
    expect(epinephrine.outcome).toBe('met');
    expect(epinephrine.finding).toContain('0.83 micrograms/kg');
  });

  it('does not give credit for hostile raw actions the engine refused', () => {
    const hostile: LearnerAction[] = [{
      tick: 620, type: 'lipid-emulsion', payload: {
        route: 'iv', protocol: 'initial', concentrationPercent: Number.NaN,
      },
    }];
    expect(finding('start-last-lipid', hostile, []).outcome).toBe('not-met');
  });
});
