/**
 * Acceptance tests for platform/adoption's curriculum mapping and assignment
 * links, and learning/curriculum's instructor mode.
 */
import { describe, expect, it } from 'vitest';
import { FRAMEWORKS, MAPPING_DISCLAIMER, getFramework } from '@anesthesia/curriculum/frameworks';
import {
  SCENARIO_MAPPINGS, coverageFor, danglingMappings, mappingCsv, unmappedScenarios,
} from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';
import { readAssignment } from '@routes/AnesthesiaRoute';

describe('Requirement: Curriculum Mapping To Recognized Frameworks', () => {
  it('Scenario: Mappings state their framework and its version', () => {
    for (const framework of FRAMEWORKS) {
      expect(framework.body, `${framework.id} names no body`).not.toBe('');
      expect(framework.version, `${framework.id} names no version`).not.toBe('');
      expect(framework.url).toMatch(/^https:\/\//);
      // A summary presented as a transcription is a quiet misrepresentation, so
      // every framework declares which it is.
      expect(['verbatim', 'summarised']).toContain(framework.fidelity);
      expect(framework.domains.length).toBeGreaterThan(0);
      // A tab label that is the body's name truncated at two words reads as
      // garbage ("Council on", "National Board"), so each names its own.
      expect(framework.shortLabel.length).toBeLessThanOrEqual(20);
      expect(framework.shortLabel.split(' ').length).toBeLessThanOrEqual(3);
    }
  });

  it('Scenario: The mapping never claims an endorsement it does not have', () => {
    expect(MAPPING_DISCLAIMER).toContain('No');
    expect(MAPPING_DISCLAIMER.toLowerCase()).toContain('endorse');
    expect(MAPPING_DISCLAIMER.toLowerCase()).toContain('does not count toward');
    for (const framework of FRAMEWORKS) {
      expect(framework.note.length, `${framework.id} has no caveat`).toBeGreaterThan(40);
    }
  });

  it('Scenario: A program director filters by domain and gets real scenarios', () => {
    const framework = getFramework('nbcrna-nce')!;
    const coverage = coverageFor(framework);
    expect(coverage).toHaveLength(framework.domains.length);
    const covered = coverage.filter((entry) => entry.scenarios.length > 0);
    expect(covered.length).toBeGreaterThan(0);
    for (const entry of covered) {
      for (const scenario of entry.scenarios) {
        expect(SCENARIOS).toContain(scenario);
      }
    }
  });

  it('Scenario: An uncovered domain is listed as uncovered rather than omitted', () => {
    // Every domain appears whether or not anything covers it. A coverage table
    // that drops its gaps is not a coverage table.
    for (const framework of FRAMEWORKS) {
      const coverage = coverageFor(framework);
      expect(coverage.map((entry) => entry.domain.id).sort())
        .toEqual(framework.domains.map((domain) => domain.id).sort());
    }
  });

  it('Scenario: An unmapped scenario is visible as unmapped', () => {
    const unmapped = unmappedScenarios();
    for (const scenario of unmapped) {
      expect(SCENARIO_MAPPINGS.some((m) => m.scenarioId === scenario.metadata.id)).toBe(false);
    }
    // And the CSV reports them rather than silently ending.
    if (unmapped.length > 0) expect(mappingCsv()).toContain('UNMAPPED');
  });

  it('Scenario: no mapping points at something that does not exist', () => {
    // Every mapping names a real framework, a real domain, a real scenario, and
    // real objectives within it. A mapping that drifts is worse than none.
    expect(danglingMappings()).toEqual([]);
  });

  it('Scenario: The mapping exports as CSV for program documentation', () => {
    const csv = mappingCsv();
    const lines = csv.trim().split('\n');
    // The caveat travels with the file, because a spreadsheet gets pasted into
    // documents the surrounding page does not travel with.
    expect(lines[0]).toContain('No accrediting or certifying body');
    expect(lines[1]).toContain('framework');
    expect(lines.length).toBeGreaterThan(10);
    // Every row has the same number of quoted cells.
    const columns = (line: string) => (line.match(/","/g) ?? []).length;
    const width = columns(lines[1]!);
    for (const line of lines.slice(1)) expect(columns(line)).toBe(width);
    // A comma inside a cell cannot break a row.
    expect(csv).not.toMatch(/[^"],[^"]*NOTE/);
  });
});

describe('Requirement: Assignment Links Without Accounts', () => {
  it('Scenario: A cohort meets the same patient', () => {
    const a = readAssignment('?seed=4242&guidance=unassisted&assignment=Week%203');
    expect(a.seed).toBe(4242);
    expect(a.guidance).toBe('unassisted');
    expect(a.label).toBe('Week 3');
  });

  it('Scenario: A malformed link is not trusted', () => {
    // Nothing from a URL is used without being checked. An unknown guidance
    // level falls back to the learner's own setting rather than to nonsense.
    expect(readAssignment('?guidance=expert').guidance).toBeNull();
    expect(readAssignment('?seed=not-a-number').seed).toBe(20260819);
    expect(readAssignment('?seed=0').seed).toBe(20260819);
    expect(readAssignment('').guidance).toBeNull();
  });

  it('Scenario: A label from a link is bounded before it is shown', () => {
    const long = readAssignment(`?assignment=${'x'.repeat(500)}`);
    expect(long.label!.length).toBeLessThanOrEqual(80);
  });

  it('Scenario: A seed is a whole number, so the same link is the same patient', () => {
    expect(readAssignment('?seed=12.7').seed).toBe(12);
  });
});
