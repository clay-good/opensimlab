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

export const SURGERY_TRAUMA_TRAYS: readonly LessonTray[] = [
  { id: 'NegativeScan', actionType: 'negative-scan-response', supports: supportsNegativeScan, assessment: (r) => r?.negativeScan, Component: NegativeScanTray as LessonTray['Component'] },
  { id: 'RisingRequirement', actionType: 'rising-requirement-response', supports: supportsRisingRequirement, assessment: (r) => r?.risingRequirement, Component: RisingRequirementTray as LessonTray['Component'] },
  { id: 'UnfinishedSurvey', actionType: 'unfinished-survey-response', supports: supportsUnfinishedSurvey, assessment: (r) => r?.unfinishedSurvey, Component: UnfinishedSurveyTray as LessonTray['Component'] },
];
