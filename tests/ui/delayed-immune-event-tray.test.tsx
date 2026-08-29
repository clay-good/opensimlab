/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DelayedImmuneEventTray } from '../../src/modules/oncology/DelayedImmuneEventTray';
import { DelayedImmuneEvent } from '../../src/modules/oncology/delayed-immune-event';
import { DELAYED_IMMUNE_EVENT_COURSE_TICKS as COURSE, DELAYED_IMMUNE_EVENT_SERVICE_TICKS as SERVICE, type DelayedImmuneEventAction } from '../../src/modules/oncology/delayed-immune-event';

const labels: Record<DelayedImmuneEventAction, string> = {
  'record-the-completed-exposure': 'Record the completed exposure as current history',
  'record-the-symptom-course': 'Record the course against his baseline',
  'record-infection-evaluation-in-parallel': 'Record infection evaluation alongside',
  'escalate-to-the-treating-service': 'Contact the service that gave the drug',
  'record-bounded-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-exposure-history': 'Check the exposure history only',
  reassess: 'Reassess observations and exposure history',
  handoff: 'Hand off the exposure and what it rests on',
  'stopped-months-ago-so-not-the-drug': 'It stopped months ago, so not the drug',
  'slow-the-gut-and-review-tomorrow': 'Slow the gut and review tomorrow',
  'wait-for-stool-results-before-escalating': 'Wait for the stool results first',
  'discharge-with-oral-rehydration': 'Discharge with oral fluids and safety-netting',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: DelayedImmuneEvent, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<DelayedImmuneEventTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Delayed immune-event tray', () => {
  it('states the exposure and its interval, first', () => {
    render(new DelayedImmuneEvent(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('4 cycles of an anti-PD-1 checkpoint inhibitor');
    expect(status).toContain('last dose 22 weeks ago');
    expect(host.textContent).toContain('Nothing here is hidden');
  });

  it('names the referral letter as the thing that dropped the drug', () => {
    render(new DelayedImmuneEvent(), 0);
    expect(host.textContent).toContain('says infectious gastroenteritis and does not mention the immunotherapy');
  });

  it('withholds the delayed-event evidence until the exposure is recorded', () => {
    render(new DelayedImmuneEvent(), 0);
    expect(host.textContent).not.toContain('median off-treatment interval');
    const model = new DelayedImmuneEvent();
    model.apply('record-the-completed-exposure', 0);
    render(model, 1);
    expect(host.textContent).toContain('beyond six to twelve months');
    expect(host.textContent).toContain('median off-treatment interval was six months');
  });

  it('keeps the service reply out of the tray until the learner has looked', () => {
    const model = new DelayedImmuneEvent();
    model.apply('escalate-to-the-treating-service', 0);
    model.advance(SERVICE + 10);
    render(model, SERVICE + 10);
    expect(host.textContent).not.toContain('The treating service has answered');
    model.apply('reassess', SERVICE + 11);
    render(model, SERVICE + 12);
    expect(host.textContent).toContain('The treating service has answered');
    expect(host.textContent).toContain('does not exclude an immune-related cause');
  });

  it('reports the further stool without moving the observations', () => {
    const model = new DelayedImmuneEvent();
    model.advance(COURSE + 10);
    render(model, COURSE + 10);
    expect(host.textContent).toContain('An eighth stool has been counted today');
    expect(host.textContent).toContain('The observations have barely moved');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new DelayedImmuneEvent(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new DelayedImmuneEvent(), 0);
    act(() => button(labels['escalate-to-the-treating-service'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-to-the-treating-service');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new DelayedImmuneEvent();
    model.apply('record-the-completed-exposure', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-completed-exposure'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new DelayedImmuneEvent();
    model.apply('record-bounded-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['prednisolone', 'prednisone', 'infliximab', 'vedolizumab', 'loperamide']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new DelayedImmuneEvent(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
