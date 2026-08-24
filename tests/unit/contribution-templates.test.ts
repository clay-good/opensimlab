import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const issue = readFileSync(join(root, '.github/ISSUE_TEMPLATE/change-proposal.yml'), 'utf8');
const pullRequest = readFileSync(join(root, '.github/pull_request_template.md'), 'utf8');

const requiredConcepts = [
  'Scope and learner value', 'Sources and exact locators', 'Tests and verification',
  'Limitations and hazards', 'Maturity effect', 'Reviewer-domain impact',
  'Contribution provenance',
] as const;

describe('public contribution templates', () => {
  it('requires every evidence and governance field in the issue form', () => {
    for (const concept of requiredConcepts) expect(issue).toContain(concept);
    expect((issue.match(/required: true/g) ?? [])).toHaveLength(8);
    expect(issue).toContain('does not create a calculator, real-patient input');
  });

  it('carries the same contract into pull requests', () => {
    for (const concept of requiredConcepts) {
      const pullRequestConcept = concept === 'Tests and verification' ? 'Proof it works' : concept;
      expect(pullRequest).toContain(`## ${pullRequestConcept}`);
    }
    expect(pullRequest).toContain('`npm run ci` passes');
    expect(pullRequest).toContain('SEO copy');
  });

  it('disables unstructured issues and routes security reports privately', () => {
    const config = readFileSync(join(root, '.github/ISSUE_TEMPLATE/config.yml'), 'utf8');
    expect(config).toContain('blank_issues_enabled: false');
    expect(config).toContain('/security/advisories/new');
    expect(config).toContain('never include sensitive data');
  });
});
