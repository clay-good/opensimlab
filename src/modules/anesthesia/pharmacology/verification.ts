/**
 * The independent second-source check, as a record and a rule
 * (engine/pharmacology → A Verification Record Names Its Checker, Source, And
 * Version; A Public Verification Queue Lists Every Unchecked Parameter).
 *
 * "Verified" means exactly one thing: a person other than the transcriber
 * compared one reference-individual parameter against an accepted second
 * source, for the current model-set revision, and a maintainer opened that
 * source and confirmed the agreement. The queue page and the confidence label
 * both read `parameterStatus`, so they cannot disagree.
 *
 * A check is not a clinical review. It signs no content, covers no domain, and
 * advances no maturity label.
 */

import type { PharmacologyModel } from './types';

/** The three second-source kinds the pharmacology capability accepts. */
export type SecondSourceKind =
  | 'corrigendum'
  | 'independent-published-implementation'
  | 'open-reference-implementation';

export const SECOND_SOURCE_KIND_LABEL: Readonly<Record<SecondSourceKind, string>> = {
  corrigendum: "the paper's own erratum or corrigendum",
  'independent-published-implementation': 'an independent published implementation',
  'open-reference-implementation': 'an open reference implementation',
};

/** One volunteer's check of one parameter, as submitted and as recorded. */
export interface VerificationRecord {
  readonly modelId: string;
  /** A key of the model's `referenceIndividual.expected`. */
  readonly parameter: string;
  readonly valueChecked: number;
  readonly unit: string;
  /** The model-set revision the checker read. */
  readonly contentVersion: string;
  readonly primaryLocator: string;
  readonly secondSource: {
    readonly kind: SecondSourceKind;
    readonly citation: string;
    readonly locator: string;
  };
  /** A name and a qualification as the checker states it. No contact detail, ever. */
  readonly checker: { readonly name: string; readonly statedQualification: string };
  /** ISO date of the check. */
  readonly date: string;
  /** True only once a maintainer has opened the second source and confirmed it. */
  readonly maintainerConfirmed: boolean;
  /** What disagreed, when the second source does not match the transcription. */
  readonly discrepancy?: string;
}

export type RecordVerdict =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly reason: RefusalReason; readonly message: string };

export type RefusalReason =
  | 'unknown-parameter' | 'self-check' | 'kind-not-accepted' | 'unconfirmed'
  | 'older-version' | 'discrepancy' | 'value-mismatch';

/** Reference parameters are read as L, L/min and 1/min; Ce50 in the model's own unit. */
export function parameterUnit(model: PharmacologyModel, parameter: string): string {
  if (/^v\d$/.test(parameter)) return 'L';
  if (parameter === 'cl' || /^q\d$/.test(parameter)) return 'L/min';
  if (parameter.startsWith('ke0')) return '1/min';
  if (parameter === 'ce50') return model.concentrationUnit;
  return 'unitless';
}

const sameName = (left: string, right: string) =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

/** Whether a record verifies its parameter, and if not, the one reason why. */
export function judgeVerificationRecord(
  record: VerificationRecord, model: PharmacologyModel, currentRevision: string,
): RecordVerdict {
  const expected = model.referenceIndividual?.expected[record.parameter];
  const refuse = (reason: RefusalReason, message: string): RecordVerdict =>
    ({ accepted: false, reason, message });
  if (record.modelId !== model.id || expected === undefined) {
    return refuse('unknown-parameter', `${record.parameter} is not a reference parameter of ${model.id}.`);
  }
  if (sameName(record.checker.name, model.transcription.transcribedBy)) {
    return refuse('self-check', 'The checker is the transcriber. A check must be done by a different person.');
  }
  if (!model.transcription.acceptedSecondSources.includes(record.secondSource.kind)) {
    return refuse('kind-not-accepted', `${SECOND_SOURCE_KIND_LABEL[record.secondSource.kind]} is not an accepted second source for this model.`);
  }
  if (record.discrepancy !== undefined) {
    return refuse('discrepancy', 'The second source disagrees. This opens a correction, not a verified record.');
  }
  if (!record.maintainerConfirmed) {
    return refuse('unconfirmed', 'Received, not accepted: a maintainer has not yet opened the second source.');
  }
  if (record.contentVersion !== currentRevision) {
    return refuse('older-version', `Checked against ${record.contentVersion}, not the current ${currentRevision}. Kept as history.`);
  }
  const tolerance = model.referenceIndividual?.tolerance ?? 0;
  if (Math.abs(record.valueChecked - expected) > Math.abs(expected) * Math.max(tolerance, 1e-3)) {
    return refuse('value-mismatch', `The value checked, ${record.valueChecked}, is not the transcribed ${expected}.`);
  }
  return { accepted: true };
}

export type ParameterStatus = 'verified' | 'disputed' | 'earlier-version-checked' | 'pending';

/** One parameter's status, read from the records against it and nothing else. */
export function parameterStatus(
  model: PharmacologyModel, parameter: string, currentRevision: string,
): ParameterStatus {
  const records = model.transcription.checks.filter((check) => check.parameter === parameter);
  const verdicts = records.map((record) => judgeVerificationRecord(record, model, currentRevision));
  if (verdicts.some((verdict) => verdict.accepted)) return 'verified';
  if (records.some((record) => record.discrepancy !== undefined)) return 'disputed';
  if (verdicts.some((verdict) => !verdict.accepted && verdict.reason === 'older-version')) {
    return 'earlier-version-checked';
  }
  return 'pending';
}

/** The parameters a model's transcription can be checked on; none for a teaching model. */
export function checkableParameters(model: PharmacologyModel): readonly string[] {
  if (model.isTeachingModel) return [];
  return Object.keys(model.referenceIndividual?.expected ?? {});
}

/**
 * A model is verified only when it has parameters to check and every one of
 * them is. A model with nothing to check is never verified by default.
 */
export function isTranscriptionVerified(model: PharmacologyModel, currentRevision: string): boolean {
  const parameters = checkableParameters(model);
  return parameters.length > 0
    && parameters.every((parameter) => parameterStatus(model, parameter, currentRevision) === 'verified');
}

export interface QueueEntry {
  readonly parameter: string;
  readonly value: number;
  readonly unit: string;
  readonly status: ParameterStatus;
  /** Set where a corrigendum changes this parameter, so a naive check would confirm the wrong number. */
  readonly corrigendumNote: string | null;
}

export interface QueueModel {
  readonly modelId: string;
  readonly drugName: string;
  readonly citation: string;
  readonly primaryLocator: string;
  readonly acceptedSecondSources: readonly SecondSourceKind[];
  readonly entries: readonly QueueEntry[];
}

export interface VerificationQueue {
  readonly revision: string;
  readonly verified: number;
  readonly pending: number;
  readonly models: readonly QueueModel[];
}

/** Every checkable parameter in the build, grouped by model. */
export function verificationQueue(
  models: readonly PharmacologyModel[], currentRevision: string,
): VerificationQueue {
  const queueModels = models
    .filter((model) => checkableParameters(model).length > 0)
    .map((model): QueueModel => ({
      modelId: model.id,
      drugName: model.drugName,
      citation: `${model.citation.authors} (${model.citation.year}). ${model.citation.title}. ${model.citation.journal}.`,
      primaryLocator: model.transcription.primaryLocator,
      acceptedSecondSources: model.transcription.acceptedSecondSources,
      entries: checkableParameters(model).map((parameter) => ({
        parameter,
        value: model.referenceIndividual!.expected[parameter]!,
        unit: parameterUnit(model, parameter),
        status: parameterStatus(model, parameter, currentRevision),
        corrigendumNote: model.transcription.corrigendum?.parameters.includes(parameter)
          ? model.transcription.corrigendum.note : null,
      })),
    }));
  const entries = queueModels.flatMap((model) => model.entries);
  const verified = entries.filter((entry) => entry.status === 'verified').length;
  return { revision: currentRevision, verified, pending: entries.length - verified, models: queueModels };
}
