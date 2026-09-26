/**
 * Every module's scenarios, loaded only when a submitted transcript names that
 * module. The review page accepts a session from any of the sixteen, and loading
 * all of them up front would put every lesson's prose in its chunk.
 */
import type { Scenario } from '../scenarios/types';

const LOADERS: Readonly<Record<string, () => Promise<readonly Scenario[]>>> = {
  anesthesia: async () => (await import('../scenarios')).SCENARIOS,
  cardiology: async () => (await import('../../cardiology/scenarios')).CARDIOLOGY_SCENARIOS,
  'critical-care': async () => (await import('../../critical-care/scenarios')).CRITICAL_CARE_SCENARIOS,
  'emergency-medicine': async () => (await import('../../emergency-medicine/scenarios')).EMERGENCY_MEDICINE_SCENARIOS,
  'endocrine-metabolic': async () => (await import('../../endocrine-metabolic/scenarios')).ENDOCRINE_METABOLIC_SCENARIOS,
  'infectious-disease': async () => (await import('../../infectious-disease/scenarios')).INFECTIOUS_DISEASE_SCENARIOS,
  'medical-surgical-nursing': async () => (await import('../../medical-surgical-nursing/scenarios')).MEDICAL_SURGICAL_NURSING_SCENARIOS,
  neonatology: async () => (await import('../../neonatology/scenarios')).NEONATOLOGY_SCENARIOS,
  neurology: async () => (await import('../../neurology/scenarios')).NEUROLOGY_SCENARIOS,
  obstetrics: async () => (await import('../../obstetrics/scenarios')).OBSTETRICS_SCENARIOS,
  oncology: async () => (await import('../../oncology/scenarios')).ONCOLOGY_SCENARIOS,
  pediatrics: async () => (await import('../../pediatrics/scenarios')).PEDIATRICS_SCENARIOS,
  'renal-electrolyte': async () => (await import('../../renal-electrolyte/scenarios')).RENAL_ELECTROLYTE_SCENARIOS,
  'respiratory-medicine': async () => (await import('../../respiratory-medicine/scenarios')).RESPIRATORY_MEDICINE_SCENARIOS,
  'surgery-trauma': async () => (await import('../../surgery-trauma/scenarios')).SURGERY_TRAUMA_SCENARIOS,
  toxicology: async () => (await import('../../toxicology/scenarios')).TOXICOLOGY_SCENARIOS,
};

/** The module ids a transcript may name. */
export const TRANSCRIPT_MODULE_IDS: readonly string[] = Object.keys(LOADERS);

/** The scenario a transcript names, or undefined when this build has no such scenario. */
export async function transcriptScenario(moduleId: string, scenarioId: string): Promise<Scenario | undefined> {
  const load = Object.hasOwn(LOADERS, moduleId) ? LOADERS[moduleId] : undefined;
  return (await load?.())?.find((scenario) => scenario.metadata.id === scenarioId);
}
