/**
 * What names a lesson across the whole catalogue.
 *
 * A scenario id is unique inside its module and not across the catalogue:
 * `status-epilepticus` is one lesson in emergency medicine and a different one
 * in critical care. Anything that remembers practice by scenario id alone
 * therefore confuses two patients, which is what the private practice history
 * did until it began recording the module as well.
 *
 * Two properties are pinned here because other code is allowed to rely on them.
 * The first is the duplicate itself: it is listed by name, so a second one
 * cannot appear unnoticed. The second is that no two lessons share a scenario
 * AND objective pair, which is what lets `objectiveStatus` key a learner's
 * latest evidence without a module and lets a progress file written before
 * modules were recorded merge without reporting every status as moved.
 */
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';
import { MODULES } from '@platform/modules/registry';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../../src/modules/surgery-trauma/scenarios';

const BY_MODULE: readonly (readonly [string, readonly Scenario[]])[] = [
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
];

/** The scenario ids more than one module uses, each with the modules that use it. */
function sharedScenarioIds(): Record<string, readonly string[]> {
  const modulesById = new Map<string, string[]>();
  for (const [moduleId, scenarios] of BY_MODULE) {
    for (const scenario of scenarios) {
      modulesById.set(scenario.metadata.id, [...(modulesById.get(scenario.metadata.id) ?? []), moduleId]);
    }
  }
  return Object.fromEntries([...modulesById].filter(([, modules]) => modules.length > 1));
}

describe('what names a lesson across the catalogue', () => {
  it('covers every available module exactly once', () => {
    expect(BY_MODULE.map(([id]) => id).sort())
      .toEqual(MODULES.filter((module) => module.status === 'available').map((module) => module.id).sort());
    expect(new Set(BY_MODULE.map(([id]) => id)).size).toBe(BY_MODULE.length);
  });

  it('gives each module scenario ids that are unique within it', () => {
    for (const [moduleId, scenarios] of BY_MODULE) {
      const ids = scenarios.map((scenario) => scenario.metadata.id);
      expect([moduleId, new Set(ids).size]).toEqual([moduleId, ids.length]);
    }
  });

  it('names every scenario id that two modules share', () => {
    expect(sharedScenarioIds()).toEqual({
      'status-epilepticus': ['emergency-medicine', 'critical-care'],
    });
  });

  it('never lets two lessons share a scenario and objective pair', () => {
    const modulesByPair = new Map<string, string[]>();
    for (const [moduleId, scenarios] of BY_MODULE) {
      for (const scenario of scenarios) {
        for (const objective of scenario.metadata.objectives) {
          const pair = `${scenario.metadata.id}:${objective.id}`;
          modulesByPair.set(pair, [...(modulesByPair.get(pair) ?? []), moduleId]);
        }
      }
    }
    expect([...modulesByPair].filter(([, modules]) => modules.length > 1)).toEqual([]);
  });
});
