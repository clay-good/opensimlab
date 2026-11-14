/**
 * The radiology proposal's one load-bearing boundary: decisions, never
 * perception.
 *
 * This module is proposed on the claim that it teaches what people DO around an
 * image — managing a contrast reaction, communicating a critical result, running
 * a safe procedure — and never the reading of the image itself. That boundary is
 * what makes it honest on an engine that renders no pixels, and it is the first
 * thing a later author would erode, one scenario at a time, by proposing a
 * lesson where the learner is asked what the scan shows.
 *
 * So it is pinned here rather than left to the prose. The generic proposal
 * validator checks structure; this checks the promise.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { judgeProposal } from '../../scripts/module-proposals';
import { MODULE_PROPOSALS } from '@platform/modules/proposals';

const text = readFileSync(join(process.cwd(), 'docs/module-proposals/radiology.md'), 'utf8');
const judged = judgeProposal('radiology', text, () => false);

/**
 * The document is hard-wrapped, so a phrase that reads as one sentence may
 * carry a newline and two spaces in the middle. Matching prose means matching
 * the words, not the wrapping.
 */
const prose = text.replace(/\s+/g, ' ');

/** Each `### ` block's title and body. */
function scenarioBlocks(): { title: string; body: string }[] {
  const proposals = text.split(/^## Scenario proposals$/m)[1] ?? '';
  const upToNextSection = proposals.split(/^## /m)[0] ?? '';
  return upToNextSection.split(/^### /m).slice(1).map((part) => {
    const newline = part.indexOf('\n');
    return { title: part.slice(0, newline).trim(), body: part.slice(newline + 1) };
  });
}

describe('the radiology proposal', () => {
  it('is structurally complete: twelve proposals, every required section', () => {
    expect(judged.missingSections).toEqual([]);
    expect(judged.scenarios).toHaveLength(12);
    expect(judged.countingScenarios).toBe(12);
    expect(judged.refusals).toEqual([]);
  });

  /**
   * It claims less than it earns, which the validator allows in that direction
   * only. `breadth-test-passed` is earned by a person reviewing the twelve
   * against the training-value rule and the boundary below; nobody has.
   */
  it('claims proposed while structurally earning more', () => {
    expect(judged.status).toBe('proposed');
    expect(judged.earned).toBe('breadth-test-passed');
    expect(MODULE_PROPOSALS.find((proposal) => proposal.id === 'radiology'))
      .toMatchObject({ status: 'proposed', scenarioProposals: 12 });
  });

  it('states the non-interpretive boundary and what it puts out of scope', () => {
    expect(prose).toContain('decisions, never perception');
    expect(prose.toLowerCase()).toContain('never as an image to interpret');
    // The exclusion is named, not implied.
    expect(prose.toLowerCase()).toContain('detecting, localizing, or characterizing a finding from pixels');
  });

  /**
   * No proposal may ask the learner to read an image. A finding arrives as an
   * authored fact in the record they are handed; that is the whole design.
   */
  it('asks no scenario to interpret an image', () => {
    const forbidden = /\b(?:interpret|read|detect|localiz\w*|characteriz\w*)\b[^.]{0,40}\b(?:image|images|scan|film|radiograph|pixels)\b/i;
    for (const { title, body } of scenarioBlocks()) {
      const actions = /^Actions:\s*(.+)$/m.exec(body)?.[1] ?? '';
      const choices = /^Choices:\s*(.+)$/m.exec(body)?.[1] ?? '';
      expect(forbidden.test(title), `title: ${title}`).toBe(false);
      expect(forbidden.test(actions), `Actions: ${title}`).toBe(false);
      expect(forbidden.test(choices), `Choices: ${title}`).toBe(false);
    }
  });

  it('names a review domain and a negative-transfer analysis, not a placeholder', () => {
    for (const section of ['Review domains', 'Negative-transfer analysis', 'Regional variation']) {
      const body = text.split(new RegExp(`^## ${section}$`, 'm'))[1]?.split(/^## /m)[0]?.trim() ?? '';
      expect(body.length, section).toBeGreaterThan(80);
      expect(/^(?:not|none) yet\b/i.test(body), section).toBe(false);
    }
  });

  it('promises no date and no landing card', () => {
    expect(judged.status).not.toBe('planned');
    expect(text).not.toMatch(/\b(?:20\d\d Q[1-4]|by 20\d\d|shipping in|release date)\b/i);
  });
});
