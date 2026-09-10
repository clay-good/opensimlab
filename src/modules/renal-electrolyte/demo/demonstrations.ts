/**
 * renal-electrolyte's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/renal-electrolyte.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { renalHyperkalemiaDemonstrationStep, supportsRenalHyperkalemiaDemonstration } from './renal-hyperkalemia-demonstration';
import { renalHypermagnesemiaDemonstrationStep, supportsRenalHypermagnesemiaDemonstration } from './renal-hypermagnesemia-demonstration';
import { renalContrastAttributionDemonstrationStep, supportsRenalContrastAttributionDemonstration } from './renal-contrast-attribution-demonstration';
import { renalRhabdomyolysisDemonstrationStep, supportsRenalRhabdomyolysisDemonstration } from './renal-rhabdomyolysis-demonstration';
import { renalEstimatedFiltrationDemonstrationStep, supportsRenalEstimatedFiltrationDemonstration } from './renal-estimated-filtration-demonstration';
import { renalHypomagnesemiaDemonstrationStep, supportsRenalHypomagnesemiaDemonstration } from './renal-hypomagnesemia-demonstration';
import { renalHypernatremiaDemonstrationStep, supportsRenalHypernatremiaDemonstration } from './renal-hypernatremia-demonstration';
import { renalHypocalcemiaDemonstrationStep, supportsRenalHypocalcemiaDemonstration } from './renal-hypocalcemia-demonstration';
import { renalHypokalemiaDemonstrationStep, supportsRenalHypokalemiaDemonstration } from './renal-hypokalemia-demonstration';
import { renalHyponatremiaDemonstrationStep, supportsRenalHyponatremiaDemonstration } from './renal-hyponatremia-demonstration';

export const RENAL_ELECTROLYTE_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'RenalHyperkalemia', supports: supportsRenalHyperkalemiaDemonstration, actionType: 'renal-hyperkalemia-response', step: (r) => renalHyperkalemiaDemonstrationStep(r?.renalHyperkalemia) },
  { id: 'RenalHypermagnesemia', supports: supportsRenalHypermagnesemiaDemonstration, actionType: 'renal-hypermagnesemia-response', step: (r) => renalHypermagnesemiaDemonstrationStep(r?.renalHypermagnesemia) },
  { id: 'RenalContrastAttribution', supports: supportsRenalContrastAttributionDemonstration, actionType: 'renal-contrast-attribution-response', step: (r) => renalContrastAttributionDemonstrationStep(r?.renalContrastAttribution) },
  { id: 'RenalEstimatedFiltration', supports: supportsRenalEstimatedFiltrationDemonstration, actionType: 'renal-estimated-filtration-response', step: (r) => renalEstimatedFiltrationDemonstrationStep(r?.renalEstimatedFiltration) },
  { id: 'RenalRhabdomyolysis', supports: supportsRenalRhabdomyolysisDemonstration, actionType: 'renal-rhabdomyolysis-response', step: (r) => renalRhabdomyolysisDemonstrationStep(r?.renalRhabdomyolysis) },
  { id: 'RenalHypomagnesemia', supports: supportsRenalHypomagnesemiaDemonstration, actionType: 'renal-hypomagnesemia-response', step: (r) => renalHypomagnesemiaDemonstrationStep(r?.renalHypomagnesemia) },
  { id: 'RenalHypernatremia', supports: supportsRenalHypernatremiaDemonstration, actionType: 'renal-hypernatremia-response', step: (r) => renalHypernatremiaDemonstrationStep(r?.renalHypernatremia) },
  { id: 'RenalHypocalcemia', supports: supportsRenalHypocalcemiaDemonstration, actionType: 'renal-hypocalcemia-response', step: (r) => renalHypocalcemiaDemonstrationStep(r?.renalHypocalcemia) },
  { id: 'RenalHypokalemia', supports: supportsRenalHypokalemiaDemonstration, actionType: 'renal-hypokalemia-response', step: (r) => renalHypokalemiaDemonstrationStep(r?.renalHypokalemia) },
  { id: 'RenalHyponatremia', supports: supportsRenalHyponatremiaDemonstration, actionType: 'renal-hyponatremia-response', step: (r) => renalHyponatremiaDemonstrationStep(r?.renalHyponatremia) },
];
