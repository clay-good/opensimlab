/**
 * surgery-trauma's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/surgery-trauma.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { negativeScanDemonstrationStep, supportsNegativeScanDemonstration } from './negative-scan-demonstration';
import { risingRequirementDemonstrationStep, supportsRisingRequirementDemonstration } from './rising-requirement-demonstration';

export const SURGERY_TRAUMA_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'NegativeScan', supports: supportsNegativeScanDemonstration, actionType: 'negative-scan-response', step: (r) => negativeScanDemonstrationStep(r?.negativeScan) },
  { id: 'RisingRequirement', supports: supportsRisingRequirementDemonstration, actionType: 'rising-requirement-response', step: (r) => risingRequirementDemonstrationStep(r?.risingRequirement) },
];
