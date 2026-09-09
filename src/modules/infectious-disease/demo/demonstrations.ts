/**
 * infectious-disease's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/infectious-disease.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { endocarditisHeartFailureDemonstrationStep, supportsEndocarditisHeartFailureDemonstration } from './endocarditis-heart-failure-demonstration';
import { febrileNeutropeniaDemonstrationStep, supportsFebrileNeutropeniaDemonstration } from './febrile-neutropenia-demonstration';
import { meningitisImagingDemonstrationStep, supportsMeningitisImagingDemonstration } from './meningitis-imaging-demonstration';
import { meningococcalSepsisDemonstrationStep, supportsMeningococcalSepsisDemonstration } from './meningococcal-sepsis-demonstration';
import { necrotizingInfectionDemonstrationStep, supportsNecrotizingInfectionDemonstration } from './necrotizing-infection-demonstration';
import { obstructedKidneyDemonstrationStep, supportsObstructedKidneyDemonstration } from './obstructed-kidney-demonstration';
import { possibleSepsisDemonstrationStep, supportsPossibleSepsisDemonstration } from './possible-sepsis-demonstration';
import { septicShockLabelDemonstrationStep, supportsSepticShockLabelDemonstration } from './septic-shock-label-demonstration';
import { severePneumoniaDemonstrationStep, supportsSeverePneumoniaDemonstration } from './severe-pneumonia-demonstration';
import { supportsToxicShockDemonstration, toxicShockDemonstrationStep } from './toxic-shock-demonstration';

export const INFECTIOUS_DISEASE_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'EndocarditisHeartFailure', supports: supportsEndocarditisHeartFailureDemonstration, actionType: 'endocarditis-heart-failure-response', step: (r) => endocarditisHeartFailureDemonstrationStep(r?.endocarditisHeartFailure) },
  { id: 'FebrileNeutropenia', supports: supportsFebrileNeutropeniaDemonstration, actionType: 'febrile-neutropenia-response', step: (r) => febrileNeutropeniaDemonstrationStep(r?.febrileNeutropenia) },
  { id: 'MeningitisImaging', supports: supportsMeningitisImagingDemonstration, actionType: 'meningitis-imaging-response', step: (r) => meningitisImagingDemonstrationStep(r?.meningitisImaging) },
  { id: 'MeningococcalSepsis', supports: supportsMeningococcalSepsisDemonstration, actionType: 'meningococcal-sepsis-response', step: (r) => meningococcalSepsisDemonstrationStep(r?.meningococcalSepsis) },
  { id: 'NecrotizingInfection', supports: supportsNecrotizingInfectionDemonstration, actionType: 'necrotizing-infection-response', step: (r) => necrotizingInfectionDemonstrationStep(r?.necrotizingInfection) },
  { id: 'ObstructedKidney', supports: supportsObstructedKidneyDemonstration, actionType: 'obstructed-kidney-response', step: (r) => obstructedKidneyDemonstrationStep(r?.obstructedKidney) },
  { id: 'PossibleSepsis', supports: supportsPossibleSepsisDemonstration, actionType: 'possible-sepsis-response', step: (r) => possibleSepsisDemonstrationStep(r?.possibleSepsis) },
  { id: 'SepticShockLabel', supports: supportsSepticShockLabelDemonstration, actionType: 'septic-shock-label-response', step: (r) => septicShockLabelDemonstrationStep(r?.septicShockLabel) },
  { id: 'SeverePneumonia', supports: supportsSeverePneumoniaDemonstration, actionType: 'severe-pneumonia-response', step: (r) => severePneumoniaDemonstrationStep(r?.severePneumonia) },
  { id: 'ToxicShock', supports: supportsToxicShockDemonstration, actionType: 'toxic-shock-response', step: (r) => toxicShockDemonstrationStep(r?.toxicShock) },
];
