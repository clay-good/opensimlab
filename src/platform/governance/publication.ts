import type { ContentMaturity, MaturityRecord } from '../catalog/maturity';
import type { ScenarioCompletionAudit } from '../catalog/scenario-completion';
import type { ScenarioQualityAudit } from '../catalog/scenario-quality';

export const PREVIEW_GATES = [
  'build-integrity', 'sources', 'safety-scope', 'completion-contract',
  'tests', 'limitations', 'validation-report', 'face-validity-procedure',
] as const;
export type PreviewGate = typeof PREVIEW_GATES[number];

export interface PreviewEvidence {
  readonly passed: readonly PreviewGate[];
}

export interface ReleaseEvidenceOptions {
  readonly validationReportPresent: boolean;
  readonly faceValidityProcedureDocumented: boolean;
}

export type PublicationVerdict =
  | { readonly status: 'publishable' }
  | { readonly status: 'blocked'; readonly reasons: readonly string[] };

export const MATURITY_LABELS: Readonly<Record<ContentMaturity, string>> = {
  draft: 'Draft — development build',
  preview: 'Preview — not clinically reviewed',
  source_checked: 'Sources checked — clinical behavior not reviewed',
  clinically_reviewed: 'Clinically reviewed',
  institution_endorsed: 'Institution endorsed',
  withdrawn: 'Withdrawn — unavailable',
};

/**
 * Preview availability is independent of signature state. It is earned by the
 * technical and evidence gates, while draft and withdrawn records always win.
 */
export function previewPublication(
  record: MaturityRecord,
  evidence: PreviewEvidence,
): PublicationVerdict {
  if (record.status === 'draft') {
    return { status: 'blocked', reasons: ['draft content is not publicly playable'] };
  }
  if (record.status === 'withdrawn') {
    return { status: 'blocked', reasons: ['withdrawn content is unavailable'] };
  }
  const passed = new Set(evidence.passed);
  const missing = PREVIEW_GATES.filter((gate) => !passed.has(gate));
  return missing.length === 0
    ? { status: 'publishable' }
    : { status: 'blocked', reasons: missing.map((gate) => `missing preview gate: ${gate}`) };
}

/** Derive named preview gates from the generated exact-version scenario audits. */
export function scenarioPreviewEvidence(
  completion: ScenarioCompletionAudit,
  quality: ScenarioQualityAudit,
  options: ReleaseEvidenceOptions,
): PreviewEvidence {
  if (completion.scenarioId !== quality.scenarioId
    || completion.contentVersion !== quality.contentVersion) {
    throw new Error(
      `Preview evidence version mismatch: ${completion.scenarioId}@${completion.contentVersion} `
      + `and ${quality.scenarioId}@${quality.contentVersion}.`,
    );
  }
  const satisfied = (id: string) => completion.requirements.some((requirement) => (
    requirement.id === id && requirement.status === 'satisfied'
  ));
  const passed: PreviewGate[] = ['build-integrity'];
  if (satisfied('source-provenance')) passed.push('sources');
  if (satisfied('bounded-fictional-patient') && satisfied('scenario-specific-limitations')) {
    passed.push('safety-scope');
  }
  if (completion.complete) passed.push('completion-contract');
  if (quality.qualityRecords.every((record) => record.status === 'present')) passed.push('tests');
  if (satisfied('scenario-specific-limitations')) passed.push('limitations');
  if (options.validationReportPresent) passed.push('validation-report');
  if (options.faceValidityProcedureDocumented) passed.push('face-validity-procedure');
  return { passed };
}

/** Preview and source checking never satisfy an authority claim. */
export function isReviewedOnlyStatus(status: ContentMaturity): boolean {
  return status === 'clinically_reviewed' || status === 'institution_endorsed';
}

/** Only an exact-version record can provide a badge for the requested item. */
export function maturityLabelFor(
  record: MaturityRecord | undefined,
  subjectId: string,
  contentVersion: string,
): string | undefined {
  if (!record || record.subjectId !== subjectId || record.contentVersion !== contentVersion) {
    return undefined;
  }
  return MATURITY_LABELS[record.status];
}
