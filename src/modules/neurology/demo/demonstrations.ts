/**
 * neurology's worked examples, handed to the cockpit by the module's route.
 *
 * Importing this file pulls this module's lesson narration and nothing else.
 * `src/routes/modules/neurology.tsx` is the only importer, so the narration lands in
 * this module's chunk instead of the shared cockpit chunk every module downloads.
 */
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { meningitisDemonstrationStep, supportsMeningitisDemonstration } from './acute-bacterial-meningitis-first-hour-demonstration';
import { deliriumDemonstrationStep, supportsDeliriumDemonstration } from './acute-delirium-reversible-causes-demonstration';
import { herniationDemonstrationStep, supportsHerniationDemonstration } from './acute-transtentorial-herniation-pattern-demonstration';
import { asahDemonstrationStep, supportsAsahDemonstration } from './aneurysmal-subarachnoid-hemorrhage-deterioration-demonstration';
import { dysreflexiaDemonstrationStep, supportsDysreflexiaDemonstration } from './autonomic-dysreflexia-authored-trigger-demonstration';
import { basilarLvoDemonstrationStep, supportsBasilarLvoDemonstration } from './basilar-artery-occlusion-escalation-demonstration';
import { focalMotorStatusDemonstrationStep, supportsFocalMotorStatusDemonstration } from './focal-motor-status-epilepticus-escalation-demonstration';
import { gbsDemonstrationStep, supportsGbsDemonstration } from './guillain-barre-respiratory-decline-demonstration';
import { msccDemonstrationStep, supportsMsccDemonstration } from './metastatic-spinal-cord-compression-demonstration';
import { minorStrokeDemonstrationStep, supportsMinorStrokeDemonstration } from './minor-nondisabling-acute-ischemic-stroke-demonstration';
import { myastheniaDemonstrationStep, supportsMyastheniaDemonstration } from './myasthenic-crisis-escalation-demonstration';
import { ncseDemonstrationStep, supportsNcseDemonstration } from './nonconvulsive-status-epilepticus-recognition-demonstration';
import { raisedIcpDemonstrationStep, supportsRaisedIcpDemonstration } from './raised-intracranial-pressure-visual-threat-demonstration';
import { cerebellarIchDemonstrationStep, supportsCerebellarIchDemonstration } from './spontaneous-cerebellar-intracerebral-hemorrhage-demonstration';
import { encephalitisDemonstrationStep, supportsEncephalitisDemonstration } from './suspected-herpes-simplex-encephalitis-demonstration';

export const NEUROLOGY_DEMONSTRATIONS: readonly LessonDemonstration[] = [
  { id: 'Asah', supports: supportsAsahDemonstration, actionType: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response', step: (r) => asahDemonstrationStep(r?.neurologyAsahAssessment) },
  { id: 'BasilarLvo', supports: supportsBasilarLvoDemonstration, actionType: 'basilar-artery-occlusion-escalation-response', step: (r) => basilarLvoDemonstrationStep(r?.neurologyBasilarLvoAssessment) },
  { id: 'CerebellarIch', supports: supportsCerebellarIchDemonstration, actionType: 'spontaneous-cerebellar-intracerebral-hemorrhage-response', step: (r) => cerebellarIchDemonstrationStep(r?.neurologyCerebellarIchAssessment) },
  { id: 'Delirium', supports: supportsDeliriumDemonstration, actionType: 'acute-delirium-reversible-causes-response', step: (r) => deliriumDemonstrationStep(r?.neurologyDeliriumAssessment) },
  { id: 'Dysreflexia', supports: supportsDysreflexiaDemonstration, actionType: 'autonomic-dysreflexia-authored-trigger-response', step: (r) => dysreflexiaDemonstrationStep(r?.neurologyAutonomicDysreflexiaAssessment) },
  { id: 'Encephalitis', supports: supportsEncephalitisDemonstration, actionType: 'suspected-herpes-simplex-encephalitis-response', step: (r) => encephalitisDemonstrationStep(r?.neurologyEncephalitisAssessment) },
  { id: 'FocalMotorStatus', supports: supportsFocalMotorStatusDemonstration, actionType: 'focal-motor-status-epilepticus-escalation-response', step: (r) => focalMotorStatusDemonstrationStep(r?.neurologyFocalMotorStatusAssessment) },
  { id: 'Gbs', supports: supportsGbsDemonstration, actionType: 'guillain-barre-respiratory-decline-response', step: (r) => gbsDemonstrationStep(r?.neurologyGbsAssessment) },
  { id: 'Herniation', supports: supportsHerniationDemonstration, actionType: 'acute-transtentorial-herniation-pattern-response', step: (r) => herniationDemonstrationStep(r?.neurologyHerniationAssessment) },
  { id: 'Meningitis', supports: supportsMeningitisDemonstration, actionType: 'acute-bacterial-meningitis-first-hour-response', step: (r) => meningitisDemonstrationStep(r?.neurologyMeningitisAssessment) },
  { id: 'MinorStroke', supports: supportsMinorStrokeDemonstration, actionType: 'minor-nondisabling-acute-ischemic-stroke-response', step: (r) => minorStrokeDemonstrationStep(r?.neurologyMinorStrokeAssessment) },
  { id: 'Mscc', supports: supportsMsccDemonstration, actionType: 'metastatic-spinal-cord-compression-response', step: (r) => msccDemonstrationStep(r?.neurologyMsccAssessment) },
  { id: 'Myasthenia', supports: supportsMyastheniaDemonstration, actionType: 'myasthenic-crisis-escalation-response', step: (r) => myastheniaDemonstrationStep(r?.neurologyMyasthenicCrisisAssessment) },
  { id: 'Ncse', supports: supportsNcseDemonstration, actionType: 'nonconvulsive-status-epilepticus-recognition-response', step: (r) => ncseDemonstrationStep(r?.neurologyNcseAssessment) },
  { id: 'RaisedIcp', supports: supportsRaisedIcpDemonstration, actionType: 'raised-intracranial-pressure-visual-threat-response', step: (r) => raisedIcpDemonstrationStep(r?.neurologyRaisedIcpAssessment) },
];
