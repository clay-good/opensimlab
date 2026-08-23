/**
 * Laryngoscopy and the airway (engine/physiology → laryngoscopy returning a
 * Cormack-Lehane grade, cockpit/action-cockpit → Airway And Resuscitation Actions).
 *
 * The result of a laryngoscopy is a Cormack-Lehane grade determined by the
 * patient's declared airway anatomy and the technique used. Each attempt consumes
 * simulated time, saturation falls during the apnoea, and repeated attempts
 * worsen the grade through airway trauma.
 *
 * The outcome distribution is anchored to reported elective-surgery incidence
 * rather than tuned for drama: a simulator that makes every airway difficult
 * distorts the learner's expectations as badly as one that makes none.
 */

import { clamp } from '@platform/kernel/numeric';
import type { Rng } from '@platform/kernel/rng';

export type CormackLehaneGrade = 1 | 2 | 3 | 4;
export type LaryngoscopyTechnique = 'direct' | 'video';

/** The airway assessment a scenario declares for its patient. */
export interface AirwayAnatomy {
  /**
   * 0 is an unremarkable airway, 1 is the most difficult anatomy the model
   * represents. Scenarios set it from the profile's airway assessment.
   */
  readonly difficulty: number;
  /** Whether the patient's anatomy makes bag-mask ventilation difficult too. */
  readonly difficultMaskVentilation: boolean;
}

/**
 * Baseline grade distribution for an unremarkable airway under direct
 * laryngoscopy, matching the published elective-surgery ranges: grade 1 and 2
 * views in the large majority, grade 3 in a small percentage, grade 4 rare.
 */
export const BASELINE_GRADE_PROBABILITIES: readonly number[] = [0.68, 0.256, 0.06, 0.004];

/**
 * Videolaryngoscopy shifts the odds toward an adequate view, and it shifts them
 * hard. In known or predicted difficult airways videolaryngoscopy delivers a
 * grade 1 or 2 view in the large majority of cases, which is the entire reason it
 * is the rescue device in the difficult-airway guidelines. An earlier value of
 * 0.55 left the highest-difficulty patient with a 44% chance of a poor view even
 * with video, which would teach a learner that the rescue barely helps.
 */
export const VIDEO_GRADE_IMPROVEMENT = 0.82;

/**
 * How steeply the anatomy's declared difficulty moves weight toward the worse
 * grades. Calibrated so the difficulty scale spans the reported range rather than
 * saturating immediately: at difficulty 0.2 about 8% of views are grade 3 or 4,
 * and only the most difficult declared anatomy approaches the ~20% reported in
 * high-risk cohorts. An earlier exponent base of 6 gave 24% at difficulty 0.2 and
 * 71% at 1.0, which is not a distribution any published series describes.
 */
export const DIFFICULTY_STEEPNESS = 1.9;

export interface LaryngoscopyAttempt {
  /** 1 for the first attempt. */
  readonly attemptNumber: number;
  readonly technique: LaryngoscopyTechnique;
}

export interface LaryngoscopyResult {
  readonly grade: CormackLehaneGrade;
  /** True when the view was adequate for intubation, which is grade 1 or 2. */
  readonly adequateView: boolean;
  readonly intubated: boolean;
  /** Simulated seconds this attempt consumed. */
  readonly durationSeconds: number;
  /** Trauma accumulated, which worsens the next attempt. */
  readonly traumaAdded: number;
  readonly narrative: string;
}

/**
 * Probability of each grade for this anatomy, technique and accumulated trauma.
 * Returned as a distribution rather than a sample so a test can assert the
 * distribution directly instead of running thousands of trials.
 */
export function gradeProbabilities(
  anatomy: AirwayAnatomy,
  technique: LaryngoscopyTechnique,
  trauma: number,
): number[] {
  // Difficulty and trauma both shift weight toward the worse grades.
  const shift = clamp(anatomy.difficulty + trauma, 0, 1)
    * (technique === 'video' ? 1 - VIDEO_GRADE_IMPROVEMENT : 1);
  const weights = BASELINE_GRADE_PROBABILITIES.map((base, index) => {
    // Grade index 0 is the best view; weight moves from it to the worse grades.
    const towardWorse = Math.pow(1 + shift * DIFFICULTY_STEEPNESS, index - 1.2);
    return base * towardWorse;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}

/** Sample a grade from the distribution using the session's seeded generator. */
export function sampleGrade(
  anatomy: AirwayAnatomy,
  technique: LaryngoscopyTechnique,
  trauma: number,
  rng: Rng,
): CormackLehaneGrade {
  const probabilities = gradeProbabilities(anatomy, technique, trauma);
  let draw = rng.next();
  for (let index = 0; index < probabilities.length; index += 1) {
    draw -= probabilities[index] ?? 0;
    if (draw <= 0) return (index + 1) as CormackLehaneGrade;
  }
  return 4;
}

/** Seconds an attempt consumes, longer when the view is poor. */
export function attemptDurationSeconds(grade: CormackLehaneGrade, technique: LaryngoscopyTechnique): number {
  const base = technique === 'video' ? 22 : 18;
  return base + (grade - 1) * 14;
}

/** Trauma added by an attempt, which worsens the next one. */
export function traumaFromAttempt(grade: CormackLehaneGrade): number {
  return 0.06 + (grade - 1) * 0.05;
}

export function performLaryngoscopy(
  anatomy: AirwayAnatomy,
  attempt: LaryngoscopyAttempt,
  trauma: number,
  rng: Rng,
): LaryngoscopyResult {
  const grade = sampleGrade(anatomy, attempt.technique, trauma, rng);
  const adequateView = grade <= 2;
  // A grade 3 view can still be intubated with a bougie more often than not;
  // a grade 4 view essentially cannot be intubated by that route.
  const intubationChance = grade === 1 ? 0.99 : grade === 2 ? 0.95 : grade === 3 ? 0.45 : 0.05;
  const intubated = rng.next() < intubationChance;
  return {
    grade,
    adequateView,
    intubated,
    durationSeconds: attemptDurationSeconds(grade, attempt.technique),
    traumaAdded: traumaFromAttempt(grade),
    narrative: intubated
      ? `Cormack-Lehane grade ${grade} view; tube placed on attempt ${attempt.attemptNumber}.`
      : `Cormack-Lehane grade ${grade} view; intubation unsuccessful on attempt ${attempt.attemptNumber}.`,
  };
}

/** Running airway state across a session. */
export class AirwayState {
  trauma = 0;
  attempts = 0;
  intubated = false;

  beginAttempt(anatomy: AirwayAnatomy, technique: LaryngoscopyTechnique, rng: Rng): LaryngoscopyResult {
    this.attempts += 1;
    const result = performLaryngoscopy(anatomy, { attemptNumber: this.attempts, technique }, this.trauma, rng);
    this.trauma = clamp(this.trauma + result.traumaAdded, 0, 1);
    return result;
  }

  completeAttempt(result: LaryngoscopyResult): void {
    if (result.intubated) this.intubated = true;
  }

  /** Compatibility helper for direct physiology tests and non-session callers. */
  attempt(anatomy: AirwayAnatomy, technique: LaryngoscopyTechnique, rng: Rng): LaryngoscopyResult {
    const result = this.beginAttempt(anatomy, technique, rng);
    this.completeAttempt(result);
    return result;
  }
}
