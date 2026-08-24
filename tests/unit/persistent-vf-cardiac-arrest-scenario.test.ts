import { describe, expect, it } from 'vitest';
import { PERSISTENT_VF_CARDIAC_ARREST as SCENARIO } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { SCENARIOS } from '@anesthesia/scenarios';
import { validateScenario } from '@anesthesia/scenarios/schema';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { EngineEvent } from '@platform/kernel/protocol';

describe('persistent VF cardiac-arrest scenario', () => {
  it('validates, registers, and declares the bounded third-cycle handoff', () => {
    expect(validateScenario(SCENARIO)).toEqual([]);
    expect(SCENARIOS).toContain(SCENARIO);
    expect(SCENARIO.metadata.estimatedMinutes).toBeLessThan(20);
    expect(SCENARIO.metadata.clinicalReview.sources.join(' ')).toContain('American Heart Association');
    const briefing = SCENARIO.timeline[0]!.message!;
    for (const phrase of ['two unsuccessful', '1 mg IV/IO', '200 J', 'post-arrest care']) {
      expect(briefing).toContain(phrase);
    }
  });

  it('keeps all unmodeled arrest branches explicit', () => {
    expect(SCENARIO.metadata.limitations).toEqual(expect.arrayContaining([
      'cardiac-arrest-response-is-bounded', 'cardiac-arrest-actions-are-screen-proxies',
      'no-post-cardiac-arrest-care', 'no-team-or-communication',
    ]));
  });
});

describe('persistent VF debrief', () => {
  const history = [{ tick: 900, state: {}, concentrations: [] }] as never;
  const event = (eventId: string, tick: number, data?: EngineEvent['data']): EngineEvent => ({
    eventId, tick, data, severity: 'critical', category: 'resuscitation', message: eventId,
  });
  const accepted = [
    event('chest-compressions-start-310', 310, { active: true, ratePerMin: 110 }),
    event('cardiac-arrest-epinephrine-320', 320, { doseMg: 1, route: 'iv' }),
    event('defibrillation-330', 330, {
      energyJ: 200, rhythmBefore: 'ventricular-fibrillation', converted: true,
    }),
    event('rosc-330', 330, { rhythm: 'sinus' }),
  ];
  const finding = (id: string, log = accepted) => objectiveFindings(
    SCENARIO, history, 0, 0, [], log,
  ).find((entry) => entry.objectiveId === id)!;

  it('scores only accepted engine events', () => {
    expect(finding('resume-arrest-compressions').outcome).toBe('met');
    expect(finding('give-arrest-epinephrine').outcome).toBe('met');
    expect(finding('defibrillate-persistent-vf').outcome).toBe('met');
    expect(finding('avoid-shocking-nonshockable-rhythm').outcome).toBe('met');
    expect(finding('defibrillate-persistent-vf', []).outcome).toBe('not-met');
  });

  it('records a shock to asystole as not met', () => {
    const log = [...accepted, event('defibrillation-400', 400, {
      energyJ: 200, rhythmBefore: 'asystole', converted: false,
    })];
    expect(finding('avoid-shocking-nonshockable-rhythm', log).outcome).toBe('not-met');
  });
});
