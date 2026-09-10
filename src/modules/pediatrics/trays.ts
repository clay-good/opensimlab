/**
 * pediatrics's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { PediatricRespiratoryDistressTray } from './PediatricRespiratoryDistressTray';
import { BronchiolitisTray } from './BronchiolitisTray';
import { CroupTray } from './CroupTray';
import { PediatricStatusAsthmaticusTray } from './PediatricStatusAsthmaticusTray';
import { PediatricSepsisTray } from './PediatricSepsisTray';
import { PediatricSepticShockTray } from './PediatricSepticShockTray';
import { PediatricDehydrationTray } from './PediatricDehydrationTray';
import { PediatricDiabeticKetoacidosisTray } from './PediatricDiabeticKetoacidosisTray';
import { PediatricHypoglycemicSeizureTray } from './PediatricHypoglycemicSeizureTray';
import { PediatricFebrileSeizureTray } from './PediatricFebrileSeizureTray';
import { PediatricStatusEpilepticusTray } from './PediatricStatusEpilepticusTray';
import { PediatricAnaphylaxisTray } from './PediatricAnaphylaxisTray';
import { PediatricSupraventricularTachycardiaTray } from './PediatricSupraventricularTachycardiaTray';
import { PediatricBradycardicArrestTray } from './PediatricBradycardicArrestTray';
import { PediatricForeignBodyAirwayObstructionTray } from './PediatricForeignBodyAirwayObstructionTray';
import { PediatricInjurySafeguardingTray } from './PediatricInjurySafeguardingTray';

export const PEDIATRICS_TRAYS: readonly LessonTray[] = [
  {
    id: 'PediatricRespiratoryDistress',
    actionType: 'pediatric-respiratory-distress-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative'
      && event.target === 'pediatric-respiratory-distress-reassessment',
    ),
    assessment: (r) => r?.pediatricRespiratoryDistressAssessment,
    Component: PediatricRespiratoryDistressTray as LessonTray['Component'],
  },
  {
    id: 'Bronchiolitis',
    actionType: 'bronchiolitis-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'bronchiolitis-reassessment',
    ),
    assessment: (r) => r?.bronchiolitisAssessment,
    Component: BronchiolitisTray as LessonTray['Component'],
  },
  {
    id: 'Croup',
    actionType: 'croup-response',
    supports: (scenario) => scenario.timeline.some(
    (event) => event.type === 'narrative' && event.target === 'croup-reassessment',
    ),
    assessment: (r) => r?.croupAssessment,
    Component: CroupTray as LessonTray['Component'],
  },
  {
    id: 'PediatricStatusAsthmaticus',
    actionType: 'pediatric-status-asthmaticus-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-status-asthmaticus'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-status-asthmaticus-reassessment'),
    assessment: (r) => r?.pediatricStatusAsthmaticusAssessment,
    Component: PediatricStatusAsthmaticusTray as LessonTray['Component'],
  },
  {
    id: 'PediatricSepsis',
    actionType: 'pediatric-sepsis-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-sepsis'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-sepsis-reassessment'),
    assessment: (r) => r?.pediatricSepsisAssessment,
    Component: PediatricSepsisTray as LessonTray['Component'],
  },
  {
    id: 'PediatricSepticShock',
    actionType: 'pediatric-septic-shock-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-septic-shock'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-septic-shock-reassessment'),
    assessment: (r) => r?.pediatricSepticShockAssessment,
    Component: PediatricSepticShockTray as LessonTray['Component'],
  },
  {
    id: 'PediatricDehydration',
    actionType: 'pediatric-dehydration-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-dehydration-with-hypovolemia'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-dehydration-with-hypovolemia-reassessment'),
    assessment: (r) => r?.pediatricDehydrationAssessment,
    Component: PediatricDehydrationTray as LessonTray['Component'],
  },
  {
    id: 'PediatricDiabeticKetoacidosis',
    demoId: 'PediatricDka',
    actionType: 'pediatric-diabetic-ketoacidosis-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-diabetic-ketoacidosis'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-diabetic-ketoacidosis-reassessment'),
    assessment: (r) => r?.pediatricDiabeticKetoacidosisAssessment,
    Component: PediatricDiabeticKetoacidosisTray as LessonTray['Component'],
  },
  {
    id: 'PediatricHypoglycemicSeizure',
    actionType: 'pediatric-hypoglycemic-seizure-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-hypoglycemic-seizure'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-hypoglycemic-seizure-reassessment'),
    assessment: (r) => r?.pediatricHypoglycemicSeizureAssessment,
    Component: PediatricHypoglycemicSeizureTray as LessonTray['Component'],
  },
  {
    id: 'PediatricFebrileSeizure',
    actionType: 'pediatric-febrile-seizure-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-febrile-seizure'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-febrile-seizure-reassessment'),
    assessment: (r) => r?.pediatricFebrileSeizureAssessment,
    Component: PediatricFebrileSeizureTray as LessonTray['Component'],
  },
  {
    id: 'PediatricStatusEpilepticus',
    actionType: 'pediatric-status-epilepticus-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-status-epilepticus'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-status-epilepticus-reassessment'),
    assessment: (r) => r?.pediatricStatusEpilepticusAssessment,
    Component: PediatricStatusEpilepticusTray as LessonTray['Component'],
  },
  {
    id: 'PediatricAnaphylaxis',
    actionType: 'pediatric-anaphylaxis-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-anaphylaxis'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-anaphylaxis-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-anaphylaxis-reassessment-boundary'),
    assessment: (r) => r?.pediatricAnaphylaxisAssessment,
    Component: PediatricAnaphylaxisTray as LessonTray['Component'],
  },
  {
    id: 'PediatricSupraventricularTachycardia',
    demoId: 'PediatricSvt',
    actionType: 'pediatric-supraventricular-tachycardia-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-supraventricular-tachycardia'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-supraventricular-tachycardia-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-supraventricular-tachycardia-reassessment-boundary'),
    assessment: (r) => r?.pediatricSupraventricularTachycardiaAssessment,
    Component: PediatricSupraventricularTachycardiaTray as LessonTray['Component'],
  },
  {
    id: 'PediatricBradycardicArrest',
    actionType: 'pediatric-bradycardic-arrest-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-bradycardic-arrest'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-bradycardic-arrest-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-bradycardic-arrest-reassessment-boundary'),
    assessment: (r) => r?.pediatricBradycardicArrestAssessment,
    Component: PediatricBradycardicArrestTray as LessonTray['Component'],
  },
  {
    id: 'PediatricForeignBodyAirwayObstruction',
    demoId: 'PediatricFbao',
    actionType: 'pediatric-foreign-body-airway-obstruction-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-foreign-body-airway-obstruction'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-foreign-body-airway-obstruction-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-foreign-body-airway-obstruction-reassessment-boundary'),
    assessment: (r) => r?.pediatricForeignBodyAirwayObstructionAssessment,
    Component: PediatricForeignBodyAirwayObstructionTray as LessonTray['Component'],
  },
  {
    id: 'PediatricInjurySafeguarding',
    actionType: 'pediatric-injury-safeguarding-escalation-response',
    supports: (scenario) => scenario.metadata.id === 'pediatric-injury-safeguarding-escalation'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-injury-safeguarding-escalation-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'pediatric-injury-safeguarding-escalation-reassessment-boundary'),
    assessment: (r) => r?.pediatricInjurySafeguardingAssessment,
    Component: PediatricInjurySafeguardingTray as LessonTray['Component'],
  },
];
