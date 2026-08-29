/**
 * The limitations register (platform/clinical-governance → The Limitations Register).
 *
 * Each entry names the specific simplification, the clinical situation where it
 * would mislead, and the correct clinical understanding. It is linked from the
 * interface, not buried in a repository file, and a scenario whose teaching points
 * sit near one of these names it in the briefing.
 *
 * The entries themselves live one file per module under `limitations/`. They were a single flat
 * array, and because a cockpit needs `limitationsFor(id)` for one scenario, every module shipped
 * all fifteen modules' entries: 626 KB raw, 135.6 KB compressed, in every module's chunk. This
 * file still assembles the complete register for the limitations page and the reviewer index; a
 * cockpit imports only its own module's file. Two entries brief scenarios in more than one module
 * and so appear in two files, and the assembly below deduplicates them by id.
 */

import type { Limitation } from './limitations/types';
import { ANESTHESIA_LIMITATIONS } from './limitations/anesthesia';
import { EMERGENCY_MEDICINE_LIMITATIONS } from './limitations/emergency-medicine';
import { CRITICAL_CARE_LIMITATIONS } from './limitations/critical-care';
import { CARDIOLOGY_LIMITATIONS } from './limitations/cardiology';
import { RESPIRATORY_MEDICINE_LIMITATIONS } from './limitations/respiratory-medicine';
import { PEDIATRICS_LIMITATIONS } from './limitations/pediatrics';
import { NEUROLOGY_LIMITATIONS } from './limitations/neurology';
import { TOXICOLOGY_LIMITATIONS } from './limitations/toxicology';
import { OBSTETRICS_LIMITATIONS } from './limitations/obstetrics';
import { NEONATOLOGY_LIMITATIONS } from './limitations/neonatology';
import { ENDOCRINE_METABOLIC_LIMITATIONS } from './limitations/endocrine-metabolic';
import { RENAL_ELECTROLYTE_LIMITATIONS } from './limitations/renal-electrolyte';
import { INFECTIOUS_DISEASE_LIMITATIONS } from './limitations/infectious-disease';
import { MEDICAL_SURGICAL_NURSING_LIMITATIONS } from './limitations/medical-surgical-nursing';
import { ONCOLOGY_LIMITATIONS } from './limitations/oncology';
import { SHARED_LIMITATIONS } from './limitations/shared';

export type { Limitation } from './limitations/types';

const REGISTERS: readonly (readonly Limitation[])[] = [
  RENAL_ELECTROLYTE_LIMITATIONS, ENDOCRINE_METABOLIC_LIMITATIONS, CRITICAL_CARE_LIMITATIONS,
  ANESTHESIA_LIMITATIONS, EMERGENCY_MEDICINE_LIMITATIONS, CARDIOLOGY_LIMITATIONS,
  RESPIRATORY_MEDICINE_LIMITATIONS, PEDIATRICS_LIMITATIONS, NEUROLOGY_LIMITATIONS,
  TOXICOLOGY_LIMITATIONS, OBSTETRICS_LIMITATIONS, NEONATOLOGY_LIMITATIONS,
  INFECTIOUS_DISEASE_LIMITATIONS, MEDICAL_SURGICAL_NURSING_LIMITATIONS, ONCOLOGY_LIMITATIONS,
  SHARED_LIMITATIONS,
];

/** Every entry, each appearing once, in module order. */
export const LIMITATIONS: readonly Limitation[] = (() => {
  const seen = new Set<string>();
  return REGISTERS.flat().filter((limitation) => {
    if (seen.has(limitation.id)) return false;
    seen.add(limitation.id);
    return true;
  });
})();

export function limitationsFor(scenarioId: string): Limitation[] {
  return LIMITATIONS.filter((limitation) => limitation.briefIn.includes(scenarioId));
}
