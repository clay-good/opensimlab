/**
 * The model registry and the default-selection rule.
 *
 * engine/pharmacology → Model choice per patient is defensible: an adult patient
 * whose scenario does not name a propofol model gets Eleveld 2018, because it is
 * the only shipped adult model derived across a broad population including
 * obesity and old age. The choice and its reason are recorded in the transcript.
 */

import { MissingCovariate } from '@platform/kernel/errors';
import type { Covariates } from './body-composition';
import { PROPOFOL_ELEVELD_2018 } from './models/propofol-eleveld-2018';
import { PROPOFOL_MARSH_1991 } from './models/propofol-marsh-1991';
import { PROPOFOL_PAEDFUSOR_2005 } from './models/propofol-paedfusor-2005';
import { PROPOFOL_SCHNIDER_1998 } from './models/propofol-schnider-1998';
import { REMIFENTANIL_MINTO_1997 } from './models/remifentanil-minto-1997';
import { ROCURONIUM_CLINICAL_COURSE_TEACHING } from './models/rocuronium-clinical-course-teaching';
import type { PharmacologyModel } from './types';

export const MODELS: readonly PharmacologyModel[] = [
  PROPOFOL_MARSH_1991,
  PROPOFOL_SCHNIDER_1998,
  PROPOFOL_ELEVELD_2018,
  PROPOFOL_PAEDFUSOR_2005,
  REMIFENTANIL_MINTO_1997,
  ROCURONIUM_CLINICAL_COURSE_TEACHING,
];

/**
 * The model-set revision. It changes whenever any parameter changes, and it is
 * recorded in every transcript so a session can be interpreted years later.
 */
export const MODEL_SET_REVISION = '2026.08.2';

export const MODELS_BY_ID: ReadonlyMap<string, PharmacologyModel> = new Map(
  MODELS.map((model) => [model.id, model]),
);

export function getModel(id: string): PharmacologyModel {
  const model = MODELS_BY_ID.get(id);
  if (!model) throw new Error(`Unknown pharmacology model: ${id}`);
  return model;
}

export function modelsForDrug(drugId: string): PharmacologyModel[] {
  return MODELS.filter((model) => model.drugId === drugId);
}

export interface ModelSelection {
  readonly model: PharmacologyModel;
  /** Why this model was chosen, recorded in the transcript. */
  readonly reason: string;
}

/** The default model for a drug and a patient, with its reason. */
export function selectDefaultModel(drugId: string, covariates: Covariates): ModelSelection {
  const candidates = modelsForDrug(drugId);
  if (candidates.length === 0) throw new Error(`No model available for drug: ${drugId}`);

  if (drugId === 'propofol') {
    if (covariates.ageYears >= 1 && covariates.ageYears <= 12
      && covariates.weightKg >= 5 && covariates.weightKg <= 61) {
      return {
        model: PROPOFOL_PAEDFUSOR_2005,
        reason:
          'Paedfusor 2005 selected because the patient is within its published 1–12 year '
          + 'pediatric age band. It supplies PK and effect-site equilibration, not a validated '
          + 'pediatric depth-response surface.',
      };
    }
    if (covariates.ageYears < 18) {
      const outside: string[] = [];
      if (covariates.ageYears < 1 || covariates.ageYears > 12) {
        outside.push(`age ${covariates.ageYears} years is outside 1–12 years`);
      }
      if (covariates.weightKg < 5 || covariates.weightKg > 61) {
        outside.push(`weight ${covariates.weightKg} kg is outside 5–61 kg`);
      }
      return {
        model: PROPOFOL_ELEVELD_2018,
        reason:
          `Eleveld 2018 selected for this pediatric patient because ${outside.join(' and ')} `
          + 'for the shipped Paedfusor envelope; Eleveld spans childhood.',
      };
    }
    return {
      model: PROPOFOL_ELEVELD_2018,
      reason:
        'Eleveld 2018 selected as the default for an adult because it is the only shipped adult '
        + 'model derived across a broad population including obesity and old age.',
    };
  }

  const only = candidates[0];
  if (!only) throw new Error(`No model available for drug: ${drugId}`);
  return { model: only, reason: `${only.citation.authors.split(',')[0]} ${only.citation.year} is the only shipped model for ${drugId}.` };
}

/** Compute a model's parameters, failing loudly on a covariate it requires but lacks. */
export function parametersFor(model: PharmacologyModel, covariates: Covariates) {
  for (const required of model.requiredCovariates) {
    const value = covariates[required];
    if (value === undefined || value === null || (typeof value === 'number' && !Number.isFinite(value))) {
      throw new MissingCovariate(model.id, String(required));
    }
  }
  return model.parameters(covariates);
}
