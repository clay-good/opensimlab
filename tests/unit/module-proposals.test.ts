import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { judgeProposal, loadProposals, MINIMUM_SCENARIO_PROPOSALS } from '../../scripts/module-proposals';
import { MODULES } from '@platform/modules/registry';
import { MODULE_PROPOSALS } from '@platform/modules/proposals';
import { About } from '@landing/About';

const scenario = (title: string, actions = 'Recognize, escalate, and reassess in a set order') =>
  `### ${title}\n\nActions: ${actions}\nChoices: when to escalate, and which of two paths\n`
  + 'Consequences: the patient deteriorates on a delay the monitor shows\n'
  + 'Debrief: attributes the deterioration to the delayed escalation\n';

const document = (status: string, scenarios: number, extra = '') => [
  '# Example', 'Title: Example module', `Status: ${status}`, extra, '',
  '## Learner roles and setting', 'Ward nurses on a medical ward.',
  '## Scenario proposals', Array.from({ length: scenarios }, (_, index) => scenario(`Case ${index + 1}`)).join('\n'),
  '## Shared capabilities', 'Composes the ward shell.',
  '## Formulary', 'Two agents, each with a source locator.',
  '## Review domains', 'Nursing.',
  '## Negative-transfer analysis', 'A learner could over-trust one reading; mitigated by the debrief.',
  '## Regional variation', 'Early-warning scores differ between regions.',
].join('\n');

describe('the module breadth test', () => {
  it('refuses a planned or passed status with seven scenario proposals, and names the shortfall', () => {
    const seven = judgeProposal('example', document('breadth-test-passed', 7), () => true);
    expect(seven.earned).toBe('proposed');
    expect(seven.refusals).toContain(`7 of ${MINIMUM_SCENARIO_PROPOSALS} scenario proposals pass the training-value rule`);
  });

  it('passes the breadth test at eight, and plans only once evidence briefs exist', () => {
    expect(judgeProposal('example', document('breadth-test-passed', 8), () => true).refusals).toEqual([]);
    const noBriefs = judgeProposal('example', document('planned', 8, 'Evidence briefs: docs/evidence-briefs/x.md'), () => false);
    expect(noBriefs.earned).toBe('breadth-test-passed');
    expect(noBriefs.refusals).toContain('planned needs its first evidence briefs to exist');
    expect(judgeProposal('example', document('planned', 8, 'Evidence briefs: docs/evidence-briefs/x.md'), () => true).refusals)
      .toEqual([]);
  });

  it('does not count a scenario that is a runtime utility, or one missing a training-value part', () => {
    const text = document('breadth-test-passed', 7)
      .replace('## Shared capabilities', `${scenario('A dose calculator')}\n## Shared capabilities`);
    const judged = judgeProposal('example', text, () => true);
    expect(judged.countingScenarios).toBe(7);
    expect(judged.scenarios.find((entry) => entry.title === 'A dose calculator')?.problems)
      .toContain('reads as a runtime utility rather than a rehearsal');
    const partial = judgeProposal('example', document('proposed', 1).replace(/^Debrief:.*$/m, ''), () => true);
    expect(partial.scenarios[0]?.problems).toEqual(['no "Debrief:" line']);
  });

  it('treats a section that is not written yet as missing', () => {
    const judged = judgeProposal('example', document('breadth-test-passed', 8)
      .replace('Two agents, each with a source locator.', 'Not yet written.'), () => true);
    expect(judged.missingSections).toEqual(['Formulary']);
    expect(judged.earned).toBe('proposed');
  });

  it('keeps a declined proposal only with its reason', () => {
    expect(judgeProposal('example', document('declined', 0), () => true).refusals)
      .toContain('a declined proposal must say why on a "Declined because:" line');
    expect(judgeProposal('example', document('declined', 0, 'Declined because: overlaps toxicology'), () => true).refusals)
      .toEqual([]);
  });
});

describe('the proposals in this repository', () => {
  const proposals = loadProposals(process.cwd());

  it('all claim only the status they have earned', () => {
    expect(proposals.length).toBeGreaterThanOrEqual(4);
    for (const proposal of proposals) expect(proposal.refusals, proposal.id).toEqual([]);
  });

  it('are mirrored exactly by what the About page lists', () => {
    expect(MODULE_PROPOSALS.map(({ id, title, status, scenarioProposals }) => ({ id, title, status, scenarioProposals })))
      .toEqual(proposals.map(({ id, title, status, countingScenarios }) => ({ id, title, status, scenarioProposals: countingScenarios })));
    const markup = renderToStaticMarkup(createElement(About));
    expect(markup).toContain('Proposed, not planned');
    for (const proposal of MODULE_PROPOSALS) expect(markup).toContain(proposal.title);
  });

  it('let a module be planned in the registry only through a planned proposal', () => {
    const planned = new Set(proposals.filter((proposal) => proposal.status === 'planned').map((proposal) => proposal.id));
    for (const module of MODULES.filter((entry) => entry.status === 'planned')) {
      expect(planned.has(module.id), `${module.id} is planned without a planned proposal`).toBe(true);
    }
  });
});
