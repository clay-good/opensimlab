/**
 * surgery-trauma's action trays, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's tray controls, labels and tutor prose and
 * nothing else. The cockpit used to import all 48 lesson trays, which measured 98.9 KB gz
 * of the chunk every module downloads.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { NegativeScanTray } from './NegativeScanTray';
import { RisingRequirementTray } from './RisingRequirementTray';
import { supportsNegativeScan } from './negative-scan';
import { supportsRisingRequirement } from './rising-requirement';
import { UnfinishedSurveyTray } from './UnfinishedSurveyTray';
import { supportsUnfinishedSurvey } from './unfinished-survey';
import { TransientResponseTray } from './TransientResponseTray';
import { supportsTransientResponse } from './transient-response';
import { QuietChestTray } from './QuietChestTray';
import { supportsQuietChest } from './quiet-chest';
import { UnownedDelayTray } from './UnownedDelayTray';
import { supportsUnownedDelay } from './unowned-delay';
import { ThirdAttendanceTray } from './ThirdAttendanceTray';
import { supportsThirdAttendance } from './third-attendance';
import { DeferredStepTray } from './DeferredStepTray';
import { supportsDeferredStep } from './deferred-step';
import { KnownLabelTray } from './KnownLabelTray';
import { supportsKnownLabel } from './known-label';

export const SURGERY_TRAUMA_TRAYS: readonly LessonTray[] = [
  { id: 'NegativeScan', actionType: 'negative-scan-response', supports: supportsNegativeScan, assessment: (r) => r?.negativeScan, Component: NegativeScanTray as LessonTray['Component'] },
  { id: 'RisingRequirement', actionType: 'rising-requirement-response', supports: supportsRisingRequirement, assessment: (r) => r?.risingRequirement, Component: RisingRequirementTray as LessonTray['Component'] },
  { id: 'UnfinishedSurvey', actionType: 'unfinished-survey-response', supports: supportsUnfinishedSurvey, assessment: (r) => r?.unfinishedSurvey, Component: UnfinishedSurveyTray as LessonTray['Component'] },
  { id: 'TransientResponse', actionType: 'transient-response-response', supports: supportsTransientResponse, assessment: (r) => r?.transientResponse, Component: TransientResponseTray as LessonTray['Component'] },
  { id: 'QuietChest', actionType: 'quiet-chest-response', supports: supportsQuietChest, assessment: (r) => r?.quietChest, Component: QuietChestTray as LessonTray['Component'] },
  { id: 'UnownedDelay', actionType: 'unowned-delay-response', supports: supportsUnownedDelay, assessment: (r) => r?.unownedDelay, Component: UnownedDelayTray as LessonTray['Component'] },
  { id: 'ThirdAttendance', actionType: 'third-attendance-response', supports: supportsThirdAttendance, assessment: (r) => r?.thirdAttendance, Component: ThirdAttendanceTray as LessonTray['Component'] },
  { id: 'DeferredStep', actionType: 'deferred-step-response', supports: supportsDeferredStep, assessment: (r) => r?.deferredStep, Component: DeferredStepTray as LessonTray['Component'] },
  { id: 'KnownLabel', actionType: 'known-label-response', supports: supportsKnownLabel, assessment: (r) => r?.knownLabel, Component: KnownLabelTray as LessonTray['Component'] },
];
