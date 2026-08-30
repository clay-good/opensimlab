/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SilentInteractionTray } from '../../src/modules/oncology/SilentInteractionTray';
import { SilentInteraction } from '../../src/modules/oncology/silent-interaction';
import { SILENT_INTERACTION_PHARMACY_TICKS as PHARMACY, SILENT_INTERACTION_TEAM_TICKS as TEAM, type SilentInteractionAction } from '../../src/modules/oncology/silent-interaction';

const labels: Record<SilentInteractionAction, string> = {
  'reconcile-what-she-is-actually-taking': 'Reconcile what she is actually taking',
  'record-the-interaction-and-its-direction': 'Record the interaction and its direction',
  'escalate-to-the-treating-team-now': 'Call the treating team now',
  'record-bounded-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-supplied-records': 'Check the supplied records only',
  reassess: 'Reassess the patient and the records',
  handoff: 'Hand off what has no abnormality in it',
  'tell-her-to-stop-the-acid-tablets-today': 'Tell her to stop the acid tablets today',
  'nothing-is-wrong-so-there-is-nothing-to-do': 'Nothing is wrong, so there is nothing to do',
  'the-interaction-is-only-theoretical': 'The interaction is only theoretical',
  'write-it-in-the-notes-and-move-on': 'Write it in the notes and move on',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: SilentInteraction, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<SilentInteractionTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Medicines-reconciliation tray', () => {
  it('leads with the absence rather than a list of normals', () => {
    render(new SilentInteraction(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('no abnormal finding of any kind');
    expect(status).toContain('The lists are the only place anything is wrong');
    expect(host.textContent).toContain('Three lists. All true. All different');
  });

  it('says which list holds what and that the pharmacy one is outstanding', () => {
    render(new SilentInteraction(), 0);
    expect(host.textContent).toContain('targeted tablet alone');
    expect(host.textContent).toContain('has not arrived');
  });

  it('withholds the reported estimates until the boundaries are reviewed', () => {
    render(new SilentInteraction(), 0);
    expect(host.textContent).not.toContain('1.42 to 1.76');
    const model = new SilentInteraction();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('1.42 to 1.76');
    expect(host.textContent).toContain('association rather than causation');
  });

  it('shows the pharmacy list once it has arrived', () => {
    const model = new SilentInteraction();
    model.advance(PHARMACY + 10);
    render(model, PHARMACY + 10);
    expect(host.textContent).toContain('holds six, including one she buys herself');
    expect(host.textContent).toContain('did not count it as medicine');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new SilentInteraction();
    model.apply('escalate-to-the-treating-team-now', 0);
    model.advance(TEAM + 10);
    render(model, TEAM + 10);
    expect(host.textContent).not.toContain('Her treating team has answered');
    model.apply('reassess', TEAM + 11);
    render(model, TEAM + 12);
    expect(host.textContent).toContain('Her treating team has answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new SilentInteraction(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new SilentInteraction(), 0);
    act(() => button(labels['reconcile-what-she-is-actually-taking'])!.click());
    expect(onAction).toHaveBeenCalledWith('reconcile-what-she-is-actually-taking');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new SilentInteraction();
    model.apply('reconcile-what-she-is-actually-taking', 0);
    const onAction = render(model, 1);
    const control = button(labels['reconcile-what-she-is-actually-taking'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new SilentInteraction();
    model.apply('record-bounded-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['omeprazole', 'lansoprazole', 'gefitinib', 'erlotinib']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new SilentInteraction(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
