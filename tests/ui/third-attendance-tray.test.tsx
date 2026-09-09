/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThirdAttendanceTray } from '../../src/modules/surgery-trauma/ThirdAttendanceTray';
import { ThirdAttendance } from '../../src/modules/surgery-trauma/third-attendance';
import { THIRD_ATTENDANCE_COLLEAGUE_TICKS as COLLEAGUE, THIRD_ATTENDANCE_TEAM_TICKS as TEAM, THIRD_ATTENDANCE_ACTIONS, type ThirdAttendanceAction } from '../../src/modules/surgery-trauma/third-attendance';

const labels: Record<ThirdAttendanceAction, string> = {
  'record-the-attendances-and-what-each-found': 'Record the attendances and what each found',
  'record-what-a-previous-assessment-can-say': 'Record what a previous assessment can say',
  'record-what-has-changed-since-the-last-visit': 'Record what has changed since the last visit',
  'escalate-to-the-surgical-team': 'Ask the surgical team to see her',
  'record-bounded-assessment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-attendance-record': 'Check the attendance record only',
  reassess: 'Reassess observations and attendance record',
  handoff: 'Hand off the examination that is owed',
  'she-has-been-seen-twice-already': 'She has been seen twice already',
  'the-notes-say-it-was-settling': 'The notes say it was settling',
  'she-is-anxious-and-keeps-coming-back': 'She is anxious and keeps coming back',
  'discharge-her-with-the-same-advice-again': 'Discharge her with the same advice again',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: ThirdAttendance, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<ThirdAttendanceTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Third-attendance tray', () => {
  it('leads with the three attendances and the localised pain', () => {
    render(new ThirdAttendance(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('3 attendances in 5 days');
    expect(status).toContain('localised to one place');
    expect(status).toContain('not performed at any visit');
    expect(host.textContent).toContain('Two accurate entries. Read what each one is');
  });

  it('states that both previous entries are accurate and blames nobody', () => {
    render(new ThirdAttendance(), 0);
    expect(host.textContent).toContain('neither clinician did anything wrong');
    expect(host.textContent).toContain('very nearly what they were on both previous visits');
    const lowered = (host.textContent ?? '').toLowerCase();
    for (const term of ['should have', 'got it wrong', 'missed it']) expect(lowered).not.toContain(term);
  });

  it('offers every declared choice exactly once', () => {
    render(new ThirdAttendance(), 0);
    for (const action of THIRD_ATTENDANCE_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(THIRD_ATTENDANCE_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new ThirdAttendance(), 0);
    act(() => { button(labels['record-the-attendances-and-what-each-found'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-attendances-and-what-each-found');
  });

  it('retires a recording control once it has been used', () => {
    const model = new ThirdAttendance();
    model.apply('record-the-attendances-and-what-each-found', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-attendances-and-what-each-found'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new ThirdAttendance(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the colleague and the team reply once each has happened', () => {
    const before = new ThirdAttendance();
    render(before, 0);
    expect(host.textContent).not.toContain('has passed the door');
    const after = new ThirdAttendance();
    after.apply('escalate-to-the-surgical-team', 0);
    after.advance(COLLEAGUE + 1);
    after.advance(COLLEAGUE + TEAM + 1);
    after.apply('reassess', COLLEAGUE + TEAM + 2);
    render(after, COLLEAGUE + TEAM + 2);
    expect(host.textContent).toContain('has passed the door');
    expect(host.textContent).toContain('Nothing about the patient has changed');
    expect(host.textContent).toContain('rather than as conclusions about today');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new ThirdAttendance();
    model.apply('she-has-been-seen-twice-already', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, score, or operation anywhere, in any state', () => {
    const forbidden = ['morphine', 'paracetamol', 'alvarado', 'appendicectomy', 'mg/kg'];
    for (const action of THIRD_ATTENDANCE_ACTIONS) {
      const model = new ThirdAttendance();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
