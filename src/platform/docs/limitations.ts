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

/**
 * The registers, each with the name of what it is a register OF.
 *
 * The label is the reason this is not a bare array any more. The limitations page
 * printed all 707 entries as one undifferentiated run, and a reader looking for
 * what is simplified about, say, obstetrics had no way to get there. Grouping is
 * the whole navigation of that page, so the group name has to be data.
 */
export interface LimitationGroup {
  readonly label: string;
  readonly entries: readonly Limitation[];
}

const REGISTERS: readonly LimitationGroup[] = [
  /* First, and deliberately.
     These eleven are properties of the engine rather than of a specialty: the
     respiratory dose-response is a calibration, there is no shunt model, no PEEP,
     no coagulopathy, acid-base is approximate. Five of them are ALSO listed in
     `anesthesia.ts`, and while that file came first they were filed as anaesthesia
     quirks, which is the wrong thing to tell a reader about a limit that applies
     to every scenario in every module. Claiming them here files them once, in the
     one group whose name is true of them. */
  { label: 'The simulator itself', entries: SHARED_LIMITATIONS },
  { label: 'Anesthesia', entries: ANESTHESIA_LIMITATIONS },
  { label: 'Emergency medicine', entries: EMERGENCY_MEDICINE_LIMITATIONS },
  { label: 'Critical care', entries: CRITICAL_CARE_LIMITATIONS },
  { label: 'Cardiology', entries: CARDIOLOGY_LIMITATIONS },
  { label: 'Respiratory medicine', entries: RESPIRATORY_MEDICINE_LIMITATIONS },
  { label: 'Pediatrics', entries: PEDIATRICS_LIMITATIONS },
  { label: 'Neurology', entries: NEUROLOGY_LIMITATIONS },
  { label: 'Toxicology', entries: TOXICOLOGY_LIMITATIONS },
  { label: 'Obstetrics', entries: OBSTETRICS_LIMITATIONS },
  { label: 'Neonatology', entries: NEONATOLOGY_LIMITATIONS },
  { label: 'Endocrine and metabolic medicine', entries: ENDOCRINE_METABOLIC_LIMITATIONS },
  { label: 'Renal and electrolyte medicine', entries: RENAL_ELECTROLYTE_LIMITATIONS },
  { label: 'Infectious disease', entries: INFECTIOUS_DISEASE_LIMITATIONS },
  { label: 'Nursing', entries: MEDICAL_SURGICAL_NURSING_LIMITATIONS },
  { label: 'Oncology', entries: ONCOLOGY_LIMITATIONS },
];

/**
 * The same entries, grouped, each appearing under the FIRST register that claims
 * it. Two entries brief scenarios in more than one module and would otherwise be
 * listed twice, and a register that counts a thing twice is not a register.
 */
export const LIMITATION_GROUPS: readonly LimitationGroup[] = (() => {
  const seen = new Set<string>();
  return REGISTERS.map((group) => ({
    label: group.label,
    entries: group.entries.filter((limitation) => {
      if (seen.has(limitation.id)) return false;
      seen.add(limitation.id);
      return true;
    }),
  })).filter((group) => group.entries.length > 0);
})();

/** Every entry, each appearing once, in module order. */
export const LIMITATIONS: readonly Limitation[] =
  LIMITATION_GROUPS.flatMap((group) => group.entries);

export function limitationsFor(scenarioId: string): Limitation[] {
  return LIMITATIONS.filter((limitation) => limitation.briefIn.includes(scenarioId));
}
