/**
 * neurology's action trays, handed to the cockpit by the module's route.
 *
 * Each was written inline in `ActionCockpit.tsx` behind a gate computed from the scenario,
 * which meant every module downloaded every one of them. The gate moves here as the tray's
 * `supports` predicate, unchanged.
 */
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import { NeurologyMinorStrokeTray } from './NeurologyMinorStrokeTray';
import { NeurologyBasilarLvoTray } from './NeurologyBasilarLvoTray';
import { NeurologyCerebellarIchTray } from './NeurologyCerebellarIchTray';
import { NeurologyAsahDeteriorationTray } from './NeurologyAsahDeteriorationTray';
import { NeurologyFocalMotorStatusTray } from './NeurologyFocalMotorStatusTray';
import { NeurologyNcseTray } from './NeurologyNcseTray';
import { NeurologyMyasthenicCrisisTray } from './NeurologyMyasthenicCrisisTray';
import { NeurologyGbsTray } from './NeurologyGbsTray';
import { NeurologyMeningitisTray } from './NeurologyMeningitisTray';
import { NeurologyEncephalitisTray } from './NeurologyEncephalitisTray';
import { NeurologyRaisedIcpTray } from './NeurologyRaisedIcpTray';
import { NeurologyHerniationTray } from './NeurologyHerniationTray';
import { NeurologyMsccTray } from './NeurologyMsccTray';
import { NeurologyDeliriumTray } from './NeurologyDeliriumTray';
import { NeurologyAutonomicDysreflexiaTray } from './NeurologyAutonomicDysreflexiaTray';

export const NEUROLOGY_TRAYS: readonly LessonTray[] = [
  {
    id: 'NeurologyMinorStroke',
    demoId: 'MinorStroke',
    actionType: 'minor-nondisabling-acute-ischemic-stroke-response',
    supports: (scenario) => scenario.metadata.id === 'minor-nondisabling-acute-ischemic-stroke'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'minor-nondisabling-acute-ischemic-stroke-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'minor-nondisabling-acute-ischemic-stroke-reassessment-boundary'),
    assessment: (r) => r?.neurologyMinorStrokeAssessment,
    Component: NeurologyMinorStrokeTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyBasilarLvo',
    demoId: 'BasilarLvo',
    actionType: 'basilar-artery-occlusion-escalation-response',
    supports: (scenario) => scenario.metadata.id === 'basilar-artery-occlusion-escalation'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'basilar-artery-occlusion-escalation-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'basilar-artery-occlusion-escalation-reassessment-boundary'),
    assessment: (r) => r?.neurologyBasilarLvoAssessment,
    Component: NeurologyBasilarLvoTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyCerebellarIch',
    demoId: 'CerebellarIch',
    actionType: 'spontaneous-cerebellar-intracerebral-hemorrhage-response',
    supports: (scenario) => scenario.metadata.id === 'spontaneous-cerebellar-intracerebral-hemorrhage'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment-boundary'),
    assessment: (r) => r?.neurologyCerebellarIchAssessment,
    Component: NeurologyCerebellarIchTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyAsahDeterioration',
    demoId: 'Asah',
    actionType: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response',
    supports: (scenario) => scenario.metadata.id === 'aneurysmal-subarachnoid-hemorrhage-deterioration'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'aneurysmal-subarachnoid-hemorrhage-deterioration-reassessment-boundary'),
    assessment: (r) => r?.neurologyAsahAssessment,
    Component: NeurologyAsahDeteriorationTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyFocalMotorStatus',
    demoId: 'FocalMotorStatus',
    actionType: 'focal-motor-status-epilepticus-escalation-response',
    supports: (scenario) => scenario.metadata.id === 'focal-motor-status-epilepticus-escalation'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'focal-motor-status-epilepticus-escalation-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'focal-motor-status-epilepticus-escalation-reassessment-boundary'),
    assessment: (r) => r?.neurologyFocalMotorStatusAssessment,
    Component: NeurologyFocalMotorStatusTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyNcse',
    demoId: 'Ncse',
    actionType: 'nonconvulsive-status-epilepticus-recognition-response',
    supports: (scenario) => scenario.metadata.id === 'nonconvulsive-status-epilepticus-recognition'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'nonconvulsive-status-epilepticus-recognition-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'nonconvulsive-status-epilepticus-recognition-reassessment-boundary'),
    assessment: (r) => r?.neurologyNcseAssessment,
    Component: NeurologyNcseTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyMyasthenicCrisis',
    demoId: 'Myasthenia',
    actionType: 'myasthenic-crisis-escalation-response',
    supports: (scenario) => scenario.metadata.id === 'myasthenic-crisis-escalation'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'myasthenic-crisis-escalation-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'myasthenic-crisis-escalation-reassessment-boundary'),
    assessment: (r) => r?.neurologyMyasthenicCrisisAssessment,
    Component: NeurologyMyasthenicCrisisTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyGbs',
    demoId: 'Gbs',
    actionType: 'guillain-barre-respiratory-decline-response',
    supports: (scenario) => scenario.metadata.id === 'guillain-barre-respiratory-decline'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'guillain-barre-respiratory-decline-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'guillain-barre-respiratory-decline-reassessment-boundary'),
    assessment: (r) => r?.neurologyGbsAssessment,
    Component: NeurologyGbsTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyMeningitis',
    demoId: 'Meningitis',
    actionType: 'acute-bacterial-meningitis-first-hour-response',
    supports: (scenario) => scenario.metadata.id === 'acute-bacterial-meningitis-first-hour'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-bacterial-meningitis-first-hour-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-bacterial-meningitis-first-hour-reassessment-boundary'),
    assessment: (r) => r?.neurologyMeningitisAssessment,
    Component: NeurologyMeningitisTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyEncephalitis',
    demoId: 'Encephalitis',
    actionType: 'suspected-herpes-simplex-encephalitis-response',
    supports: (scenario) => scenario.metadata.id === 'suspected-herpes-simplex-encephalitis'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'suspected-herpes-simplex-encephalitis-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'suspected-herpes-simplex-encephalitis-reassessment-boundary'),
    assessment: (r) => r?.neurologyEncephalitisAssessment,
    Component: NeurologyEncephalitisTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyRaisedIcp',
    demoId: 'RaisedIcp',
    actionType: 'raised-intracranial-pressure-visual-threat-response',
    supports: (scenario) => scenario.metadata.id === 'raised-intracranial-pressure-visual-threat'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'raised-intracranial-pressure-visual-threat-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'raised-intracranial-pressure-visual-threat-reassessment-boundary'),
    assessment: (r) => r?.neurologyRaisedIcpAssessment,
    Component: NeurologyRaisedIcpTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyHerniation',
    demoId: 'Herniation',
    actionType: 'acute-transtentorial-herniation-pattern-response',
    supports: (scenario) => scenario.metadata.id === 'acute-transtentorial-herniation-pattern'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-transtentorial-herniation-pattern-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'acute-transtentorial-herniation-pattern-reassessment-boundary'),
    assessment: (r) => r?.neurologyHerniationAssessment,
    Component: NeurologyHerniationTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyMscc',
    demoId: 'Mscc',
    actionType: 'metastatic-spinal-cord-compression-response',
    supports: (scenario) => scenario.metadata.id === 'metastatic-spinal-cord-compression'
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'metastatic-spinal-cord-compression-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative'
      && event.target === 'metastatic-spinal-cord-compression-reassessment-boundary'),
    assessment: (r) => r?.neurologyMsccAssessment,
    Component: NeurologyMsccTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyDelirium',
    demoId: 'Delirium',
    actionType: 'acute-delirium-reversible-causes-response',
    supports: (scenario) => scenario.metadata.id === 'acute-delirium-reversible-causes'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'acute-delirium-reversible-causes-reassessment')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'acute-delirium-reversible-causes-reassessment-boundary'),
    assessment: (r) => r?.neurologyDeliriumAssessment,
    Component: NeurologyDeliriumTray as LessonTray['Component'],
  },
  {
    id: 'NeurologyAutonomicDysreflexia',
    demoId: 'Dysreflexia',
    actionType: 'autonomic-dysreflexia-authored-trigger-response',
    supports: (scenario) => scenario.metadata.id === 'autonomic-dysreflexia-authored-trigger'
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'autonomic-dysreflexia-authored-trigger-transition')
    && scenario.timeline.some((event) => event.type === 'narrative' && event.target === 'autonomic-dysreflexia-authored-trigger-transition-boundary'),
    assessment: (r) => r?.neurologyAutonomicDysreflexiaAssessment,
    Component: NeurologyAutonomicDysreflexiaTray as LessonTray['Component'],
  },
];
