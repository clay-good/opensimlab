/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrialRuleTray } from '../../src/modules/oncology/TrialRuleTray';
import { TrialRule } from '../../src/modules/oncology/trial-rule';
import { TRIAL_RULE_DOCUMENT_TICKS as DOCUMENT, TRIAL_RULE_TEAM_TICKS as TEAM, type TrialRuleAction } from '../../src/modules/oncology/trial-rule';

const labels: Record<TrialRuleAction, string> = {
  'record-the-clinical-trajectory-not-just-the-scan': 'Record the trajectory, not just the scan',
  'record-what-the-criteria-do-and-do-not-govern': 'Record what the criteria do not govern',
  'escalate-to-the-treating-team-now': 'Call the treating team now',
  'record-bounded-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-supplied-imaging-report': 'Check the supplied report only',
  reassess: 'Reassess the patient and the report',
  handoff: 'Hand off the direction and its rate',
  'call-it-pseudoprogression-and-continue': 'Call it pseudoprogression and continue',
  'stop-the-immunotherapy-and-tell-her-it-failed': 'Stop the immunotherapy and tell her it failed',
  'the-scan-alone-decides': 'The scan alone decides',
  'rescan-in-eight-weeks-and-review-then': 'Rescan in eight weeks and review then',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: TrialRule, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<TrialRuleTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Response-assessment tray', () => {
  it('leads with the criterion and the condition it attaches', () => {
    render(new TrialRule(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('while the patient is clinically stable');
    expect(status).toContain('she is not clinically stable');
    expect(host.textContent).toContain('You are being asked about a slope');
  });

  it('gives the trajectory and what the colleague said', () => {
    render(new TrialRule(), 0);
    expect(host.textContent).toContain('needing help to wash');
    expect(host.textContent).toContain('could be pseudoprogression');
  });

  it('withholds the reported rates until the boundaries are reviewed', () => {
    render(new TrialRule(), 0);
    expect(host.textContent).not.toContain('13.8 percent');
    const model = new TrialRule();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('13.8 percent');
    expect(host.textContent).toContain('premature discontinuation');
  });

  it('shows the criteria once they have arrived, with the patient unchanged', () => {
    const model = new TrialRule();
    model.advance(DOCUMENT + 10);
    render(model, DOCUMENT + 10);
    expect(host.textContent).toContain('The criteria are on the screen now');
    expect(host.textContent).toContain('not validated');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new TrialRule();
    model.apply('escalate-to-the-treating-team-now', 0);
    model.advance(TEAM + 10);
    render(model, TEAM + 10);
    expect(host.textContent).not.toContain('Her treating team has answered');
    model.apply('reassess', TEAM + 11);
    render(model, TEAM + 12);
    expect(host.textContent).toContain('Her treating team has answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new TrialRule(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new TrialRule(), 0);
    act(() => button(labels['escalate-to-the-treating-team-now'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-to-the-treating-team-now');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new TrialRule();
    model.apply('escalate-to-the-treating-team-now', 0);
    const onAction = render(model, 1);
    const control = button(labels['escalate-to-the-treating-team-now'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new TrialRule();
    model.apply('record-bounded-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['pembrolizumab', 'nivolumab', 'atezolizumab', 'docetaxel']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new TrialRule(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
