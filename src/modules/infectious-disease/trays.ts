/**
 * infectious-disease's action trays, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's tray controls, labels and tutor prose and
 * nothing else. The cockpit used to import all 48 lesson trays, which measured 98.9 KB gz
 * of the chunk every module downloads.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { EndocarditisHeartFailureTray } from './EndocarditisHeartFailureTray';
import { FebrileNeutropeniaTray } from './FebrileNeutropeniaTray';
import { MeningitisImagingTray } from './MeningitisImagingTray';
import { MeningococcalSepsisTray } from './MeningococcalSepsisTray';
import { NecrotizingInfectionTray } from './NecrotizingInfectionTray';
import { ObstructedKidneyTray } from './ObstructedKidneyTray';
import { PossibleSepsisTray } from './PossibleSepsisTray';
import { SepticShockLabelTray } from './SepticShockLabelTray';
import { SeverePneumoniaTray } from './SeverePneumoniaTray';
import { ToxicShockTray } from './ToxicShockTray';
import { supportsEndocarditisHeartFailure } from './endocarditis-heart-failure';
import { supportsFebrileNeutropenia } from './febrile-neutropenia';
import { supportsMeningitisImaging } from './meningitis-imaging';
import { supportsMeningococcalSepsis } from './meningococcal-sepsis';
import { supportsNecrotizingInfection } from './necrotizing-infection';
import { supportsObstructedKidney } from './obstructed-kidney';
import { supportsPossibleSepsis } from './possible-sepsis';
import { supportsSepticShockLabel } from './septic-shock-label';
import { supportsSeverePneumonia } from './severe-pneumonia';
import { supportsToxicShock } from './toxic-shock';

export const INFECTIOUS_DISEASE_TRAYS: readonly LessonTray[] = [
  { id: 'EndocarditisHeartFailure', actionType: 'endocarditis-heart-failure-response', supports: supportsEndocarditisHeartFailure, assessment: (r) => r?.endocarditisHeartFailure, Component: EndocarditisHeartFailureTray as LessonTray['Component'] },
  { id: 'FebrileNeutropenia', actionType: 'febrile-neutropenia-response', supports: supportsFebrileNeutropenia, assessment: (r) => r?.febrileNeutropenia, Component: FebrileNeutropeniaTray as LessonTray['Component'] },
  { id: 'MeningitisImaging', actionType: 'meningitis-imaging-response', supports: supportsMeningitisImaging, assessment: (r) => r?.meningitisImaging, Component: MeningitisImagingTray as LessonTray['Component'] },
  { id: 'MeningococcalSepsis', actionType: 'meningococcal-sepsis-response', supports: supportsMeningococcalSepsis, assessment: (r) => r?.meningococcalSepsis, Component: MeningococcalSepsisTray as LessonTray['Component'] },
  { id: 'NecrotizingInfection', actionType: 'necrotizing-infection-response', supports: supportsNecrotizingInfection, assessment: (r) => r?.necrotizingInfection, Component: NecrotizingInfectionTray as LessonTray['Component'] },
  { id: 'ObstructedKidney', actionType: 'obstructed-kidney-response', supports: supportsObstructedKidney, assessment: (r) => r?.obstructedKidney, Component: ObstructedKidneyTray as LessonTray['Component'] },
  { id: 'PossibleSepsis', actionType: 'possible-sepsis-response', supports: supportsPossibleSepsis, assessment: (r) => r?.possibleSepsis, Component: PossibleSepsisTray as LessonTray['Component'] },
  { id: 'SepticShockLabel', actionType: 'septic-shock-label-response', supports: supportsSepticShockLabel, assessment: (r) => r?.septicShockLabel, Component: SepticShockLabelTray as LessonTray['Component'] },
  { id: 'SeverePneumonia', actionType: 'severe-pneumonia-response', supports: supportsSeverePneumonia, assessment: (r) => r?.severePneumonia, Component: SeverePneumoniaTray as LessonTray['Component'] },
  { id: 'ToxicShock', actionType: 'toxic-shock-response', supports: supportsToxicShock, assessment: (r) => r?.toxicShock, Component: ToxicShockTray as LessonTray['Component'] },
];
