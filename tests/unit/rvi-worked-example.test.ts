/**
 * The worked example and observed-state tutor for a low pressure that must not
 * be treated the usual way.
 *
 * The reflexes both work against are the nitrate and the diuretic a hypotensive
 * chest-pain patient usually gets, and the pull of the interesting half of the
 * problem while a reperfusion clock is already running.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { RIGHT_VENTRICULAR_INFARCTION as SCENARIO } from '../../src/modules/cardiology/scenarios/right-ventricular-infarction';
import { RIGHT_VENTRICULAR_INFARCTION_FIXTURES as FIXTURES } from '../../src/modules/cardiology/right-ventricular-infarction-fixtures';
import {
  RIGHT_VENTRICULAR_INFARCTION_DEMONSTRATION_VERSION, rightVentricularInfarctionDemonstrationStep,
  supportsRightVentricularInfarctionDemonstration,
} from '../../src/modules/cardiology/demo/right-ventricular-infarction-demonstration';
import { rightVentricularInfarctionInlinePrompt } from '../../src/modules/cardiology/tutor/right-ventricular-infarction-guidance';
import type { RightVentricularInfarctionAction } from '../../src/modules/cardiology/right-ventricular-infarction';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.rightVentricularInfarctionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: RightVentricularInfarctionAction) => {
  engine.apply({ tick, type: 'right-ventricular-infarction-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = rightVentricularInfarctionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'right-ventricular-infarction-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps The Clock Running', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(RIGHT_VENTRICULAR_INFARCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRightVentricularInfarctionDemonstration(SCENARIO)).toBe(true);
    expect(supportsRightVentricularInfarctionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsRightVentricularInfarctionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.id !== 'right-ventricular-infarction-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps, reperfusion before the interesting half', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['trajectory', 'parallel', 'phenotype', 'support', 'handoff']);
    expect(patient.reconciledAtTick).toBeLessThan(patient.reperfusionAtTick!);
    expect(patient.reperfusionAtTick).toBeLessThan(patient.phenotypeAtTick!);
    expect(patient.phenotypeAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('names the kind of low pressure rather than calling it shock', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('preload-sensitive hypotension rather than declared shock');
    expect(trajectory).toContain('managed almost oppositely');
    expect(trajectory).toContain('none of them has been excluded');
  });

  it('says the interesting half is the half that eats the clock', () => {
    const parallel = narrations[beats.indexOf('parallel')]!;
    expect(parallel).toContain('quietly consume the time the other half does not have');
    expect(parallel).toContain('It is never a reason to pause it');
    // The example never reaches the beat for the lane it took, so the
    // reperfusion argument has to live here too.
    expect(parallel).toContain('inferior infarction and heart block travel together');
  });

  it('calls the findings a phenotype and carries the small LV forward', () => {
    const phenotype = narrations[beats.indexOf('phenotype')]!;
    expect(phenotype).toContain('not a diagnosis you have made');
    expect(phenotype).toContain('it is small because the right ventricle is not delivering');
  });

  it('refuses the two usual drugs without substituting an opposite recipe', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('the two drugs you would ordinarily reach for are the two to leave alone');
    expect(support).toContain('no universal pressure target and no universal prohibition either');
    expect(patient.nitrateSelected).toBe(false);
    expect(patient.diureticSelected).toBe(false);
    expect(patient.blindFluidLoading).toBe(false);
  });

  it('says unchanged is not a response', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('He is unchanged, which is not a response to anything');
    expect(narration).toContain('unchanged is the honest word');
    expect(narration).toContain('never stood in front of the clock');
    expect(patient.reperfusionCompleted).toBe(false);
  });

  it('never selects a nitrate, a diuretic, a volume, or a target, and never claims reperfusion', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give glyceryl trinitrate', 'give furosemide', 'give a litre of saline',
      'keep the map above 65', 'the vessel is open', 'start noradrenaline']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Will Not Let The Clock Wait', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['rvi-trajectory', 'rvi-parallel', 'rvi-phenotype', 'rvi-support', 'rvi-handoff']);
  });

  it('names the reperfusion lane when the phenotype went first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-right-ventricular-infarction');
    advance(engine, 1, 'review-right-ventricular-infarction-phenotype');
    const prompt = rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('rvi-reperfusion');
    expect(prompt.suggestion).toContain('the reperfusion pathway is still moving');
  });

  it('holds on the phenotype when support is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-right-ventricular-infarction');
    advance(engine, 1, 'preserve-right-ventricular-infarction-reperfusion');
    advance(engine, 2, 'record-right-ventricular-infarction-support');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    expect(rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('rvi-phenotype');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-right-ventricular-infarction-phenotype');
    expect(snapshot(engine)!.phenotypeAtTick).toBeNull();
    expect(rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('rvi-trajectory');
  });

  it('never selects a nitrate, a diuretic, or a target', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give glyceryl trinitrate', 'give furosemide', 'keep the map above 65']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(rightVentricularInfarctionInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(rightVentricularInfarctionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(rightVentricularInfarctionInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
