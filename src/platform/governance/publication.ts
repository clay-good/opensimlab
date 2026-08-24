import type { ContentMaturity, MaturityRecord } from '../catalog/maturity';

export const PREVIEW_GATES = [
  'build-integrity', 'sources', 'safety-scope', 'completion-contract',
  'tests', 'limitations', 'validation-report', 'face-validity-procedure',
] as const;
export type PreviewGate = typeof PREVIEW_GATES[number];

export interface PreviewEvidence {
  readonly passed: readonly PreviewGate[];
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
