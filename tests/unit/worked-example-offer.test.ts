/**
 * A worked example nobody can start is not a worked example.
 *
 * The control that offers one used to be decided by a long `||` chain written
 * out at four sites, and all eleven oncology examples were added to none of
 * them: built, tested, audited as satisfying `guidance-and-demonstration`, and
 * unreachable from the product. Only a test that compares the two lists can
 * catch that, because each half is individually correct.
 */
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { buildModuleCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { offersWorkedExample, WORKED_EXAMPLE_MODULE_IDS } from '@anesthesia/demo/worked-examples';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { SCENARIOS as ANESTHESIA_SCENARIOS } from '@anesthesia/scenarios';

const MODULES = [
  ['endocrine-metabolic', ENDOCRINE_METABOLIC_SCENARIOS],
  ['renal-electrolyte', RENAL_ELECTROLYTE_SCENARIOS],
  ['oncology', ONCOLOGY_SCENARIOS],
  ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_SCENARIOS],
  ['infectious-disease', INFECTIOUS_DISEASE_SCENARIOS],
  ['neonatology', NEONATOLOGY_SCENARIOS],
  ['toxicology', TOXICOLOGY_SCENARIOS],
] as const;

const claimed = (scenarios: typeof MODULES[number][1], moduleId: string) =>
  buildModuleCompletionCatalog(scenarios, ENGINE_VERSION, moduleId, 'ward').scenarios
    .filter((scenario) => scenario.requirements.some(
      (entry) => entry.id === 'guidance-and-demonstration' && entry.status === 'satisfied',
    ))
    .map((scenario) => scenario.scenarioId);

describe('Requirement: Every Audited Example Is Offered', () => {
  it.each(MODULES)('offers exactly the %s lessons whose audit claims one', (moduleId, scenarios) => {
    const offered = scenarios.filter((scenario) => offersWorkedExample(scenario, moduleId))
      .map((scenario) => scenario.metadata.id);
    // Not "every scenario in the module" — nursing is still being written toward
    // the standard. The invariant is that the two lists cannot drift apart.
    expect(offered.slice().sort()).toEqual(claimed(scenarios, moduleId).slice().sort());
    expect(offered.length).toBeGreaterThan(0);
  });

  it('names the modules that ship examples and no others', () => {
    expect(WORKED_EXAMPLE_MODULE_IDS.slice().sort())
      .toEqual(['endocrine-metabolic', 'infectious-disease', 'medical-surgical-nursing',
        'neonatology', 'neurology', 'oncology', 'renal-electrolyte', 'toxicology']);
  });

  it('offers nothing for a module that has no worked example', () => {
    // Anesthesia has the older scripted demonstration, which the route offers by
    // scenario id through a different branch. It is not a worked example.
    for (const scenario of ANESTHESIA_SCENARIOS) {
      expect(offersWorkedExample(scenario, 'anesthesia')).toBe(false);
    }
  });

  it('refuses a look-alike scenario at another content version', () => {
    const [scenario] = ONCOLOGY_SCENARIOS;
    expect(offersWorkedExample(scenario!, 'oncology')).toBe(true);
    expect(offersWorkedExample({ ...scenario!, metadata: { ...scenario!.metadata, version: '9.9.9' } }, 'oncology')).toBe(false);
    expect(offersWorkedExample(scenario!, 'endocrine-metabolic')).toBe(false);
  });
});
