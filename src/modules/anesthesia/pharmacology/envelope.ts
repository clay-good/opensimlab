/**
 * The applicability envelope evaluator
 * (engine/pharmacology → Applicability Envelopes Are Enforced,
 * Known Failure Modes Are Encoded, Not Just Documented).
 *
 * Before a model becomes active for a patient the engine evaluates its envelope.
 * A violation demotes the model to **Out of range**; it does not stop the
 * simulation, because a learner may deliberately choose an out-of-range model to
 * see what goes wrong, and that failure is itself the lesson.
 */

import { bodyMassIndex, type Covariates } from './body-composition';
import type { ConfidenceLabel, PharmacologyModel } from './types';

export interface EnvelopeViolation {
  readonly covariate: string;
  readonly value: number | string;
  readonly bound: string;
  /** How far outside the bound, in the covariate's own units. Zero for a categorical. */
  readonly excess: number;
  readonly message: string;
}

export interface EnvelopeResult {
  readonly modelId: string;
  readonly label: ConfidenceLabel;
  readonly violations: readonly EnvelopeViolation[];
  /** Failure modes whose predicate fired for this patient. */
  readonly failures: readonly { id: string; reason: string; alternativeModelId?: string }[];
  /** A model offered as the in-range alternative, where one is declared. */
  readonly alternativeModelId: string | null;
  /**
   * True when the model's transcription has not yet been independently checked.
   * Such a model is surfaced as pending an independent check and may not be
   * presented as Published.
   */
  readonly pendingIndependentCheck: boolean;
  /** One sentence naming exactly what is out of bounds and by how much. */
  readonly summary: string;
}

function checkRange(
  name: string,
  value: number,
  bound: readonly [number, number] | undefined,
  unit: string,
): EnvelopeViolation | null {
  if (!bound) return null;
  const [low, high] = bound;
  if (value >= low && value <= high) return null;
  const excess = value < low ? low - value : value - high;
  return {
    covariate: name,
    value,
    bound: `${low}–${high} ${unit}`,
    excess,
    message: `${name} is ${value.toFixed(1)} ${unit}, outside the derivation range ${low}–${high} ${unit}, `
      + `by ${excess.toFixed(1)} ${unit}`,
  };
}

export function evaluateEnvelope(model: PharmacologyModel, covariates: Covariates): EnvelopeResult {
  const violations: EnvelopeViolation[] = [];
  const bmi = bodyMassIndex(covariates);

  const checks = [
    checkRange('age', covariates.ageYears, model.envelope.ageYears, 'years'),
    checkRange('weight', covariates.weightKg, model.envelope.weightKg, 'kg'),
    checkRange('height', covariates.heightCm, model.envelope.heightCm, 'cm'),
    checkRange('body mass index', bmi, model.envelope.bodyMassIndex, 'kg/m²'),
  ];
  for (const violation of checks) if (violation) violations.push(violation);

  if (model.envelope.sex && !model.envelope.sex.includes(covariates.sex)) {
    violations.push({
      covariate: 'sex', value: covariates.sex, bound: model.envelope.sex.join(', '), excess: 0,
      message: `the model was derived in ${model.envelope.sex.join(' and ')} subjects only`,
    });
  }

  const failures = model.failureModes
    .filter((mode) => mode.predicate(covariates))
    .map((mode) => ({
      id: mode.id,
      reason: mode.reason,
      ...(mode.alternativeModelId !== undefined ? { alternativeModelId: mode.alternativeModelId } : {}),
    }));

  const outOfRange = violations.length > 0 || failures.length > 0;
  const pendingIndependentCheck = model.transcription.status === 'pending-independent-check';
  // Out of range is the most specific thing to say, so it wins; after that, a
  // transcription nobody has checked cannot call itself published.
  const label: ConfidenceLabel = model.isTeachingModel
    ? 'teaching'
    : outOfRange ? 'out-of-range'
      : pendingIndependentCheck ? 'pending-check'
        : 'published';

  // Only a failure mode that ACTUALLY FIRED may offer its remedy. Falling back to
  // any declared mode's alternative steered a patient who merely sat outside a
  // range bound toward an unrelated failure's answer.
  const alternative = failures.find((f) => f.alternativeModelId)?.alternativeModelId ?? null;

  const parts: string[] = [];
  for (const violation of violations) parts.push(violation.message);
  for (const failure of failures) parts.push(failure.reason);

  return {
    modelId: model.id,
    label,
    violations,
    failures,
    alternativeModelId: outOfRange ? alternative : null,
    pendingIndependentCheck,
    summary: parts.length > 0 ? parts.join(' ') : 'Within the model\'s derivation envelope.',
  };
}

/** Learner-facing text for each label. Alphabetic tier codes are never shown. */
export const CONFIDENCE_LABEL_TEXT: Record<ConfidenceLabel, string> = {
  published: 'Published',
  'pending-check': 'Pending independent check',
  'out-of-range': 'Out of range',
  teaching: 'Teaching model',
};
