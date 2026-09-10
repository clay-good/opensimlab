/**
 * renal-electrolyte's action trays, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's tray controls, labels and tutor prose and
 * nothing else. The cockpit used to import all 48 lesson trays, which measured 98.9 KB gz
 * of the chunk every module downloads.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { RenalHyperkalemiaTray } from './RenalHyperkalemiaTray';
import { RenalHypermagnesemiaTray } from './RenalHypermagnesemiaTray';
import { RenalContrastAttributionTray } from './RenalContrastAttributionTray';
import { RenalRhabdomyolysisTray } from './RenalRhabdomyolysisTray';
import { RenalHypomagnesemiaTray } from './RenalHypomagnesemiaTray';
import { RenalHypernatremiaTray } from './RenalHypernatremiaTray';
import { RenalHypocalcemiaTray } from './RenalHypocalcemiaTray';
import { RenalHypokalemiaTray } from './RenalHypokalemiaTray';
import { RenalHyponatremiaTray } from './RenalHyponatremiaTray';
import { supportsRenalHyperkalemia } from './hyperkalemia';
import { supportsRenalHypermagnesemia } from './hypermagnesemia';
import { supportsRenalContrastAttribution } from './contrast-attribution';
import { supportsRenalRhabdomyolysis } from './rhabdomyolysis';
import { supportsRenalHypomagnesemia } from './hypomagnesemia';
import { supportsRenalHypernatremia } from './hypernatremia';
import { supportsRenalHypocalcemia } from './hypocalcemia';
import { supportsRenalHypokalemia } from './hypokalemia';
import { supportsRenalHyponatremia } from './hyponatremia';

export const RENAL_ELECTROLYTE_TRAYS: readonly LessonTray[] = [
  { id: 'RenalHyperkalemia', actionType: 'renal-hyperkalemia-response', supports: supportsRenalHyperkalemia, assessment: (r) => r?.renalHyperkalemia, opensSource: true, Component: RenalHyperkalemiaTray as LessonTray['Component'] },
  { id: 'RenalHypermagnesemia', actionType: 'renal-hypermagnesemia-response', supports: supportsRenalHypermagnesemia, assessment: (r) => r?.renalHypermagnesemia, opensSource: true, Component: RenalHypermagnesemiaTray as LessonTray['Component'] },
  { id: 'RenalContrastAttribution', actionType: 'renal-contrast-attribution-response', supports: supportsRenalContrastAttribution, assessment: (r) => r?.renalContrastAttribution, opensSource: true, Component: RenalContrastAttributionTray as LessonTray['Component'] },
  { id: 'RenalRhabdomyolysis', actionType: 'renal-rhabdomyolysis-response', supports: supportsRenalRhabdomyolysis, assessment: (r) => r?.renalRhabdomyolysis, opensSource: true, Component: RenalRhabdomyolysisTray as LessonTray['Component'] },
  { id: 'RenalHypomagnesemia', actionType: 'renal-hypomagnesemia-response', supports: supportsRenalHypomagnesemia, assessment: (r) => r?.renalHypomagnesemia, opensSource: true, Component: RenalHypomagnesemiaTray as LessonTray['Component'] },
  { id: 'RenalHypernatremia', actionType: 'renal-hypernatremia-response', supports: supportsRenalHypernatremia, assessment: (r) => r?.renalHypernatremia, opensSource: true, Component: RenalHypernatremiaTray as LessonTray['Component'] },
  { id: 'RenalHypocalcemia', actionType: 'renal-hypocalcemia-response', supports: supportsRenalHypocalcemia, assessment: (r) => r?.renalHypocalcemia, opensSource: true, Component: RenalHypocalcemiaTray as LessonTray['Component'] },
  { id: 'RenalHypokalemia', actionType: 'renal-hypokalemia-response', supports: supportsRenalHypokalemia, assessment: (r) => r?.renalHypokalemia, opensSource: true, Component: RenalHypokalemiaTray as LessonTray['Component'] },
  { id: 'RenalHyponatremia', actionType: 'renal-hyponatremia-response', supports: supportsRenalHyponatremia, assessment: (r) => r?.renalHyponatremia, opensSource: true, Component: RenalHyponatremiaTray as LessonTray['Component'] },
];
