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
import { unfinishedSurveyDemonstrationStep, supportsUnfinishedSurveyDemonstration } from './unfinished-survey-demonstration';
import { transientResponseDemonstrationStep, supportsTransientResponseDemonstration } from './transient-response-demonstration';
import { quietChestDemonstrationStep, supportsQuietChestDemonstration } from './quiet-chest-demonstration';
import { unownedDelayDemonstrationStep, supportsUnownedDelayDemonstration } from './unowned-delay-demonstration';
import { thirdAttendanceDemonstrationStep, supportsThirdAttendanceDemonstration } from './third-attendance-demonstration';
import { deferredStepDemonstrationStep, supportsDeferredStepDemonstration } from './deferred-step-demonstration';
import { knownLabelDemonstrationStep, supportsKnownLabelDemonstration } from './known-label-demonstration';
import { unspokenDoubtDemonstrationStep, supportsUnspokenDoubtDemonstration } from './unspoken-doubt-demonstration';

export const SURGERY_TRAUMA_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'NegativeScan', supports: supportsNegativeScanDemonstration, actionType: 'negative-scan-response', step: (r) => negativeScanDemonstrationStep(r?.negativeScan) },
  { id: 'RisingRequirement', supports: supportsRisingRequirementDemonstration, actionType: 'rising-requirement-response', step: (r) => risingRequirementDemonstrationStep(r?.risingRequirement) },
  { id: 'UnfinishedSurvey', supports: supportsUnfinishedSurveyDemonstration, actionType: 'unfinished-survey-response', step: (r) => unfinishedSurveyDemonstrationStep(r?.unfinishedSurvey) },
  { id: 'TransientResponse', supports: supportsTransientResponseDemonstration, actionType: 'transient-response-response', step: (r) => transientResponseDemonstrationStep(r?.transientResponse) },
  { id: 'QuietChest', supports: supportsQuietChestDemonstration, actionType: 'quiet-chest-response', step: (r) => quietChestDemonstrationStep(r?.quietChest) },
  { id: 'UnownedDelay', supports: supportsUnownedDelayDemonstration, actionType: 'unowned-delay-response', step: (r) => unownedDelayDemonstrationStep(r?.unownedDelay) },
  { id: 'ThirdAttendance', supports: supportsThirdAttendanceDemonstration, actionType: 'third-attendance-response', step: (r) => thirdAttendanceDemonstrationStep(r?.thirdAttendance) },
  { id: 'DeferredStep', supports: supportsDeferredStepDemonstration, actionType: 'deferred-step-response', step: (r) => deferredStepDemonstrationStep(r?.deferredStep) },
  { id: 'KnownLabel', supports: supportsKnownLabelDemonstration, actionType: 'known-label-response', step: (r) => knownLabelDemonstrationStep(r?.knownLabel) },
  { id: 'UnspokenDoubt', supports: supportsUnspokenDoubtDemonstration, actionType: 'unspoken-doubt-response', step: (r) => unspokenDoubtDemonstrationStep(r?.unspokenDoubt) },
];
