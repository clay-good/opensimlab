/**
 * Acceptance tests for platform/adoption's curriculum mapping and assignment
 * links, and learning/curriculum's instructor mode.
 */
import { describe, expect, it } from 'vitest';
import {
  ACGME_ANESTHESIOLOGY_MILESTONES, COA_STANDARDS, FRAMEWORKS, MAPPING_DISCLAIMER, NBCRNA_NCE,
  getFramework,
} from '@anesthesia/curriculum/frameworks';
import { requireSource } from '@platform/docs/sources';
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

describe('Requirement: A Named Framework Names A Version That Is Current', () => {
  /**
   * The interface told educators it was mapped against the COA practice
   * doctorate standards "as revised 2022". The current standards were revised
   * May 2025, effective January 2026, with a January 2024 revision in between —
   * two revisions stale, on the page a nurse anaesthesia programme director
   * reads first. Nothing here noticed, because nothing here looked.
   *
   * These bind each framework's displayed version to the source register, which
   * records when the body last amended it and when that was checked.
   */
  const registered = (id: string) => requireSource(id);

  it('Scenario: the COA standards name the revision the Council actually publishes', () => {
    const source = registered('coa-practice-doctorate-standards');
    expect(source.currency?.lastAmended.slice(0, 4)).toBe('2025');
    expect(COA_STANDARDS.version).toContain('2025');
    // And the effective date, because a programme needs to know which applies.
    expect(COA_STANDARDS.version).toContain('January 2026');
    expect(COA_STANDARDS.version).not.toContain('2022');
  });

  it('Scenario: the ACGME milestones name a version and no unverifiable year', () => {
    // The sources disagree — a 2020 copyright, a 2021 describing paper, a 2022
    // effective date. Naming the version alone is the only claim that is true
    // whichever is right.
    expect(ACGME_ANESTHESIOLOGY_MILESTONES.version).toBe('2.0');
    expect(registered('acgme-anesthesiology-milestones-2').verifiedAgainst)
      .toContain('Inconclusive');
  });

  it('Scenario: a framework with no citable version says "current" rather than a year', () => {
    expect(NBCRNA_NCE.version).toContain('current');
    expect(NBCRNA_NCE.version).not.toMatch(/\d{4}/);
    expect(registered('nbcrna-nce-content-outline').unpinned).toBe(true);
  });

  it('Scenario: every framework the interface names is in the source register', () => {
    const ids: Record<string, string> = {
      'coa-standards': 'coa-practice-doctorate-standards',
      'acgme-anesthesiology-milestones-2': 'acgme-anesthesiology-milestones-2',
      'nbcrna-nce': 'nbcrna-nce-content-outline',
    };
    for (const framework of [COA_STANDARDS, ACGME_ANESTHESIOLOGY_MILESTONES, NBCRNA_NCE]) {
      const sourceId = ids[framework.id];
      expect(sourceId, `${framework.id} has no register entry`).toBeDefined();
      expect(() => requireSource(sourceId!)).not.toThrow();
    }
  });

  it('Scenario: none of them is claimed as an endorsement', () => {
    for (const framework of [COA_STANDARDS, ACGME_ANESTHESIOLOGY_MILESTONES, NBCRNA_NCE]) {
      expect(framework.fidelity).toBe('summarised');
      expect(framework.note.toLowerCase()).toContain('not');
    }
  });
});

describe('Requirement: The Coverage Page Shows The Whole Catalogue', () => {
  /**
   * Bronchospasm shipped unmapped. The machinery worked — it was REPORTED as
   * unmapped rather than dropped — but the educators page told a programme
   * director that every scenario was mapped, so the coverage page showed three
   * scenarios out of four under a claim that it was all of them.
   *
   * The reporting stays, because a future scenario will land before its mapping
   * does and being visible is better than being silently absent. What is new is
   * that shipping in that state fails the build.
   */
  it('Scenario: no scenario in the build is unmapped', () => {
    const unmapped = unmappedScenarios().map((scenario) => scenario.metadata.id);
    expect(unmapped, 'these scenarios are not mapped to any framework').toEqual([]);
  });

  it('Scenario: every scenario appears against every framework', () => {
    // Not just mapped somewhere — a programme looking at their own framework
    // should see the whole catalogue under it, not a subset.
    for (const framework of FRAMEWORKS) {
      const mapped = new Set(
        SCENARIO_MAPPINGS.filter((m) => m.frameworkId === framework.id).map((m) => m.scenarioId),
      );
      for (const scenario of SCENARIOS) {
        expect(mapped, `${scenario.metadata.id} is absent from ${framework.id}`)
          .toContain(scenario.metadata.id);
      }
    }
  });

  it('Scenario: every mapping names objectives the scenario actually declares', () => {
    // The mapping is only falsifiable if the objective ids are real. A mapping
    // citing an objective that does not exist cannot be checked by opening the
    // scenario, which is the whole reason the ids are recorded.
    for (const mapping of SCENARIO_MAPPINGS) {
      const scenario = SCENARIOS.find((s) => s.metadata.id === mapping.scenarioId)!;
      expect(scenario, mapping.scenarioId).toBeDefined();
      const declared = new Set(scenario.metadata.objectives.map((objective) => objective.id));
      for (const id of mapping.objectiveIds) {
        expect(declared, `${mapping.scenarioId}/${mapping.domainId} cites objective "${id}"`)
          .toContain(id);
      }
    }
  });

  it('Scenario: the export still carries its disclaimer', () => {
    // More coverage makes the mapping look more official, which is exactly when
    // the disclaimer matters most.
    const csv = mappingCsv();
    expect(csv).toContain('No accrediting or certifying body has reviewed');
    expect(csv).toContain('does not count toward any case requirement');
  });
});
