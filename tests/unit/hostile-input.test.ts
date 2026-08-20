/**
 * The engine and the review path against input they did not produce.
 *
 * Every value here arrives from somewhere this code does not control: a free-text
 * dose field, a URL, or a transcript file an instructor was handed. The rule is
 * that bad input produces a message, never a hang and never a patient whose
 * physiology has been quietly destroyed.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, VENTILATOR_BOUNDS } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { MAX_REPLAY_TICKS, replay } from '@anesthesia/debrief/replay';
import {
  MAX_TRANSCRIPT_ACTIONS, UnreadableTranscript, parseTranscript,
} from '@anesthesia/debrief/analyse-transcript';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';

const engine = () => new AnesthesiaEngine({
  scenario: ROUTINE_INDUCTION as never, seed: 1, practiceRegion: 'US',
});

const transcript = (over: Record<string, unknown>) => JSON.stringify({
  format: 'opensimlab.transcript',
  formatVersion: 1,
  notForClinicalUse: 'x',
  moduleId: 'anesthesia',
  scenarioId: 'routine-induction',
  versions: { engine: 't', content: '0.1.0', modelSet: 't', scenario: '0.1.0' },
  practiceRegion: 'US',
  seed: 1,
  guidanceLevel: 'coached',
  actions: [],
  ticks: 600,
  stateTraceHash: 'x',
  ...over,
});

describe('Requirement: A Bad Number Cannot Destroy The Patient', () => {
  it('Scenario: a dose that is not a number gives nothing and says so', () => {
    // NaN used to propagate into the compartment solver and come out as a
    // patient with a mean arterial pressure of zero — a corpse that looked like
    // physiology rather than like the bad input it was.
    for (const amount of [NaN, Infinity, -Infinity, -50]) {
      const subject = engine();
      subject.apply({
        tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount, unit: 'mg' },
      } as unknown as LearnerAction);
      const state = subject.step().state;
      expect(state.meanArterialMmHg, `dose ${amount}`).toBeGreaterThan(70);
      expect(state.depthIndex, `dose ${amount}`).toBeGreaterThan(80);
      expect(state.heartRateBpm, `dose ${amount}`).toBeGreaterThan(40);
    }
  });

  it('Scenario: the refusal is logged where the learner will see it', () => {
    const subject = engine();
    subject.apply({
      tick: 0, type: 'bolus', payload: { drugId: 'propofol', amount: NaN, unit: 'mg' },
    } as unknown as LearnerAction);
    const events = subject.step().events;
    expect(events.some((event) => event.message.includes('is not a number'))).toBe(true);
  });

  it('Scenario: an infusion rate that is not a number leaves the rate alone', () => {
    const subject = engine();
    subject.apply({
      tick: 0, type: 'infusion', payload: { drugId: 'remifentanil', rate: NaN, unit: 'µg/kg/min' },
    } as unknown as LearnerAction);
    subject.step();
    expect(subject.equipment().drugs.every((drug) => Number.isFinite(drug.infusionRate))).toBe(true);
  });

  it('Scenario: ventilator settings are clamped to what a machine delivers', () => {
    const subject = engine();
    subject.apply({
      tick: 0,
      type: 'ventilator',
      payload: {
        fio2: NaN, tidalVolumeMl: -999, respiratoryRateBpm: 1e6,
        delivering: true, mode: 'volume-control',
      },
    } as unknown as LearnerAction);
    subject.step();
    const ventilator = subject.equipment().ventilator;
    // A respiratory rate of a million is arithmetic, not ventilation.
    expect(ventilator.respiratoryRateBpm).toBeLessThanOrEqual(VENTILATOR_BOUNDS.respiratoryRateBpm.max);
    expect(ventilator.tidalVolumeMl).toBeGreaterThanOrEqual(0);
    // A non-numeric inspired fraction is ignored rather than applied.
    expect(ventilator.fio2).toBeGreaterThanOrEqual(VENTILATOR_BOUNDS.fio2.min);
  });

  it('Scenario: an action for a drug that is not in the formulary is ignored', () => {
    const subject = engine();
    expect(() => {
      subject.apply({
        tick: 0, type: 'bolus', payload: { drugId: 'ketamine', amount: 100, unit: 'mg' },
      } as unknown as LearnerAction);
      subject.step();
    }).not.toThrow();
  });

  it('Scenario: every scenario stays finite over thirty untouched simulated minutes', () => {
    for (const scenario of SCENARIOS) {
      const subject = new AnesthesiaEngine({ scenario: scenario as never, seed: 3, practiceRegion: 'US' });
      let last = subject.step();
      for (let tick = 0; tick < 30 * 60 * 10; tick += 1) last = subject.step();
      const nonFinite = Object.entries(last.state).filter(([, value]) => !Number.isFinite(value));
      expect(nonFinite, `${scenario.metadata.id} produced non-finite state`).toEqual([]);
    }
  });
});

describe('Requirement: A Submitted File Cannot Lock Up The Reviewer', () => {
  it('Scenario: a transcript claiming an impossible session is refused, fast', () => {
    // This one hung a browser tab forever: fifty million ticks were replayed
    // one at a time. An instructor opening a corrupt submission gets a message.
    const started = Date.now();
    expect(() => parseTranscript(transcript({ ticks: 50_000_000 }), 'huge.json'))
      .toThrow(UnreadableTranscript);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('Scenario: a non-numeric or negative tick count is refused', () => {
    for (const ticks of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => parseTranscript(transcript({ ticks }), 'bad.json'), String(ticks))
        .toThrow(UnreadableTranscript);
    }
  });

  it('Scenario: an implausible number of actions is refused', () => {
    const actions = Array.from({ length: MAX_TRANSCRIPT_ACTIONS + 1 }, (_unused, index) => ({
      tick: index, type: 'bolus', payload: { drugId: 'propofol', amount: 1, unit: 'mg' },
    }));
    expect(() => parseTranscript(transcript({ actions }), 'many.json'))
      .toThrow(/far more than a session can contain/);
  });

  it('Scenario: replay itself is bounded, whatever it is asked for', () => {
    // The ceiling is enforced in the function, not only at the parse boundary,
    // because replay is called from the debrief and the counterfactuals too.
    const history = replay([], {
      scenario: ROUTINE_INDUCTION as never,
      seed: 1,
      practiceRegion: 'US',
      ticks: Number.POSITIVE_INFINITY,
    });
    expect(history).toEqual([]);
    expect(MAX_REPLAY_TICKS).toBeLessThanOrEqual(8 * 60 * 60 * 10);
  });
});

describe('Requirement: An Empty Session Still Debriefs', () => {
  it('Scenario: a learner who starts and immediately stops gets findings, not a crash', () => {
    const findings = objectiveFindings(ROUTINE_INDUCTION as never, [], 0, 0);
    expect(findings).toHaveLength(ROUTINE_INDUCTION.metadata.objectives.length);
    for (const finding of findings) expect(finding.finding.length).toBeGreaterThan(0);
  });
});
