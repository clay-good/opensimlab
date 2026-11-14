/**
 * Every available module's scenarios, for the return index.
 *
 * Kept beside the generator rather than in `src/`, so no shipped route can
 * import all sixteen catalogues by accident: the index exists precisely so
 * that nothing has to.
 */
import { SCENARIOS } from '@anesthesia/scenarios';
import type { IndexedModule } from '@platform/catalog/return-index';
import { MODULES } from '@platform/modules/registry';
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

/**
 * Keyed by module id; the generator writes them in registry order, so the
 * generated file's order is the registry's and not this file's.
 */
export const RETURN_INDEX_SCENARIOS: Readonly<Record<string, IndexedModule['scenarios']>> = {
  anesthesia: SCENARIOS,
  'emergency-medicine': EMERGENCY_MEDICINE_SCENARIOS,
  'critical-care': CRITICAL_CARE_SCENARIOS,
  cardiology: CARDIOLOGY_SCENARIOS,
  'respiratory-medicine': RESPIRATORY_MEDICINE_SCENARIOS,
  pediatrics: PEDIATRICS_SCENARIOS,
  neurology: NEUROLOGY_SCENARIOS,
  toxicology: TOXICOLOGY_SCENARIOS,
  obstetrics: OBSTETRICS_SCENARIOS,
  neonatology: NEONATOLOGY_SCENARIOS,
  'endocrine-metabolic': ENDOCRINE_METABOLIC_SCENARIOS,
  'renal-electrolyte': RENAL_ELECTROLYTE_SCENARIOS,
  'infectious-disease': INFECTIOUS_DISEASE_SCENARIOS,
  'medical-surgical-nursing': MEDICAL_SURGICAL_NURSING_SCENARIOS,
  oncology: ONCOLOGY_SCENARIOS,
  'surgery-trauma': SURGERY_TRAUMA_SCENARIOS,
};

/** Every available module, in registry order, with its scenarios. */
export const RETURN_INDEX_INPUT: readonly IndexedModule[] = MODULES
  .filter((module) => module.status === 'available')
  .map((module) => {
    const scenarios = RETURN_INDEX_SCENARIOS[module.id];
    if (!scenarios) throw new Error(`return index: no scenarios registered for ${module.id}`);
    return { moduleId: module.id, scenarios };
  });
