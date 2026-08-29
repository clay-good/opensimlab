/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LostContingencyTray } from '../../src/modules/medical-surgical-nursing/LostContingencyTray';
import { LostContingency, LOST_CONTINGENCY_OUTPUT_TICKS as OUTPUT,
  LOST_CONTINGENCY_CONFIRMATION_TICKS as CONFIRM,
  type LostContingencyAction } from '../../src/modules/medical-surgical-nursing/lost-contingency';

const labels: Record<LostContingencyAction, string> = {
  'record-what-was-said': 'Write down what was actually said',
  'check-the-notes': 'Read the post-operative notes',
  'record-the-gap-as-a-transmission-gap': 'Record the difference',
  'reconstruct-the-contingency': 'Reconstruct the plan from the notes',
  'record-what-the-gap-changes': 'State what the gap changed',
  'confirm-the-plan-with-the-team': 'Confirm the plan with the surgical team',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Keep the observations against the threshold',
  reassess: 'Reassess the handover against the record',
  handoff: 'Hand off the plan, said out loud',
  'nothing-said-means-nothing-applies': 'It was not said, so it does not apply',
  'ask-the-day-nurse-to-remember': 'Phone the day nurse to ask',
  'a-quiet-handover-means-a-stable-patient': 'A short handover means a simple patient',
  'write-a-plan-of-my-own': 'Write a contingency plan myself',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: LostContingency, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<LostContingencyTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);
const ready = (model: LostContingency) => {
  model.apply('record-what-was-said', 0);
  model.apply('check-the-notes', 1);
  model.apply('record-the-gap-as-a-transmission-gap', 2);
  model.apply('reconstruct-the-contingency', 3);
  return model;
};

describe('Handover-loss tray', () => {
  it('shows both counts side by side, never a single total', () => {
    render(new LostContingency(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Said at handover: 3 elements');
    expect(status).toContain('Written in the notes: 4');
    expect(status).toContain('in the notes and was not said');
  });

  it('lists each source only once it has been read, and marks the extra line', () => {
    render(new LostContingency(), 0);
    expect(host.querySelectorAll('li')).toHaveLength(0);
    expect(host.textContent).toContain('It is the only evidence that something was not said');
    const model = new LostContingency();
    model.apply('record-what-was-said', 0);
    model.apply('check-the-notes', 1);
    render(model, 2);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(7);
    expect(items.filter((text) => text.startsWith('Said — '))).toHaveLength(3);
    expect(items.filter((text) => text.startsWith('Written — '))).toHaveLength(3);
    const extra = items.filter((text) => text.startsWith('Written, and not said — '));
    expect(extra).toHaveLength(1);
    expect(extra[0]).toContain('call the surgical registrar');
  });

  it('says the record is complete once the notes are read', () => {
    const model = new LostContingency();
    model.apply('check-the-notes', 0);
    render(model, 1);
    expect(host.textContent).toContain('The record is complete and correct; nothing here was charted wrongly');
  });

  it('withholds the reconstruction until it exists', () => {
    render(new LostContingency(), 0);
    expect(host.textContent).toContain('still held only in the notes');
    render(ready(new LostContingency()), 4);
    expect(host.textContent).toContain('Reconstructed at simulated');
    expect(host.textContent).toContain('call the surgical registrar');
  });

  it('shows the output as above the threshold and not as a trigger', () => {
    render(new LostContingency(), 0);
    expect(host.textContent).not.toContain('last hourly urine output');
    const model = new LostContingency();
    model.advance(OUTPUT + 10);
    render(model, OUTPUT + 10);
    expect(host.textContent).toContain('above the plan’s threshold of 34 mL');
    expect(host.textContent).toContain('Nothing is triggered');
  });

  it('keeps the confirmation out of the tray until the learner looks', () => {
    const model = ready(new LostContingency());
    model.apply('confirm-the-plan-with-the-team', 4);
    model.advance(4 + CONFIRM + 20);
    render(model, 4 + CONFIRM + 20);
    expect(host.textContent).not.toContain('has confirmed the plan stands');
    model.apply('reassess', 4 + CONFIRM + 21);
    render(model, 4 + CONFIRM + 22);
    expect(host.textContent).toContain('has confirmed the plan stands');
  });

  it('says a refused choice does not block a later appropriate handoff', () => {
    const model = new LostContingency();
    model.apply('write-a-plan-of-my-own', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new LostContingency(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new LostContingency(), 0);
    act(() => button(labels['check-the-notes'])!.click());
    expect(onAction).toHaveBeenCalledWith('check-the-notes');
  });

  it('names no drug or fluid and disables everything during a worked example', () => {
    render(ready(new LostContingency()), 4);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['morphine', 'hartmann', 'furosemide', 'ml/kg']) expect(text).not.toContain(term);
    render(new LostContingency(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
