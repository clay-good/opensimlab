/**
 * The static adoption pack (platform/adoption → Institutions Receive A Static
 * Audit And Adoption Pack).
 *
 * One file a program can download and evaluate without an account or a call. It
 * is built from the records the build already keeps, never from prose written for
 * it, and every claim in it points at a public repository record.
 *
 * Its most important number is reviewed coverage, and today that number is zero:
 * every scenario is preview and the editorial board is empty. The pack says so and
 * lists every scenario it excludes, by id, version, status and reason, because a
 * coverage total without the list of what it left out is the claim the spec
 * forbids.
 *
 * `buildAdoptionPack` is pure. Everything it reads is passed in, so a test can hand
 * it a reviewed, an overdue or a withdrawn item that no real record holds yet.
 */

import type { ContentMaturity, MaturityCatalog } from '../catalog/maturity';
import { maturityFor } from '../catalog/maturity';
import type { ScenarioCompletionCatalog } from '../catalog/scenario-completion';
import type { CorrectionEntry } from '../docs/corrections';
import { isReviewedOnlyStatus, MATURITY_LABELS } from '../governance/publication';
import type { BoardMember, ReviewRecord } from '../governance/review-gate';
import { gate, needsCoSignature } from '../governance/review-gate';
import type { ScenarioReportRequest } from '../reporting/contracts';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '../transcript/transcript';

export const ADOPTION_PACK_SCHEMA_VERSION = 1;

/** Replaced with the release id by `scripts/prerender.ts`; an unstamped pack fails the build. */
export const ADOPTION_PACK_RELEASE_TOKEN = '__ADOPTION_PACK_RELEASE__';

export const ADOPTION_PACK_PATH = '/catalog/adoption-pack.json';

/**
 * Every field an anonymous problem report sends, in request order.
 *
 * Typed against the request contract in both directions: a field added to
 * `ScenarioReportRequest` and not listed here fails to compile, and a test
 * compares this list with a request the real builder produces.
 */
export const REPORT_REQUEST_FIELDS = [
  'module_id', 'scenario_id', 'content_version', 'app_version', 'engine_version',
  'practice_region', 'surface', 'simulated_tick', 'canonical_url', 'category', 'note',
  'recent_context', 'turnstile_token',
] as const satisfies readonly (keyof ScenarioReportRequest)[];
type Unlisted = Exclude<keyof ScenarioReportRequest, typeof REPORT_REQUEST_FIELDS[number]>;
const everyReportFieldListed: [Unlisted] extends [never] ? true : never = true;
void everyReportFieldListed;

/** Scope wording for the pack. The other two statements are reused from the export contract. */
export const NOT_CERTIFICATION =
  'Using or completing a scenario in this release, and any record it produces, does not certify '
  + 'competence, satisfy a supervised or external assessment, or authorize clinical work. What '
  + 'Open Sim Lab provides is preparation only.';

/** What the authored scenario records say about one exact version. */
export interface AdoptionAuthoredRecord {
  readonly sources: readonly string[];
  readonly review: ReviewRecord;
  readonly limitationIds: readonly string[];
}

export interface AdoptionFramework {
  readonly id: string;
  readonly name: string;
  readonly body: string;
  readonly version: string;
  readonly url: string;
  readonly fidelity: string;
}

export interface AdoptionMapping {
  readonly scenarioId: string;
  readonly frameworkId: string;
  readonly domainId: string;
  readonly objectiveIds: readonly string[];
}

export interface AdoptionPackInput {
  readonly release: string;
  readonly repositoryUrl: string;
  readonly capabilityVersion: string;
  /** The date overdue review is judged against. It is not printed. */
  readonly today: Date;
  /** A practice region to scope reviewed coverage to, or undefined for every region. */
  readonly region?: string;
  readonly completions: readonly ScenarioCompletionCatalog[];
  readonly maturity: readonly MaturityCatalog[];
  readonly authored: (moduleId: string, scenarioId: string, contentVersion: string) => AdoptionAuthoredRecord;
  readonly corrections: readonly CorrectionEntry[];
  readonly board: readonly BoardMember[];
  readonly competency: {
    readonly disclaimer: string;
    readonly frameworks: readonly AdoptionFramework[];
    readonly mappings: readonly AdoptionMapping[];
  };
}

export type ExclusionReason =
  | 'draft' | 'preview' | 'source-checked' | 'withdrawn'
  | 'region' | 'overdue' | 'review-not-current';

export interface AdoptionExclusion {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly status: ContentMaturity;
  readonly reason: ExclusionReason;
  readonly detail: string;
}

export interface AdoptionScenario {
  readonly moduleId: string;
  readonly scenarioId: string;
  readonly title: string;
  readonly contentVersion: string;
  readonly capabilityVersion: string;
  readonly maturity: ContentMaturity;
  readonly practiceRegions: readonly string[];
  readonly inReviewedCoverage: boolean;
  readonly sources: readonly string[];
  readonly limitationIds: readonly string[];
  readonly corrections: readonly { readonly released: string; readonly title: string }[];
  readonly review: {
    readonly reviewer: string;
    readonly credential: string;
    readonly reviewedOn: string;
    readonly reviewBy: string;
    readonly contentVersion: string;
  };
}

export interface AdoptionPack {
  readonly schemaVersion: typeof ADOPTION_PACK_SCHEMA_VERSION;
  readonly release: string;
  readonly repositoryUrl: string;
  readonly capabilityVersion: string;
  readonly statements: {
    readonly notForClinicalUse: string;
    readonly notClinicallyReviewed: string;
    readonly notCertification: string;
    readonly noAccountRequired: string;
  };
  readonly catalog: readonly {
    readonly moduleId: string;
    readonly capabilityVersion: string;
    readonly scenarioCount: number;
    readonly completionSchemaVersion: number;
    readonly maturitySchemaVersion: number;
  }[];
  readonly reviewedCoverage: {
    readonly region: string | null;
    readonly totalScenarios: number;
    readonly reviewed: number;
    readonly excluded: number;
    readonly byStatus: Readonly<Record<ContentMaturity, number>>;
    readonly overdue: number;
    readonly withdrawn: number;
  };
  readonly excluded: readonly AdoptionExclusion[];
  readonly scenarios: readonly AdoptionScenario[];
  readonly reviewers: readonly BoardMember[];
  readonly endorsements: readonly never[];
  readonly conflicts: readonly { readonly name: string; readonly competingInterests: string }[];
  readonly expirations: readonly {
    readonly moduleId: string; readonly scenarioId: string;
    readonly contentVersion: string; readonly reviewBy: string;
  }[];
  readonly competency: AdoptionPackInput['competency'];
  readonly offline: {
    readonly condition: string;
    readonly worksOffline: readonly string[];
    readonly needsNetwork: readonly string[];
  };
  readonly reportDataToCloudflare: {
    readonly fields: readonly string[];
    readonly optional: readonly string[];
    readonly turnstileToken: string;
    readonly networkAddress: string;
    readonly notAttached: string;
    readonly selfHost: string;
  };
  readonly accessibility: {
    readonly status: string;
    readonly stillOwed: readonly string[];
  };
  readonly records: Readonly<Record<string, string>>;
}

/** The manual accessibility checks `docs/accessibility-audit.md` lists as still owed. */
export const ACCESSIBILITY_STILL_OWED = [
  'Screen reader narration',
  '400% browser zoom reflow',
  'Keyboard-only completion by someone who does not know the code',
] as const;

function exclusionFor(
  status: ContentMaturity,
  practiceRegions: readonly string[],
  review: ReviewRecord,
  scenarioId: string,
  contentVersion: string,
  region: string | undefined,
  today: Date,
): { reason: ExclusionReason; detail: string } | undefined {
  if (status === 'withdrawn') {
    return { reason: 'withdrawn', detail: 'Withdrawn content is unavailable and never counts as reviewed.' };
  }
  if (!isReviewedOnlyStatus(status)) {
    const reason: ExclusionReason = status === 'source_checked'
      ? 'source-checked' : status as 'draft' | 'preview';
    return {
      reason,
      detail: `Its status is "${MATURITY_LABELS[status]}". Only current clinically reviewed or `
        + 'institution-endorsed content counts toward reviewed coverage.',
    };
  }
  if (region !== undefined && !practiceRegions.includes(region)) {
    return {
      reason: 'region',
      detail: `It is authored for ${practiceRegions.join(', ')}, not ${region}.`,
    };
  }
  const verdict = gate({ id: scenarioId, kind: 'scenario', contentVersion, review }, today);
  if (verdict.status === 'current') return undefined;
  if (verdict.status === 'overdue') return { reason: 'overdue', detail: verdict.reason };
  return { reason: 'review-not-current', detail: verdict.reason };
}

export function buildAdoptionPack(input: AdoptionPackInput): AdoptionPack {
  const scenarios: AdoptionScenario[] = [];
  const excluded: AdoptionExclusion[] = [];
  const byStatus = Object.fromEntries(
    Object.keys(MATURITY_LABELS).map((status) => [status, 0]),
  ) as Record<ContentMaturity, number>;
  const expirations: AdoptionPack['expirations'][number][] = [];

  for (const completion of input.completions) {
    const maturity = input.maturity.find((catalog) => catalog.moduleId === completion.moduleId);
    if (!maturity) throw new Error(`adoption pack: no maturity catalog for ${completion.moduleId}`);
    for (const audit of completion.scenarios) {
      const record = maturityFor(maturity, 'scenario', audit.scenarioId, audit.contentVersion);
      if (!record) {
        throw new Error(`adoption pack: no exact-version maturity record for ${audit.scenarioId}@${audit.contentVersion}`);
      }
      const authored = input.authored(completion.moduleId, audit.scenarioId, audit.contentVersion);
      const exclusion = exclusionFor(record.status, audit.practiceRegions, authored.review,
        audit.scenarioId, audit.contentVersion, input.region, input.today);
      byStatus[record.status] += 1;
      if (exclusion) {
        excluded.push({
          moduleId: completion.moduleId, scenarioId: audit.scenarioId,
          contentVersion: audit.contentVersion, status: record.status, ...exclusion,
        });
      }
      if (isReviewedOnlyStatus(record.status)) {
        expirations.push({
          moduleId: completion.moduleId, scenarioId: audit.scenarioId,
          contentVersion: audit.contentVersion, reviewBy: authored.review.reviewBy,
        });
      }
      scenarios.push({
        moduleId: completion.moduleId,
        scenarioId: audit.scenarioId,
        title: audit.title,
        contentVersion: audit.contentVersion,
        capabilityVersion: audit.capabilityVersion,
        maturity: record.status,
        practiceRegions: audit.practiceRegions,
        inReviewedCoverage: exclusion === undefined,
        sources: authored.sources,
        limitationIds: authored.limitationIds,
        corrections: input.corrections
          .filter((entry) => entry.item === audit.scenarioId)
          .map((entry) => ({ released: entry.released, title: entry.title })),
        review: {
          reviewer: authored.review.reviewer,
          credential: authored.review.credential,
          reviewedOn: authored.review.reviewedOn,
          reviewBy: authored.review.reviewBy,
          contentVersion: authored.review.contentVersion,
        },
      });
    }
  }

  const records: Record<string, string> = {
    accessibility: 'docs/accessibility-audit.md',
    security: 'SECURITY.md',
    privacy: 'docs/problem-reporting.md',
    governance: 'GOVERNANCE.md',
    corrections: 'CORRECTIONS.md',
    endorsements: 'docs/organizational-endorsement.md',
    deployment: 'docs/deployment.md',
    sources: '/catalog/evidence-sources.json',
    assetLicenses: '/catalog/asset-licenses.json',
    reportCatalog: '/catalog/scenario-report-catalog.json',
  };
  for (const completion of input.completions) {
    records[`${completion.moduleId}/completion`] = `/catalog/${completion.moduleId}-completion-audit.json`;
    records[`${completion.moduleId}/quality`] = `/catalog/${completion.moduleId}-quality-audit.json`;
    records[`${completion.moduleId}/maturity`] = `/catalog/${completion.moduleId}-maturity.json`;
  }

  return {
    schemaVersion: ADOPTION_PACK_SCHEMA_VERSION,
    release: input.release,
    repositoryUrl: input.repositoryUrl,
    capabilityVersion: input.capabilityVersion,
    statements: {
      notForClinicalUse: NOT_FOR_CLINICAL_USE,
      notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
      notCertification: NOT_CERTIFICATION,
      noAccountRequired: 'Evaluating, installing and using this release needs no account, contact '
        + 'or sign-in. Every record named here is a public file in the repository or the build.',
    },
    catalog: input.completions.map((completion) => ({
      moduleId: completion.moduleId,
      capabilityVersion: completion.capabilityVersion,
      scenarioCount: completion.scenarioCount,
      completionSchemaVersion: completion.schemaVersion,
      maturitySchemaVersion: input.maturity.find((catalog) => catalog.moduleId === completion.moduleId)!
        .schemaVersion,
    })),
    reviewedCoverage: {
      region: input.region ?? null,
      totalScenarios: scenarios.length,
      reviewed: scenarios.length - excluded.length,
      excluded: excluded.length,
      byStatus,
      overdue: excluded.filter((entry) => entry.reason === 'overdue').length,
      withdrawn: byStatus.withdrawn,
    },
    excluded,
    scenarios,
    reviewers: input.board,
    // No organizational endorsement record exists (docs/organizational-endorsement.md).
    endorsements: [],
    conflicts: input.board.filter(needsCoSignature)
      .map((member) => ({ name: member.name, competingInterests: member.competingInterests })),
    expirations,
    competency: input.competency,
    offline: {
      condition: 'After the offline download finishes and the page is reloaded once while online.',
      worksOffline: [
        'every bundled scenario, its models and its debrief',
        'citations, briefings and the prerendered documents',
        'every machine-readable catalog file, including this pack',
      ],
      needsNetwork: [
        'the first download and later updates',
        'the optional anonymous problem report',
      ],
    },
    reportDataToCloudflare: {
      fields: REPORT_REQUEST_FIELDS,
      optional: ['note', 'recent_context'],
      turnstileToken: 'The Turnstile token is a single-use transport credential. It is never shown '
        + 'in the preview or stored, and it expires after 5 minutes.',
      networkAddress: 'A daily HMAC of the Cloudflare-provided network address exists only in '
        + '14-day counter rows; the raw address never enters D1.',
      notAttached: 'The client does not automatically attach a timestamp, network address, user '
        + 'agent, locale, account, email, cookie, name, reflection, history, imported file, or '
        + 'device identifier.',
      selfHost: 'A static-only self-host receives no report configuration and sends nothing.',
    },
    accessibility: {
      status: 'Automated checks run on every build. Three manual checks are still owed, so no '
        + 'conformance level is claimed.',
      stillOwed: ACCESSIBILITY_STILL_OWED,
    },
    records,
  };
}
