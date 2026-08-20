/**
 * The shape of a pharmacology model declaration
 * (engine/pharmacology → Parameters Live In This Repository As Typed Source).
 *
 * A model file declares, in ONE typed object: the model id, the drug, the
 * structure, every parameter with value and units, the covariate equations as
 * executable code, the effect-site rate constant, the applicability envelope, the
 * known failure modes, the citation, and the notes shown to learners.
 */

import type { PkParameters } from '@platform/kernel/compartments';
import type { Covariates } from './body-composition';

/** A resolvable citation. Bundled, so it renders with no network. */
export interface Citation {
  readonly authors: string;
  readonly title: string;
  readonly journal: string;
  readonly year: number;
  readonly volumePages?: string;
  readonly pmid?: string;
  readonly doi?: string;
  /** Where in the paper the parameters were read from: table, page or appendix. */
  readonly locator: string;
  /** A plain-language summary of what the study did, for the learner. */
  readonly summary: string;
}

/**
 * The transcription record every parameter set carries
 * (engine/pharmacology → Transcription Is Double-Sourced And Independently Checked).
 */
export interface TranscriptionRecord {
  /** Where the values were read from. */
  readonly primaryLocator: string;
  /** The independent second source consulted, or null if the check is outstanding. */
  readonly secondSource: string | null;
  /** Who performed the independent check, or null if outstanding. */
  readonly checkedBy: string | null;
  /** ISO date of the check, or null. */
  readonly checkedOn: string | null;
  /**
   * `verified` only when a different person has checked the values against a
   * second source. Anything else is surfaced to the learner as pending an
   * independent check, and blocks the Published confidence label.
   */
  readonly status: 'verified' | 'pending-independent-check';
  /** Why the check is outstanding, when it is. */
  readonly note?: string;
}

/** Bounds a model was derived within. A violation demotes it, it does not stop it. */
export interface Envelope {
  readonly ageYears?: readonly [number, number];
  readonly weightKg?: readonly [number, number];
  readonly heightCm?: readonly [number, number];
  readonly bodyMassIndex?: readonly [number, number];
  readonly sex?: readonly ('male' | 'female')[];
}

/** A documented failure mode, encoded as a predicate rather than described in prose. */
export interface FailureMode {
  readonly id: string;
  /** Learner-facing explanation of the non-physical behaviour it produces. */
  readonly reason: string;
  /** True when this patient triggers the failure. */
  readonly predicate: (covariates: Covariates) => boolean;
  /** Model id offered as the in-range alternative. */
  readonly alternativeModelId?: string;
}

/** The three learner-facing labels. Alphabetic tier codes are never shown. */
/**
 * `published` is earned, not assumed: a transcription still awaiting its
 * independent second check reports `pending-check` instead, which is what the
 * transcription status field has always documented and what the label logic now
 * actually enforces.
 */
export type ConfidenceLabel = 'published' | 'pending-check' | 'out-of-range' | 'teaching';

/** Pharmacodynamic parameters, where the model publishes them. */
export interface PdDeclaration {
  /** What the effect is measured on, for example `depth-index`. */
  readonly effect: string;
  /** Effect at zero concentration. */
  readonly e0: number;
  /** Effect at maximal concentration. */
  readonly eMax: number;
  /** Concentration producing half the maximal effect, in the model's units. */
  readonly ce50: (covariates: Covariates) => number;
  /** Hill slope below Ce50. */
  readonly gammaLow: number;
  /** Hill slope above Ce50, where the model publishes an asymmetric pair. */
  readonly gammaHigh: number;
  /** Between-subject variability as a coefficient of variation, or null if unpublished. */
  readonly betweenSubjectCv: number | null;
}

export interface PharmacologyModel {
  readonly id: string;
  readonly drugId: string;
  readonly drugName: string;
  /** Number of pharmacokinetic compartments the model declares. */
  readonly compartments: 1 | 2 | 3;
  /** The mass unit concentrations are reported in, for example `µg/mL`. */
  readonly concentrationUnit: string;
  /** The mass unit doses are given in, for example `mg`. */
  readonly doseUnit: string;
  /** Covariates the model requires. A missing one is a hard error. */
  readonly requiredCovariates: readonly (keyof Covariates)[];
  /** The covariate equations, as executable code. */
  readonly parameters: (covariates: Covariates) => PkParameters;
  readonly pd: PdDeclaration | null;
  readonly envelope: Envelope;
  readonly failureModes: readonly FailureMode[];
  readonly citation: Citation;
  readonly transcription: TranscriptionRecord;
  /** Human-readable notes shown to learners. */
  readonly notes: string;
  /** True for an Open Sim Lab construction with no population source. */
  readonly isTeachingModel: boolean;
  /**
   * The reference individual the paper reports parameters for, and those values,
   * so a test can assert the transcription reproduces them.
   */
  readonly referenceIndividual?: {
    readonly covariates: Covariates;
    readonly expected: Readonly<Record<string, number>>;
    /** Tolerance for each expected value, as a relative fraction. */
    readonly tolerance: number;
  };
}
