/**
 * facilitator-toolkit → PEARLS-phase prompts generated per objective from
 * attribution, snapshot-tested for structure.
 *
 * The structure is the claim here. A debrief question built from a model's own
 * attribution is useful exactly as long as it keeps saying "the model
 * attributed" rather than "you caused", and asks something rather than
 * concluding it.
 */
import { describe, expect, it } from 'vitest';
import { pearlsAnalysisPrompts } from '@anesthesia/debrief/pearls-prompts';
import type { Attribution } from '@platform/kernel/protocol';

const term = (label: string, share: number, teachingModel = false) => ({
  termId: label.toLowerCase().replace(/\s+/g, '-'), label, contribution: -12, share, teachingModel,
});
const attribution = (variable: string, ...terms: ReturnType<typeof term>[]): Attribution =>
  ({ variable, terms });

const findings = [
  { objectiveId: 'manage-hypotension', statement: 'Treat the mechanism, not the number', outcome: 'met', atTick: 1800 },
  { objectiveId: 'preoxygenate', statement: 'Preoxygenate before induction', outcome: 'not-met' },
];

const lookup = (map: Record<number, Attribution[]>) => (tick: number) => map[tick] ?? [];

describe('PEARLS prompts built from this run', () => {
  it('names the moment, the variable, the term and its share, and asks a question', () => {
    const [first] = pearlsAnalysisPrompts(findings, lookup({
      1800: [attribution('meanArterialMmHg', term('Propofol vasodilation', 0.62))],
    }));
    expect(first!.prompt).toContain('00:03:00');
    expect(first!.prompt).toContain('62%');
    expect(first!.prompt).toContain('meanArterialMmHg');
    expect(first!.prompt).toContain('Propofol vasodilation');
    expect(first!.prompt.endsWith('?')).toBe(true);
    expect(first!.teachingModel).toBe(false);
  });

  /**
   * The attribution ranks the model's own terms. A prompt that said "because
   * you gave propofol" would assert a cause the attribution does not claim.
   */
  it('says what the model attributed, never what the learner caused', () => {
    const prompts = pearlsAnalysisPrompts(findings, lookup({
      1800: [attribution('meanArterialMmHg', term('Propofol vasodilation', 0.62))],
    }));
    for (const prompt of prompts) {
      expect(prompt.prompt).not.toMatch(/\bbecause you\b|\byou caused\b|\byour fault\b/i);
      expect(prompt.prompt).not.toMatch(/\bwell\b|\bbetter\b|\bworse\b|\bscore\b|\bcorrect\b/i);
    }
  });

  /** A teaching model's term says so, because it changes how far the reasoning goes. */
  it('marks a term that comes from a teaching model rather than a published one', () => {
    const [first] = pearlsAnalysisPrompts(findings, lookup({
      1800: [attribution('meanArterialMmHg', term('Reflex compensation', 0.4, true))],
    }));
    expect(first!.teachingModel).toBe(true);
    expect(first!.prompt).toMatch(/teaching models rather than a published one/);
  });

  /** Silence at the moment measured is a fact about the run, not a gap to fill. */
  it('asks an open question where the model attributed nothing', () => {
    const prompts = pearlsAnalysisPrompts(findings, lookup({}));
    for (const prompt of prompts) {
      expect(prompt.prompt).toMatch(/attributed nothing at the moment this was measured/);
      expect(prompt.teachingModel).toBe(false);
    }
  });

  it('keeps one prompt per objective, in the order it was given them', () => {
    const prompts = pearlsAnalysisPrompts(findings, lookup({}));
    expect(prompts.map((prompt) => prompt.objectiveId))
      .toEqual(['manage-hypotension', 'preoxygenate']);
  });
});
