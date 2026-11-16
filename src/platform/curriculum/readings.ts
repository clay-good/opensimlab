/**
 * Every framework reading this build ships, in one list
 * (framework-mapping-expansion → registry).
 *
 * The governance page counts overdue readings, and it counted only the four
 * anaesthesia ones for as long as that was the only module with a mapping: the
 * nursing reading could have gone two years stale without appearing anywhere.
 * A reading joins by being added here, and `tests/unit/framework-records.test.ts`
 * holds this list against the register, so neither half can grow alone.
 *
 * Records only. Nothing here reaches a scenario, so the page that lists the
 * readings does not pull a catalogue in with them.
 */
import { FRAMEWORKS } from '@anesthesia/curriculum/frameworks';
import { ACGME_EMERGENCY_MEDICINE_MILESTONES } from './acgme-emergency-medicine';
import { ACGME_NEUROLOGY_MILESTONES } from './acgme-neurology';
import { ACGME_OBSTETRICS_GYNECOLOGY_MILESTONES } from './acgme-obstetrics-gynecology';
import { ACGME_PEDIATRICS_MILESTONES } from './acgme-pediatrics';
import { NCSBN_NCJMM } from '../../modules/medical-surgical-nursing/curriculum';
import type { FrameworkRecord } from './framework-records';

export const FRAMEWORK_READINGS: readonly FrameworkRecord[] = [
  ...FRAMEWORKS,
  ACGME_EMERGENCY_MEDICINE_MILESTONES,
  ACGME_NEUROLOGY_MILESTONES,
  ACGME_OBSTETRICS_GYNECOLOGY_MILESTONES,
  ACGME_PEDIATRICS_MILESTONES,
  NCSBN_NCJMM,
];
