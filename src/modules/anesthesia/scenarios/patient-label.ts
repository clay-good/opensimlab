import type { ScenarioPatient } from './types';

/** Age-appropriate person noun for learner-facing scenario descriptions. */
export function patientPersonNoun(patient: Pick<ScenarioPatient, 'ageYears' | 'sex'>): string {
  if (patient.ageYears < 18) return patient.sex === 'male' ? 'boy' : 'girl';
  return patient.sex === 'male' ? 'man' : 'woman';
}
