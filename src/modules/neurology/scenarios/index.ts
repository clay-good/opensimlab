import type { Scenario } from '@anesthesia/scenarios/types';
import { ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION } from './aneurysmal-subarachnoid-hemorrhage-deterioration';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION } from './basilar-artery-occlusion-escalation';
import { FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION } from './focal-motor-status-epilepticus-escalation';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE } from './minor-nondisabling-acute-ischemic-stroke';
import { NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION } from './nonconvulsive-status-epilepticus-recognition';
import { MYASTHENIC_CRISIS_ESCALATION } from './myasthenic-crisis-escalation';
import { GUILLAIN_BARRE_RESPIRATORY_DECLINE } from './guillain-barre-respiratory-decline';
import { ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR } from './acute-bacterial-meningitis-first-hour';
import { SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS } from './suspected-herpes-simplex-encephalitis';
import { RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT } from './raised-intracranial-pressure-visual-threat';
import { ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN } from './acute-transtentorial-herniation-pattern';
import { METASTATIC_SPINAL_CORD_COMPRESSION } from './metastatic-spinal-cord-compression';
import { SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE } from './spontaneous-cerebellar-intracerebral-hemorrhage';

export const NEUROLOGY_SCENARIOS: readonly Scenario[] = [
  MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE,
  BASILAR_ARTERY_OCCLUSION_ESCALATION,
  SPONTANEOUS_CEREBELLAR_INTRACEREBRAL_HEMORRHAGE,
  ANEURYSMAL_SUBARACHNOID_HEMORRHAGE_DETERIORATION,
  FOCAL_MOTOR_STATUS_EPILEPTICUS_ESCALATION,
  NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION,
  MYASTHENIC_CRISIS_ESCALATION,
  GUILLAIN_BARRE_RESPIRATORY_DECLINE,
  ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR,
  SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS,
  RAISED_INTRACRANIAL_PRESSURE_VISUAL_THREAT,
  ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN,
  METASTATIC_SPINAL_CORD_COMPRESSION,
];
export const DEFAULT_NEUROLOGY_SCENARIO_ID = MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE.metadata.id;

export function getNeurologyScenario(id: string): Scenario | undefined {
  return NEUROLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
