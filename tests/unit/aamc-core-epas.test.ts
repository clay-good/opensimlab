/**
 * The AAMC Core EPAs reading, and what this catalogue honestly maps to it.
 *
 * The thirteen labels are pinned verbatim: they are the AAMC's own wording from
 * the contents page of its 2017 toolkits document, and the whole value of a
 * framework mapping is that a programme director recognises the domains as the
 * ones in the document they are accredited against. A paraphrase that read
 * better would quietly break that, and nothing else in the build would notice.
 *
 * The uncovered activities are pinned too. Five of the thirteen are exercised
 * nowhere here, and that is a fact about the simulator worth protecting: if a
 * later mapping claims one of them, someone should have to say so in a diff.
 */
import { describe, expect, it } from 'vitest';
import { AAMC_CORE_EPAS } from '@platform/curriculum/aamc-core-epas';
import { frameworkRecordProblems } from '@platform/curriculum/framework-records';
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { SCENARIOS } from '@anesthesia/scenarios';

const mappings = SCENARIO_MAPPINGS.filter((mapping) => mapping.frameworkId === 'aamc-core-epas');

describe('the AAMC Core EPAs reading', () => {
  it('is a valid, dated, shipped framework record', () => {
    expect(frameworkRecordProblems(AAMC_CORE_EPAS)).toEqual([]);
    expect(FRAMEWORKS).toContain(AAMC_CORE_EPAS);
    expect(AAMC_CORE_EPAS.body).toBe('Association of American Medical Colleges');
    expect(AAMC_CORE_EPAS.recordedOn).toBe('2026-11-14');
    expect(AAMC_CORE_EPAS.reviewBy).toBe('2028-11-14');
  });

  it('carries the thirteen activity titles in the AAMC\'s own words', () => {
    expect(AAMC_CORE_EPAS.domains.map((domain) => domain.label)).toEqual([
      'Gather a History and Perform a Physical Examination',
      'Prioritize a Differential Diagnosis Following a Clinical Encounter',
      'Recommend and Interpret Common Diagnostic and Screening Tests',
      'Enter and Discuss Orders and Prescriptions',
      'Document a Clinical Encounter in the Patient Record',
      'Provide an Oral Presentation of a Clinical Encounter',
      'Form Clinical Questions and Retrieve Evidence to Advance Patient Care',
      'Give or Receive a Patient Handover to Transition Care Responsibility',
      'Collaborate as a Member of an Interprofessional Team',
      'Recognize a Patient Requiring Urgent or Emergent Care and Initiate Evaluation and Management',
      'Obtain Informed Consent for Tests and/or Procedures',
      'Perform General Procedures of a Physician',
      'Identify System Failures and Contribute to a Culture of Safety and Improvement',
    ]);
  });

  /**
   * Under-claiming on purpose: the labels are exact and only the descriptions
   * are this project's. Flipping the flag to verbatim fails the shared record
   * check on the six long titles, so this says the state is intended.
   */
  it('is marked summarised, and says why although its labels are exact', () => {
    expect(AAMC_CORE_EPAS.fidelity).toBe('summarised');
    expect(AAMC_CORE_EPAS.note).toContain('this project\'s words');
    expect(AAMC_CORE_EPAS.domains.filter((domain) => domain.label.length > 60)).toHaveLength(6);
    expect(frameworkRecordProblems({ ...AAMC_CORE_EPAS, fidelity: 'verbatim' })).toHaveLength(6);
  });

  it('records the issuing body\'s own statement that the framework is under review', () => {
    for (const fragment of ['2014', '2021', 'Foundational Competencies', 'past initiative',
      'being evaluated', 'endorsed by the AAMC']) {
      expect(AAMC_CORE_EPAS.note, fragment).toContain(fragment);
    }
  });

  it('points at a locator that is current, not the dead one the document prints', () => {
    expect(AAMC_CORE_EPAS.url).toBe('https://www.aamc.org/about-us/mission-areas/medical-education/cbme');
    expect(AAMC_CORE_EPAS.url).not.toContain('initiatives/coreepas');
  });
});

describe('what this catalogue maps to the Core EPAs', () => {
  it('maps every anaesthesia lesson to at least one activity', () => {
    const mapped = new Set(mappings.map((mapping) => mapping.scenarioId));
    for (const scenario of SCENARIOS) {
      expect(mapped, `${scenario.metadata.id} maps to no activity`).toContain(scenario.metadata.id);
    }
    expect(mapped.size).toBe(SCENARIOS.length);
  });

  it('names only objectives the lesson actually declares', () => {
    const declared = new Map(SCENARIOS.map((scenario) => [
      scenario.metadata.id, new Set(scenario.metadata.objectives.map((objective) => objective.id)),
    ]));
    for (const mapping of mappings) {
      expect(mapping.objectiveIds.length, `${mapping.scenarioId} ${mapping.domainId}`)
        .toBeGreaterThan(0);
      for (const objectiveId of mapping.objectiveIds) {
        expect(declared.get(mapping.scenarioId), `${mapping.scenarioId}: ${objectiveId}`)
          .toContain(objectiveId);
      }
    }
  });

  it('names only activities the framework declares', () => {
    const domains = new Set(AAMC_CORE_EPAS.domains.map((domain) => domain.id));
    for (const mapping of mappings) expect(domains).toContain(mapping.domainId);
  });

  /**
   * The five this simulator cannot exercise. It takes no history, writes no
   * note, gives no oral presentation, retrieves no evidence and takes no
   * consent — so claiming any of them would be the kind of mapping that makes
   * every other one worth less.
   */
  it('claims none of the five activities nothing here exercises', () => {
    const covered = new Set(mappings.map((mapping) => mapping.domainId));
    const uncovered = AAMC_CORE_EPAS.domains
      .map((domain) => domain.id).filter((id) => !covered.has(id));
    expect(uncovered).toEqual([
      'epa-1-history-and-physical',
      'epa-5-document-an-encounter',
      'epa-6-oral-presentation',
      'epa-7-clinical-questions-and-evidence',
      'epa-11-informed-consent',
    ]);
  });
});
