/**
 * Assembles the adoption pack's inputs from the real records.
 *
 * Shared by `build-completion-catalog.ts`, which writes the pack, and the test that
 * checks the committed pack equals a fresh build from the same records.
 */
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';
import { FRAMEWORKS, MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../src/modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../src/modules/surgery-trauma/scenarios';
import type { MaturityCatalog } from '@platform/catalog/maturity';
import type { ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import { CORRECTIONS } from '@platform/docs/corrections';
import { LIMITATIONS } from '@platform/docs/limitations';
import { limitationsToBrief } from '@platform/docs/scenario-limitations';
import { EDITORIAL_BOARD } from '@platform/governance/records';
import {
  ADOPTION_PACK_RELEASE_TOKEN, type AdoptionPackInput,
} from '@platform/adoption/adoption-pack';

export const REPOSITORY_URL = 'https://github.com/clay-good/opensimlab';

export const AUTHORED_SCENARIOS = [
  ['anesthesia', SCENARIOS],
  ['emergency-medicine', EMERGENCY_MEDICINE_SCENARIOS],
  ['critical-care', CRITICAL_CARE_SCENARIOS],
  ['cardiology', CARDIOLOGY_SCENARIOS],
  ['respiratory-medicine', RESPIRATORY_MEDICINE_SCENARIOS],
  ['pediatrics', PEDIATRICS_SCENARIOS],
  ['neurology', NEUROLOGY_SCENARIOS],
  ['toxicology', TOXICOLOGY_SCENARIOS],
  ['obstetrics', OBSTETRICS_SCENARIOS],
  ['neonatology', NEONATOLOGY_SCENARIOS],
  ['endocrine-metabolic', ENDOCRINE_METABOLIC_SCENARIOS],
  ['renal-electrolyte', RENAL_ELECTROLYTE_SCENARIOS],
  ['infectious-disease', INFECTIOUS_DISEASE_SCENARIOS],
  ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_SCENARIOS],
  ['oncology', ONCOLOGY_SCENARIOS],
  ['surgery-trauma', SURGERY_TRAUMA_SCENARIOS],
] as const;

export const authoredByKey = new Map<string, Scenario>(AUTHORED_SCENARIOS.flatMap(([moduleId, scenarios]) => scenarios.map(
  (scenario) => [`${moduleId}:${scenario.metadata.id}@${scenario.metadata.version}`, scenario] as const,
)));

export function adoptionPackInput(
  completions: readonly ScenarioCompletionCatalog[],
  maturity: readonly MaturityCatalog[],
  today: Date,
): AdoptionPackInput {
  return {
    release: ADOPTION_PACK_RELEASE_TOKEN,
    repositoryUrl: REPOSITORY_URL,
    capabilityVersion: ENGINE_VERSION,
    today,
    completions,
    maturity,
    authored: (moduleId, scenarioId, contentVersion) => {
      const key = `${moduleId}:${scenarioId}@${contentVersion}`;
      const scenario = authoredByKey.get(key);
      if (!scenario) throw new Error(`adoption pack: missing authored scenario ${key}`);
      return {
        sources: scenario.metadata.clinicalReview.sources,
        review: scenario.metadata.clinicalReview,
        limitationIds: limitationsToBrief(scenario, LIMITATIONS).map((limitation) => limitation.id),
      };
    },
    corrections: CORRECTIONS,
    board: EDITORIAL_BOARD,
    competency: {
      disclaimer: MAPPING_DISCLAIMER,
      frameworks: FRAMEWORKS.map((framework) => ({
        id: framework.id, name: framework.name, body: framework.body,
        version: framework.version, url: framework.url, fidelity: framework.fidelity,
      })),
      mappings: SCENARIO_MAPPINGS,
    },
  };
}
