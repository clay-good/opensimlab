import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MaturityCatalog } from '@platform/catalog/maturity';
import type { ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import {
  ACCESSIBILITY_STILL_OWED, ADOPTION_PACK_PATH, ADOPTION_PACK_RELEASE_TOKEN, buildAdoptionPack,
  REPORT_REQUEST_FIELDS, type AdoptionPack, type AdoptionPackInput,
} from '@platform/adoption/adoption-pack';
import { PUBLIC_CATALOG_ARTIFACTS } from '@platform/catalog/public-artifacts';
import { buildScenarioReportRequest } from '@platform/reporting/contracts';
import { UNSIGNED_MARKER } from '@platform/governance/review-gate';
import { adoptionPackInput, AUTHORED_SCENARIOS } from '../../scripts/adoption-pack-input.ts';
import { unresolvedBuildToken } from '../../scripts/check-static-host.ts';

const root = process.cwd();
const readJson = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), 'utf8')) as T;
const moduleIds = AUTHORED_SCENARIOS.map(([moduleId]) => moduleId);
const completions = moduleIds.map((id) =>
  readJson<ScenarioCompletionCatalog>(`public/catalog/${id}-completion-audit.json`));
const maturity = moduleIds.map((id) => readJson<MaturityCatalog>(`public/catalog/${id}-maturity.json`));
const committed = readJson<AdoptionPack>(`public${ADOPTION_PACK_PATH}`);
const today = new Date();
const realInput = adoptionPackInput(completions, maturity, today);

describe('static adoption pack', () => {
  it('is published with the other catalog files and equals a fresh build', () => {
    expect(PUBLIC_CATALOG_ARTIFACTS).toContain(ADOPTION_PACK_PATH);
    expect(committed).toEqual(JSON.parse(JSON.stringify(buildAdoptionPack(realInput))));
    // The committed file carries the token; the build replaces it and fails if it cannot.
    expect(committed.release).toBe(ADOPTION_PACK_RELEASE_TOKEN);
    expect(unresolvedBuildToken(JSON.stringify(committed))).toBe(ADOPTION_PACK_RELEASE_TOKEN);
  });

  it('reports zero reviewed coverage and lists all 256 scenarios as excluded, with reasons', () => {
    expect(committed.reviewedCoverage).toMatchObject({
      totalScenarios: 256, reviewed: 0, excluded: 256, overdue: 0, withdrawn: 0,
    });
    expect(committed.scenarios).toHaveLength(256);
    expect(committed.excluded).toHaveLength(256);
    const keys = new Set(committed.excluded.map((entry) =>
      `${entry.moduleId}:${entry.scenarioId}@${entry.contentVersion}`));
    expect(keys.size).toBe(256);
    for (const entry of committed.excluded) {
      expect(entry.status).toBe('preview');
      expect(entry.reason).toBe('preview');
      expect(entry.detail).toMatch(/Not clinically reviewed/);
    }
    for (const scenario of committed.scenarios) {
      expect(scenario.inReviewedCoverage).toBe(false);
      expect(scenario.review.reviewer).toBe(UNSIGNED_MARKER);
      expect(scenario.sources.length).toBeGreaterThan(0);
      expect(scenario.limitationIds.length).toBeGreaterThan(0);
    }
    // Nothing is invented while the board is empty.
    expect(committed.reviewers).toEqual([]);
    expect(committed.endorsements).toEqual([]);
    expect(committed.conflicts).toEqual([]);
    expect(committed.expirations).toEqual([]);
  });

  describe('with synthetic review records', () => {
    const base = completions[0]!;
    const [reviewedId, overdueId, withdrawnId] = base.scenarios.slice(0, 3).map((s) => s.scenarioId);
    const statusOf = (id: string) => id === withdrawnId ? 'withdrawn' as const
      : id === reviewedId || id === overdueId ? 'clinically_reviewed' as const : 'preview' as const;
    const completion: ScenarioCompletionCatalog = {
      ...base,
      scenarios: base.scenarios.map((scenario) => ({ ...scenario, maturity: statusOf(scenario.scenarioId) })),
    };
    const moduleMaturity = maturity[0]!;
    const syntheticMaturity: MaturityCatalog = {
      ...moduleMaturity,
      records: moduleMaturity.records.map((record) => record.subjectKind === 'scenario'
        ? { ...record, status: statusOf(record.subjectId) } : record),
    };
    const input: AdoptionPackInput = {
      ...realInput,
      today: new Date('2027-01-01T00:00:00Z'),
      completions: [completion],
      maturity: [syntheticMaturity],
      authored: (moduleId, scenarioId, contentVersion) => {
        const real = realInput.authored(moduleId, scenarioId, contentVersion);
        if (scenarioId !== reviewedId && scenarioId !== overdueId) return real;
        return {
          ...real,
          review: {
            reviewer: 'Synthetic Reviewer', credential: 'MD', reviewedOn: '2026-01-01',
            reviewBy: scenarioId === reviewedId ? '2028-01-01' : '2026-06-01',
            contentVersion, sources: ['synthetic source'],
          },
        };
      },
    };
    const pack = buildAdoptionPack(input);
    const exclusion = (id: string) => pack.excluded.find((entry) => entry.scenarioId === id);

    it('counts a current exact-version reviewed item and does not exclude it', () => {
      expect(pack.reviewedCoverage.reviewed).toBe(1);
      expect(exclusion(reviewedId!)).toBeUndefined();
      expect(pack.scenarios.find((s) => s.scenarioId === reviewedId)?.inReviewedCoverage).toBe(true);
      expect(pack.expirations.map((entry) => entry.scenarioId)).toContain(reviewedId);
    });

    it('excludes overdue and withdrawn items with the right reason', () => {
      expect(exclusion(overdueId!)).toMatchObject({ status: 'clinically_reviewed', reason: 'overdue' });
      expect(exclusion(withdrawnId!)).toMatchObject({ status: 'withdrawn', reason: 'withdrawn' });
      expect(pack.reviewedCoverage.overdue).toBe(1);
      expect(pack.reviewedCoverage.withdrawn).toBe(1);
      expect(pack.reviewedCoverage.excluded).toBe(base.scenarios.length - 1);
    });

    it('excludes a reviewed item outside the requested practice region', () => {
      const scoped = buildAdoptionPack({ ...input, region: 'ZZ' });
      expect(scoped.reviewedCoverage.reviewed).toBe(0);
      expect(scoped.excluded.find((entry) => entry.scenarioId === reviewedId)?.reason).toBe('region');
    });
  });

  it('makes no certification or authorization claim', () => {
    const { scenarios: _scenarios, ...rest } = committed;
    const { mappings: _mappings, ...competency } = committed.competency;
    const text = JSON.stringify({ ...rest, competency }).toLowerCase();
    // Instruction and claim voice only: the pack's own negations ("does not certify
    // competence") must not trip the guard.
    for (const claim of [
      'certifies competence', 'certifies your competence', 'satisfies supervised',
      'satisfies the supervised', 'authorizes clinical work', 'authorises clinical work',
      'counts toward your', 'counts toward any', 'is accredited', 'is certified',
      'endorsed by',
    ]) expect(text, claim).not.toContain(claim);
    expect(committed.statements.notCertification).toMatch(/does not certify competence/);
  });

  it('resolves every claim to a public repository or catalog record', () => {
    for (const [claim, path] of Object.entries(committed.records)) {
      const onDisk = path.startsWith('/catalog/') ? join(root, 'public', path) : join(root, path);
      expect(existsSync(onDisk), `${claim} → ${path}`).toBe(true);
    }
  });

  it('lists exactly the fields a problem report sends', () => {
    const request = buildScenarioReportRequest({
      scenarioId: 's', contentVersion: '0.1.0', appVersion: 'a', engineVersion: 'e', moduleId: 'm',
      maturity: 'preview', practiceRegion: 'US', fidelityClass: 'state_transition',
      surface: 'live', simulatedTick: 1, canonicalUrl: 'https://opensimlab.com/x',
    }, 'other', 'note', 'token');
    expect([...REPORT_REQUEST_FIELDS]).toEqual(Object.keys(request));
    expect(committed.reportDataToCloudflare.fields).toEqual(Object.keys(request));
  });

  it('states the accessibility gaps the audit still owes', () => {
    const audit = readFileSync(join(root, 'docs/accessibility-audit.md'), 'utf8');
    const owed = audit.slice(audit.indexOf('## Still owed'));
    const bullets = [...owed.matchAll(/^- \*\*(.+?)\.\*\*/gm)].map((match) => match[1]);
    expect(bullets).toEqual([...ACCESSIBILITY_STILL_OWED]);
    expect(committed.accessibility.stillOwed).toEqual([...ACCESSIBILITY_STILL_OWED]);
  });

  it('keeps the educators page honest about reviewed coverage', () => {
    const page = readFileSync(join(root, 'src/routes/EducatorsRoute.tsx'), 'utf8');
    expect(page).toContain(`href="${ADOPTION_PACK_PATH}"`);
    if (page.includes('reviewed coverage is currently zero')) {
      expect(committed.reviewedCoverage.reviewed).toBe(0);
    }
  });
});
