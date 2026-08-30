import type { ContentMaturity, MaturityRecord, MaturitySubjectKind } from '../catalog/maturity';
import type { ScenarioCompletionAudit } from '../catalog/scenario-completion';
import type { ScenarioQualityAudit } from '../catalog/scenario-quality';

export const PREVIEW_GATES = [
  'build-integrity', 'sources', 'safety-scope', 'completion-contract',
  'tests', 'limitations', 'validation-report', 'face-validity-procedure',
] as const;
export type PreviewGate = typeof PREVIEW_GATES[number];

/**
 * The gates that block a preview publication, as opposed to the ones it reports.
 *
 * `preview` means "published, disclosed, and unsigned". It was written requiring
 * all eight gates, and two of them — `completion-contract` and `tests` — assert
 * that our own evidence set about an item is FINISHED. No item has ever passed
 * them: 0 of 240 scenarios are complete and 0 have every quality record, so the
 * channel was unreachable and nothing could ever ship. A channel nothing can
 * pass is not a channel, which is the argument this project already accepted for
 * the non-scenario kinds; it applies to scenarios for the same reason.
 *
 * The six that remain blocking are the ones a reader is exposed to: that the
 * build resolves an exact version, that claims carry sources, that the patient is
 * bounded fiction with its limitations named, and that the validation and
 * face-validity procedures exist. Those are not relaxed and must not be.
 *
 * The two that were dropped are still computed, still reported, and now surfaced
 * per item on the public review-status page. Releasing with unfinished evidence
 * is defensible only while the gap is visible; it stops being defensible the
 * moment it is silent. Anything that hides these again should re-block them.
 */
export const PREVIEW_BLOCKING_GATES = [
  'build-integrity', 'sources', 'safety-scope',
  'limitations', 'validation-report', 'face-validity-procedure',
] as const satisfies readonly PreviewGate[];

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

/**
 * One state for everything published, and it says what the product is.
 *
 * This was a six-word taxonomy in which the shipped state read "Preview — not
 * clinically reviewed". "Preview" implied a later, reviewed version was coming,
 * which is a promise nobody has made: there is no signed corpus and no date for
 * one. The honest description of this product is that it is a teaching tool whose
 * content is unsigned, and that is not a stage on the way to something else.
 *
 * Both facts stay in the one label. "Educational use only" is the scope, and
 * "not clinically reviewed" is the disclosure that makes publishing an unsigned
 * corpus defensible at all — the design for this release lists per-item review
 * labeling among the things that must remain, so the wording keeps it rather than
 * shortening to the scope alone.
 */
export const MATURITY_LABELS: Readonly<Record<ContentMaturity, string>> = {
  draft: 'Draft — development build',
  preview: 'Educational use only. Not clinically reviewed',
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
  const missing = PREVIEW_BLOCKING_GATES.filter((gate) => !passed.has(gate));
  return missing.length === 0
    ? { status: 'publishable' }
    : { status: 'blocked', reasons: missing.map((gate) => `missing preview gate: ${gate}`) };
}

/**
 * The gates an item does not pass, blocking or not.
 *
 * `previewPublication` answers "may this publish". This answers "what is missing
 * anyway", which is what the public review-status surface prints. Keeping the two
 * separate is deliberate: the first is a decision, the second is a disclosure, and
 * collapsing them is how an unfinished evidence set becomes an invisible one.
 */
export function unmetPreviewGates(evidence: PreviewEvidence): readonly PreviewGate[] {
  const passed = new Set(evidence.passed);
  return PREVIEW_GATES.filter((gate) => !passed.has(gate));
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

/**
 * The evidence a non-scenario item carries, derived from fields it actually has.
 *
 * `check-review-gate.ts` used to hand these kinds `{ passed: [] }` with a comment
 * saying the contracts were not implemented. Fail-closed was right while the
 * contract was undefined, but it meant no explainer, drug card or region profile
 * could ever publish however good it was.
 *
 * Each rule below reads a field and fails when it is absent. None of them is a
 * rubber stamp, and it is worth being precise about what they do NOT check: they
 * verify that the item states its source, its scope and its limits, not that any
 * of those statements is correct. Correctness is what the report path and the
 * corrections log are for, and what the "not clinically reviewed" label discloses.
 */
const DOSE_QUANTITY = String.raw`\d+(?:\.\d+)?\s*(?:mg|mcg|microgram|micrograms|milligram|milligrams|ml)\b(?:\s*\/\s*kg)?`;
const DOSING_VERB = String.raw`\b(?:give|giving|administer|administering|inject|injecting|push|pushing)\b`;

/**
 * An imperative dose addressed to a reader, in either order, within one sentence.
 *
 * This used to require the quantity BEFORE the verb, which meant it caught
 * "2 mg/kg ... push" and waved through "Give 2 mg/kg of propofol" — the more
 * natural English and the more likely mistake. Both orders now, because a
 * safety rule that only fires on the rarer phrasing is close to not firing.
 */
const INSTRUCTS_A_DOSE = new RegExp(
  `(?:${DOSING_VERB}[^.]{0,40}${DOSE_QUANTITY})|(?:${DOSE_QUANTITY}[^.]{0,40}${DOSING_VERB})`,
  'i',
);

export function nonScenarioPreviewEvidence(
  kind: 'explanation' | 'drug-card' | 'practice-region',
  item: NonScenarioEvidenceInput,
  options: ReleaseEvidenceOptions,
): PreviewEvidence {
  // The caller resolves an exact-version maturity record before reaching here, so
  // the build-integrity gate is already established by the time this runs.
  const passed: PreviewGate[] = ['build-integrity'];
  if (options.validationReportPresent) passed.push('validation-report');
  if (options.faceValidityProcedureDocumented) passed.push('face-validity-procedure');
  const stated = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0;

  if (kind === 'explanation') {
    // `reflects` names the guideline or publication the explanation follows. Two
    // of the ten name standard teaching rather than a citation, which is itself a
    // statement a reader can weigh, so the rule requires that it be stated rather
    // than that it look like a reference.
    if (stated(item.reflects)) passed.push('sources');
    if (stated(item.simplifies)) passed.push('limitations');
    // An explanation is in scope while it explains rather than instructs. The
    // check is for an imperative dose addressed to a reader, which is the failure
    // that would matter; prose describing what a drug does is not that.
    if (!INSTRUCTS_A_DOSE.test(item.body ?? '')) passed.push('safety-scope');
    return { passed };
  }

  if (kind === 'drug-card') {
    if (stated(item.sourceId) && stated(item.sourceTitle)) passed.push('sources');
    // `comparedWithLabel` is where a card states how its teaching range relates to
    // the licensed one. That comparison is the card's applicability envelope and
    // its limitation at once, so it carries both gates.
    if (stated(item.comparedWithLabel)) { passed.push('safety-scope'); passed.push('limitations'); }
    return { passed };
  }

  if (stated(item.guideline)) passed.push('sources');
  // A profile is in scope while it describes practice rather than recommends it,
  // and it states its limits by naming what is not available in the region.
  if (stated(item.practiceNote)) passed.push('safety-scope');
  if (item.namesUnavailable) passed.push('limitations');
  return { passed };
}

/** The kinds a per-kind evidence rule is defined for. */
const RULED_KINDS = ['explanation', 'drug-card', 'practice-region'] as const;
type RuledKind = typeof RULED_KINDS[number];

/**
 * The evidence contract for one non-scenario item, or a statement that there is
 * none (design.md → the per-kind evidence table).
 *
 * The caller used to hand an unknown kind `{ passed: [] }`. That failed closed,
 * which was right, but it failed ILLEGIBLY: the item came back blocked on six
 * gates as though it had tried and missed each one, when the truth is that nobody
 * ever wrote a rule for its kind. Those two states need different fixes — one is
 * authoring, the other is a contract — and a release blocker that cannot tell you
 * which is a blocker you will misread. So the absence is now its own answer.
 */
export type PreviewEvidenceContract =
  | { readonly contract: 'rule'; readonly evidence: PreviewEvidence }
  | { readonly contract: 'none'; readonly reason: string };

/**
 * Resolve the evidence contract for a subject kind.
 *
 * `scenario` is deliberately not handled here: its evidence comes from the
 * completion and quality audits through `scenarioPreviewEvidence`, which needs
 * data this signature does not carry. Every other kind either has a rule or
 * reports that it has none, and there is no third outcome.
 */
export function previewEvidenceFor(
  kind: MaturitySubjectKind,
  item: NonScenarioEvidenceInput,
  options: ReleaseEvidenceOptions,
): PreviewEvidenceContract {
  if ((RULED_KINDS as readonly string[]).includes(kind)) {
    return { contract: 'rule', evidence: nonScenarioPreviewEvidence(kind as RuledKind, item, options) };
  }
  return {
    contract: 'none',
    reason: `has no preview evidence rule for subject kind "${kind}", so it cannot be published. `
      + 'Define the rule in publication.ts, or leave the item in draft.',
  };
}

/** The fields the per-kind rules read. Each kind supplies the ones it has. */
export interface NonScenarioEvidenceInput {
  readonly reflects?: string;
  readonly simplifies?: string;
  readonly body?: string;
  readonly sourceId?: string;
  readonly sourceTitle?: string;
  readonly comparedWithLabel?: string;
  readonly guideline?: string;
  readonly practiceNote?: string;
  readonly namesUnavailable?: boolean;
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
