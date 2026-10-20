/**
 * The module breadth test (learning/catalog-growth → A Module Passes The
 * Breadth Test Before It Is Planned).
 *
 * A proposed module is a checked-in document in `docs/module-proposals/`. This
 * reads each one and says what status it has earned. It never promotes a
 * proposal; it refuses a status the document has not earned.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const PROPOSAL_STATUSES = ['proposed', 'breadth-test-passed', 'planned', 'declined'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** The smallest shipped module has nine labs; below eight a module reads as a folder. */
export const MINIMUM_SCENARIO_PROPOSALS = 8;

export const REQUIRED_SECTIONS = [
  'Learner roles and setting', 'Scenario proposals', 'Shared capabilities', 'Formulary',
  'Review domains', 'Negative-transfer analysis', 'Regional variation',
] as const;

/** The four parts of the scenario training-value rule, as labelled lines. */
export const TRAINING_VALUE_FIELDS = ['Actions', 'Choices', 'Consequences', 'Debrief'] as const;

/** A scenario whose point is a number or a list is a runtime tool, not a rehearsal. */
const UTILITY = /\b(?:calculator|calculation tool|lookup|checklist answer|converter|dose tool)\b/i;

export interface ScenarioProposal {
  readonly title: string;
  readonly counts: boolean;
  readonly problems: readonly string[];
}

export interface ModuleProposal {
  readonly id: string;
  readonly title: string;
  readonly status: ProposalStatus;
  readonly declinedReason: string | null;
  readonly evidenceBriefs: readonly string[];
  readonly scenarios: readonly ScenarioProposal[];
  readonly countingScenarios: number;
  readonly missingSections: readonly string[];
  /** The highest status the document has earned, whatever it claims. */
  readonly earned: ProposalStatus;
  /** Why a claimed status is refused; empty when the claim holds. */
  readonly refusals: readonly string[];
}

const field = (text: string, name: string) =>
  new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(text)?.[1]?.trim() ?? null;

function sections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const parts = text.split(/^## /m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    map.set(part.slice(0, newline).trim(), part.slice(newline + 1).trim());
  }
  return map;
}

function scenarioProposals(body: string): ScenarioProposal[] {
  return body.split(/^### /m).slice(1).map((part) => {
    const newline = part.indexOf('\n');
    const title = part.slice(0, newline === -1 ? undefined : newline).trim();
    const text = newline === -1 ? '' : part.slice(newline + 1);
    const problems = TRAINING_VALUE_FIELDS
      .filter((name) => (field(text, name) ?? '').length < 10)
      .map((name) => `no "${name}:" line`);
    if (UTILITY.test(title) || UTILITY.test(field(text, 'Actions') ?? '')) {
      problems.push('reads as a runtime utility rather than a rehearsal');
    }
    return { title, counts: problems.length === 0, problems };
  });
}

/** Parse and judge one proposal document. `briefExists` checks an evidence brief path. */
export function judgeProposal(
  id: string, text: string, briefExists: (path: string) => boolean,
): ModuleProposal {
  const claimed = field(text, 'Status') as ProposalStatus | null;
  const status: ProposalStatus = claimed !== null && PROPOSAL_STATUSES.includes(claimed) ? claimed : 'proposed';
  const found = sections(text);
  // A section that only says it is not written yet is a gap, not an answer.
  const missingSections = REQUIRED_SECTIONS.filter((name) => {
    const body = found.get(name) ?? '';
    return body.length === 0 || /^(?:not|none) yet\b/i.test(body);
  });
  const scenarios = scenarioProposals(found.get('Scenario proposals') ?? '');
  const countingScenarios = scenarios.filter((scenario) => scenario.counts).length;
  const evidenceBriefs = (field(text, 'Evidence briefs') ?? '')
    .split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0 && entry !== 'none');
  const declinedReason = field(text, 'Declined because');

  const passes = missingSections.length === 0 && countingScenarios >= MINIMUM_SCENARIO_PROPOSALS;
  const briefsReal = evidenceBriefs.length > 0 && evidenceBriefs.every(briefExists);
  const earned: ProposalStatus = !passes ? 'proposed' : briefsReal ? 'planned' : 'breadth-test-passed';

  const refusals: string[] = [];
  if (claimed === null || !PROPOSAL_STATUSES.includes(claimed)) {
    refusals.push(`status must be one of ${PROPOSAL_STATUSES.join(', ')}`);
  }
  if (status === 'declined') {
    if (declinedReason === null) refusals.push('a declined proposal must say why on a "Declined because:" line');
  } else {
    const rank = (value: ProposalStatus) => PROPOSAL_STATUSES.indexOf(value);
    if (rank(status) > rank(earned)) {
      if (missingSections.length > 0) refusals.push(`missing sections: ${missingSections.join(', ')}`);
      if (countingScenarios < MINIMUM_SCENARIO_PROPOSALS) {
        refusals.push(`${countingScenarios} of ${MINIMUM_SCENARIO_PROPOSALS} scenario proposals pass the training-value rule`);
      }
      if (status === 'planned' && !briefsReal) refusals.push('planned needs its first evidence briefs to exist');
    }
  }
  return {
    id, title: field(text, 'Title') ?? id, status, declinedReason, evidenceBriefs, scenarios,
    countingScenarios, missingSections, earned, refusals,
  };
}

/** Every proposal in the repository. */
export function loadProposals(root: string): ModuleProposal[] {
  const dir = join(root, 'docs/module-proposals');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.md') && name !== 'README.md').sort()
    .map((name) => judgeProposal(name.replace(/\.md$/, ''), readFileSync(join(dir, name), 'utf8'),
      (path) => existsSync(join(root, path))));
}
