/**
 * obstetrics's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/obstetrics.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { concealedAbruptionDemonstrationStep, supportsConcealedAbruptionDemonstration } from './concealed-placental-abruption-hemorrhage-demonstration';
import { eclampsiaDemonstrationStep, supportsEclampsiaDemonstration } from './eclampsia-first-seizure-response-demonstration';
import { failedIntubationDemonstrationStep, supportsFailedIntubationDemonstration } from './failed-obstetric-intubation-oxygenation-first-demonstration';
import { highNeuraxialDemonstrationStep, supportsHighNeuraxialDemonstration } from './high-neuraxial-block-obstetric-coordination-demonstration';
import { magnesiumToxicityDemonstrationStep, supportsMagnesiumToxicityDemonstration } from './magnesium-sulfate-toxicity-recognition-demonstration';
import { maternalArrestDemonstrationStep, supportsMaternalArrestDemonstration } from './maternal-cardiac-arrest-coordinated-response-demonstration';
import { maternalSepsisDemonstrationStep, supportsMaternalSepsisDemonstration } from './maternal-sepsis-postpartum-deterioration-demonstration';
import { maternalNeonatalHandoffDemonstrationStep, supportsMaternalNeonatalHandoffDemonstration } from './maternal-to-neonatal-resuscitation-handoff-demonstration';
import { oxytocinTachysystoleDemonstrationStep, supportsOxytocinTachysystoleDemonstration } from './oxytocin-associated-uterine-tachysystole-demonstration';
import { atonyDemonstrationStep, supportsAtonyDemonstration } from './postpartum-hemorrhage-uterine-atony-demonstration';
import { postpartumPreeclampsiaDemonstrationStep, supportsPostpartumPreeclampsiaDemonstration } from './postpartum-severe-preeclampsia-warning-signs-demonstration';
import { shoulderDystociaDemonstrationStep, supportsShoulderDystociaDemonstration } from './shoulder-dystocia-cognitive-sequence-demonstration';
import { afeDemonstrationStep, supportsAfeDemonstration } from './suspected-amniotic-fluid-embolism-pattern-demonstration';
import { supportsUterineRuptureDemonstration, uterineRuptureDemonstrationStep } from './suspected-uterine-rupture-recognition-demonstration';
import { cordProlapseDemonstrationStep, supportsCordProlapseDemonstration } from './umbilical-cord-prolapse-urgent-birth-coordination-demonstration';

export const OBSTETRICS_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'Afe', supports: supportsAfeDemonstration, actionType: 'suspected-amniotic-fluid-embolism-pattern-response', step: (r) => afeDemonstrationStep(r?.obstetricsAfeAssessment) },
  { id: 'Atony', supports: supportsAtonyDemonstration, actionType: 'postpartum-hemorrhage-uterine-atony-response', step: (r) => atonyDemonstrationStep(r?.obstetricsAtonyAssessment) },
  { id: 'ConcealedAbruption', supports: supportsConcealedAbruptionDemonstration, actionType: 'concealed-placental-abruption-hemorrhage-response', step: (r) => concealedAbruptionDemonstrationStep(r?.obstetricsConcealedAbruptionAssessment) },
  { id: 'CordProlapse', supports: supportsCordProlapseDemonstration, actionType: 'umbilical-cord-prolapse-urgent-birth-coordination-response', step: (r) => cordProlapseDemonstrationStep(r?.obstetricsCordProlapseAssessment) },
  { id: 'Eclampsia', supports: supportsEclampsiaDemonstration, actionType: 'eclampsia-first-seizure-response', step: (r) => eclampsiaDemonstrationStep(r?.obstetricsEclampsiaAssessment) },
  { id: 'FailedIntubation', supports: supportsFailedIntubationDemonstration, actionType: 'failed-obstetric-intubation-oxygenation-first-response', step: (r) => failedIntubationDemonstrationStep(r?.obstetricsFailedIntubationAssessment) },
  { id: 'HighNeuraxial', supports: supportsHighNeuraxialDemonstration, actionType: 'high-neuraxial-block-obstetric-coordination-response', step: (r) => highNeuraxialDemonstrationStep(r?.obstetricsHighNeuraxialAssessment) },
  { id: 'MagnesiumToxicity', supports: supportsMagnesiumToxicityDemonstration, actionType: 'magnesium-sulfate-toxicity-recognition-response', step: (r) => magnesiumToxicityDemonstrationStep(r?.obstetricsMagnesiumToxicityAssessment) },
  { id: 'MaternalArrest', supports: supportsMaternalArrestDemonstration, actionType: 'maternal-cardiac-arrest-response', step: (r) => maternalArrestDemonstrationStep(r?.obstetricsMaternalArrestAssessment) },
  { id: 'MaternalNeonatalHandoff', supports: supportsMaternalNeonatalHandoffDemonstration, actionType: 'maternal-to-neonatal-resuscitation-handoff-response', step: (r) => maternalNeonatalHandoffDemonstrationStep(r?.obstetricsMaternalNeonatalHandoffAssessment) },
  { id: 'MaternalSepsis', supports: supportsMaternalSepsisDemonstration, actionType: 'maternal-sepsis-postpartum-deterioration-response', step: (r) => maternalSepsisDemonstrationStep(r?.obstetricsMaternalSepsisAssessment) },
  { id: 'OxytocinTachysystole', supports: supportsOxytocinTachysystoleDemonstration, actionType: 'oxytocin-associated-uterine-tachysystole-response', step: (r) => oxytocinTachysystoleDemonstrationStep(r?.obstetricsOxytocinTachysystoleAssessment) },
  { id: 'PostpartumPreeclampsia', supports: supportsPostpartumPreeclampsiaDemonstration, actionType: 'postpartum-severe-preeclampsia-warning-signs-response', step: (r) => postpartumPreeclampsiaDemonstrationStep(r?.obstetricsPostpartumPreeclampsiaAssessment) },
  { id: 'ShoulderDystocia', supports: supportsShoulderDystociaDemonstration, actionType: 'shoulder-dystocia-cognitive-sequence-response', step: (r) => shoulderDystociaDemonstrationStep(r?.obstetricsShoulderDystociaAssessment) },
  { id: 'UterineRupture', supports: supportsUterineRuptureDemonstration, actionType: 'suspected-uterine-rupture-recognition-response', step: (r) => uterineRuptureDemonstrationStep(r?.obstetricsUterineRuptureAssessment) },
];
