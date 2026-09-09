/**
 * pediatrics's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/pediatrics.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { bronchiolitisDemonstrationStep, supportsBronchiolitisDemonstration } from './bronchiolitis-demonstration';
import { croupDemonstrationStep, supportsCroupDemonstration } from './croup-demonstration';
import { pediatricAnaphylaxisDemonstrationStep, supportsPediatricAnaphylaxisDemonstration } from './pediatric-anaphylaxis-demonstration';
import { pediatricBradycardicArrestDemonstrationStep, supportsPediatricBradycardicArrestDemonstration } from './pediatric-bradycardic-arrest-demonstration';
import { pediatricDehydrationDemonstrationStep, supportsPediatricDehydrationDemonstration } from './pediatric-dehydration-demonstration';
import { pediatricDkaDemonstrationStep, supportsPediatricDkaDemonstration } from './pediatric-dka-demonstration';
import { pediatricFbaoDemonstrationStep, supportsPediatricFbaoDemonstration } from './pediatric-fbao-demonstration';
import { pediatricFebrileSeizureDemonstrationStep, supportsPediatricFebrileSeizureDemonstration } from './pediatric-febrile-seizure-demonstration';
import { pediatricHypoglycemicSeizureDemonstrationStep, supportsPediatricHypoglycemicSeizureDemonstration } from './pediatric-hypoglycemic-seizure-demonstration';
import { pediatricInjurySafeguardingDemonstrationStep, supportsPediatricInjurySafeguardingDemonstration } from './pediatric-injury-safeguarding-demonstration';
import { pediatricRespiratoryDistressDemonstrationStep, supportsPediatricRespiratoryDistressDemonstration } from './pediatric-respiratory-distress-demonstration';
import { pediatricSepsisDemonstrationStep, supportsPediatricSepsisDemonstration } from './pediatric-sepsis-demonstration';
import { pediatricSepticShockDemonstrationStep, supportsPediatricSepticShockDemonstration } from './pediatric-septic-shock-demonstration';
import { pediatricStatusAsthmaticusDemonstrationStep, supportsPediatricStatusAsthmaticusDemonstration } from './pediatric-status-asthmaticus-demonstration';
import { pediatricStatusEpilepticusDemonstrationStep, supportsPediatricStatusEpilepticusDemonstration } from './pediatric-status-epilepticus-demonstration';
import { pediatricSvtDemonstrationStep, supportsPediatricSvtDemonstration } from './pediatric-svt-demonstration';

export const PEDIATRICS_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'Bronchiolitis', supports: supportsBronchiolitisDemonstration, actionType: 'bronchiolitis-response', step: (r) => bronchiolitisDemonstrationStep(r?.bronchiolitisAssessment) },
  { id: 'Croup', supports: supportsCroupDemonstration, actionType: 'croup-response', step: (r) => croupDemonstrationStep(r?.croupAssessment) },
  { id: 'PediatricAnaphylaxis', supports: supportsPediatricAnaphylaxisDemonstration, actionType: 'pediatric-anaphylaxis-response', step: (r) => pediatricAnaphylaxisDemonstrationStep(r?.pediatricAnaphylaxisAssessment) },
  { id: 'PediatricBradycardicArrest', supports: supportsPediatricBradycardicArrestDemonstration, actionType: 'pediatric-bradycardic-arrest-response', step: (r) => pediatricBradycardicArrestDemonstrationStep(r?.pediatricBradycardicArrestAssessment) },
  { id: 'PediatricDehydration', supports: supportsPediatricDehydrationDemonstration, actionType: 'pediatric-dehydration-response', step: (r) => pediatricDehydrationDemonstrationStep(r?.pediatricDehydrationAssessment) },
  { id: 'PediatricDka', supports: supportsPediatricDkaDemonstration, actionType: 'pediatric-diabetic-ketoacidosis-response', step: (r) => pediatricDkaDemonstrationStep(r?.pediatricDiabeticKetoacidosisAssessment) },
  { id: 'PediatricFbao', supports: supportsPediatricFbaoDemonstration, actionType: 'pediatric-foreign-body-airway-obstruction-response', step: (r) => pediatricFbaoDemonstrationStep(r?.pediatricForeignBodyAirwayObstructionAssessment) },
  { id: 'PediatricFebrileSeizure', supports: supportsPediatricFebrileSeizureDemonstration, actionType: 'pediatric-febrile-seizure-response', step: (r) => pediatricFebrileSeizureDemonstrationStep(r?.pediatricFebrileSeizureAssessment) },
  { id: 'PediatricHypoglycemicSeizure', supports: supportsPediatricHypoglycemicSeizureDemonstration, actionType: 'pediatric-hypoglycemic-seizure-response', step: (r) => pediatricHypoglycemicSeizureDemonstrationStep(r?.pediatricHypoglycemicSeizureAssessment) },
  { id: 'PediatricInjurySafeguarding', supports: supportsPediatricInjurySafeguardingDemonstration, actionType: 'pediatric-injury-safeguarding-escalation-response', step: (r) => pediatricInjurySafeguardingDemonstrationStep(r?.pediatricInjurySafeguardingAssessment) },
  { id: 'PediatricRespiratoryDistress', supports: supportsPediatricRespiratoryDistressDemonstration, actionType: 'pediatric-respiratory-distress-response', step: (r) => pediatricRespiratoryDistressDemonstrationStep(r?.pediatricRespiratoryDistressAssessment) },
  { id: 'PediatricSepsis', supports: supportsPediatricSepsisDemonstration, actionType: 'pediatric-sepsis-response', step: (r) => pediatricSepsisDemonstrationStep(r?.pediatricSepsisAssessment) },
  { id: 'PediatricSepticShock', supports: supportsPediatricSepticShockDemonstration, actionType: 'pediatric-septic-shock-response', step: (r) => pediatricSepticShockDemonstrationStep(r?.pediatricSepticShockAssessment) },
  { id: 'PediatricStatusAsthmaticus', supports: supportsPediatricStatusAsthmaticusDemonstration, actionType: 'pediatric-status-asthmaticus-response', step: (r) => pediatricStatusAsthmaticusDemonstrationStep(r?.pediatricStatusAsthmaticusAssessment) },
  { id: 'PediatricStatusEpilepticus', supports: supportsPediatricStatusEpilepticusDemonstration, actionType: 'pediatric-status-epilepticus-response', step: (r) => pediatricStatusEpilepticusDemonstrationStep(r?.pediatricStatusEpilepticusAssessment) },
  { id: 'PediatricSvt', supports: supportsPediatricSvtDemonstration, actionType: 'pediatric-supraventricular-tachycardia-response', step: (r) => pediatricSvtDemonstrationStep(r?.pediatricSupraventricularTachycardiaAssessment) },
];
