/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InheritedUrgencyTray } from '../../src/modules/oncology/InheritedUrgencyTray';
import { InheritedUrgency } from '../../src/modules/oncology/inherited-urgency';
import { INHERITED_URGENCY_OFFER_TICKS as OFFER, INHERITED_URGENCY_TEAM_TICKS as TEAM, type InheritedUrgencyAction } from '../../src/modules/oncology/inherited-urgency';

const labels: Record<InheritedUrgencyAction, string> = {
  'record-the-findings-that-would-make-it-an-emergency': 'Record the findings that would make it an emergency',
  'record-that-the-tissue-decides-the-treatment': 'Record that the tissue decides the treatment',
  'secure-the-diagnostic-pathway': 'Secure the diagnostic pathway',
  'record-bounded-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-supplied-imaging': 'Check the supplied imaging only',
  reassess: 'Reassess the patient and the imaging',
  handoff: 'Hand off what would change the answer',
  'start-radiotherapy-tonight-before-the-biopsy': 'Start radiotherapy tonight, before the biopsy',
  'the-swelling-alone-makes-it-an-emergency': 'The swelling alone makes it an emergency',
  'send-him-home-to-await-the-biopsy': 'Send him home to await the biopsy',
  'treat-the-distended-veins-with-a-diuretic': 'Treat the distended veins with a diuretic',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: InheritedUrgency, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<InheritedUrgencyTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Superior vena caval obstruction tray', () => {
  it('leads with the grading findings rather than the swelling', () => {
    render(new InheritedUrgency(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('are not present');
    expect(status).toContain('no stridor, fully alert, blood pressure unchanged');
    expect(host.textContent).toContain('Three findings decide whether this waits');
  });

  it('says there is no tissue diagnosis and when the list is', () => {
    render(new InheritedUrgency(), 0);
    expect(host.textContent).toContain('no tissue diagnosis');
    expect(host.textContent).toContain('biopsy list is tomorrow morning');
  });

  it('withholds the reported figures until the boundaries are reviewed', () => {
    render(new InheritedUrgency(), 0);
    expect(host.textContent).not.toContain('1,986');
    const model = new InheritedUrgency();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('1,986');
    expect(host.textContent).toContain('not a reason to stop looking');
  });

  it('shows the offer with the patient unchanged', () => {
    const model = new InheritedUrgency();
    model.advance(OFFER + 10);
    render(model, OFFER + 10);
    expect(host.textContent).toContain('has a slot tonight');
    expect(host.textContent).toContain('an offer, not a deterioration');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new InheritedUrgency();
    model.apply('secure-the-diagnostic-pathway', 0);
    model.advance(TEAM + 10);
    render(model, TEAM + 10);
    expect(host.textContent).not.toContain('Acute oncology has accepted him');
    model.apply('reassess', TEAM + 11);
    render(model, TEAM + 12);
    expect(host.textContent).toContain('Acute oncology has accepted him');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new InheritedUrgency(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new InheritedUrgency(), 0);
    act(() => button(labels['secure-the-diagnostic-pathway'])!.click());
    expect(onAction).toHaveBeenCalledWith('secure-the-diagnostic-pathway');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new InheritedUrgency();
    model.apply('secure-the-diagnostic-pathway', 0);
    const onAction = render(model, 1);
    const control = button(labels['secure-the-diagnostic-pathway'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new InheritedUrgency();
    model.apply('record-bounded-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['dexamethasone', 'prednisolone', 'furosemide', 'heparin']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new InheritedUrgency(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
