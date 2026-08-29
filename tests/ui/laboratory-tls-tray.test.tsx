/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LaboratoryTlsTray } from '../../src/modules/oncology/LaboratoryTlsTray';
import { LaboratoryTls, LABORATORY_TLS_REPEAT_TICKS as REPEAT,
  LABORATORY_TLS_TEAM_TICKS as TEAM,
  type LaboratoryTlsAction } from '../../src/modules/oncology/laboratory-tls';

const labels: Record<LaboratoryTlsAction, string> = {
  'record-which-definition-is-met': 'Record which definition is met',
  'record-what-crossed-and-when': 'Record what crossed, and when',
  'record-the-crossing-risk': 'Record what raises the risk of crossing',
  'escalate-to-the-treating-team': 'Report the trajectory to the treating team',
  'record-bounded-monitoring-and-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-bloods': 'Check the bloods only',
  reassess: 'Reassess the patient and the bloods',
  handoff: 'Hand off the window and what it rests on',
  'he-is-well-so-it-is-just-numbers': 'He is well, so these are just numbers',
  'call-it-tumour-lysis-and-move-him-to-intensive-care': 'Call it tumour lysis, move him to intensive care',
  'wait-for-the-next-set-before-telling-anyone': 'Wait for the next set before telling anyone',
  'treat-the-potassium-and-stand-down': 'Treat the potassium and stand down',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: LaboratoryTls, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<LaboratoryTlsTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Laboratory tumour-lysis tray', () => {
  it('leads with both halves of the definition', () => {
    render(new LaboratoryTls(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Laboratory criteria: met');
    expect(status).toContain('Clinical criteria: not met');
    expect(host.textContent).toContain('The definition is met by his results, not by him');
  });

  it('names the two readings the ward is stuck between', () => {
    render(new LaboratoryTls(), 0);
    expect(host.textContent).toContain('needs intensive care');
    expect(host.textContent).toContain('just numbers');
  });

  it('withholds the disagreeing rates until the boundaries are reviewed', () => {
    render(new LaboratoryTls(), 0);
    expect(host.textContent).not.toContain('27.8 percent');
    const model = new LaboratoryTls();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('27.8 percent');
    expect(host.textContent).toContain('which is not what it measured');
  });

  it('shows the repeat set moving while the patient does not', () => {
    const model = new LaboratoryTls();
    model.advance(REPEAT + 10);
    render(model, REPEAT + 10);
    expect(host.textContent).toContain('The laboratory picture has moved and the patient has not');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new LaboratoryTls();
    model.apply('escalate-to-the-treating-team', 0);
    model.advance(TEAM + 10);
    render(model, TEAM + 10);
    expect(host.textContent).not.toContain('The treating team has answered');
    model.apply('reassess', TEAM + 11);
    render(model, TEAM + 12);
    expect(host.textContent).toContain('The treating team has answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new LaboratoryTls(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new LaboratoryTls(), 0);
    act(() => button(labels['escalate-to-the-treating-team'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-to-the-treating-team');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new LaboratoryTls();
    model.apply('record-which-definition-is-met', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-which-definition-is-met'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new LaboratoryTls();
    model.apply('record-bounded-monitoring-and-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['rasburicase', 'allopurinol', 'calcium gluconate']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new LaboratoryTls(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
