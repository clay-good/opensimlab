/**
 * Acceptance tests for platform/clinical-governance → confirmed errors are
 * recorded permanently and publicly.
 *
 * The corrections log is the consideration a reader gets for accepting an unsigned
 * corpus, so it has to be reachable from the product and it has to be ONE record.
 * It exists twice — as typed data the site renders and as `CORRECTIONS.md` in the
 * repository — and two copies of a permanent record are one record only while
 * something fails when they disagree. That is what these tests are.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACKNOWLEDGEMENT_WORKING_DAYS, CORRECTIONS, CORRECTIONS_EMPTY_REASON, CORRECTIONS_POLICY,
  CORRECTIONS_TRIAGE,
} from '@platform/docs/corrections';
import { routeFor } from '@routes/routes';

/** The entry headings under `## Entries`, ignoring the commented-out template. */
function fileEntryCount(): number {
  const text = readFileSync(join(process.cwd(), 'CORRECTIONS.md'), 'utf8');
  const entries = text.slice(text.indexOf('## Entries'));
  const withoutComments = entries.replace(/<!--[\s\S]*?-->/g, '');
  return (withoutComments.match(/^### /gm) ?? []).length;
}

describe('Requirement: The Corrections Log Is One Permanent Record', () => {
  it('agrees with the repository file on how many corrections exist', () => {
    expect(CORRECTIONS).toHaveLength(fileEntryCount());
  });

  it('states why it is empty rather than letting a zero speak for itself', () => {
    expect(CORRECTIONS).toHaveLength(0);
    expect(CORRECTIONS_EMPTY_REASON).toContain('no clinical review has yet taken place');
    expect(CORRECTIONS_EMPTY_REASON).toContain('not empty because the content is right');
  });

  it('keeps the append-only and urgent-withdrawal promises in the shipped copy', () => {
    const policy = CORRECTIONS_POLICY.join(' ');
    expect(policy).toContain('Nothing here is ever deleted or rewritten');
    expect(policy).toContain('unsafe practice');
    expect(policy).toContain('regardless of the release schedule');
  });

  it('publishes it at a findable, indexable route', () => {
    const route = routeFor('/corrections');
    expect(route).toBeDefined();
    expect(route!.indexable).toBe(true);
    expect(route!.heading).toBe('Corrections log');
  });

  it('requires every field an entry promises, if one is ever added', () => {
    for (const entry of CORRECTIONS) {
      expect(entry.released).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const field of [
        entry.title, entry.item, entry.wasWrong, entry.educationalImpact,
        entry.reportedBy, entry.whatChanged, entry.releasedIn,
      ]) expect(field.trim().length).toBeGreaterThan(0);
    }
  });
});

/**
 * The commitment is what a reader weighs before deciding a report is worth their
 * time, so it belongs in the product rather than only in `GOVERNANCE.md`.
 */
describe('Requirement: The Triage Path Is Published, Not Just Promised', () => {
  it('states the acknowledgement window as the same number the governance file does', () => {
    expect(ACKNOWLEDGEMENT_WORKING_DAYS).toBe(5);
    const governance = readFileSync(join(process.cwd(), 'GOVERNANCE.md'), 'utf8');
    expect(governance).toContain('acknowledged within five working days');
    expect(CORRECTIONS_TRIAGE[0]!.commitment).toContain('within 5 working days');
  });

  it('says a report is detection rather than review, so volume changes no status', () => {
    const path = CORRECTIONS_TRIAGE.map((step) => step.commitment).join(' ');
    expect(path).toContain('detection, not review');
    expect(path).toContain('report volume');
    expect(path).toContain('authoritative source');
  });

  it('commits to disabling unsafe content off the release schedule', () => {
    const urgent = CORRECTIONS_TRIAGE.find((step) => step.stage.includes('unsafe'));
    expect(urgent).toBeDefined();
    expect(urgent!.commitment).toContain('regardless of the release schedule');
  });

  it('names an unavailable intake path rather than implying one always works', () => {
    expect(CORRECTIONS_TRIAGE[0]!.commitment).toContain('static-only fork');
  });
});
