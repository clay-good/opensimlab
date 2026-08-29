/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuietPatientTray } from '../../src/modules/medical-surgical-nursing/QuietPatientTray';
import { QuietPatient, QUIET_PATIENT_HANDOVER_TICKS as HANDOVER,
  QUIET_PATIENT_REVIEW_TICKS as REVIEW,
  type QuietPatientAction } from '../../src/modules/medical-surgical-nursing/quiet-patient';

const labels: Record<QuietPatientAction, string> = {
  'review-the-charted-impression': 'Review the charted impressions',
  'screen-for-arousal': 'Perform the screen now',
  'record-the-screen-result': 'Record the screening result',
  'escalate-on-the-positive-screen': 'Escalate on the screening result',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Schedule repeat screening',
  'check-chart': 'Review the chart only',
  'check-patient': 'Observe the patient only',
  reassess: 'Reassess the chart and the patient',
  handoff: 'Hand off the screen and the gap',
  'let-them-sleep-and-screen-later': 'Let him sleep, screen later',
  'quiet-is-settled': 'He is quiet, so he is settled',
  'negative-earlier-screen-excludes': 'He screened negative before',
  'call-it-low-mood': 'This is low mood after surgery',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: QuietPatient, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<QuietPatientTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Delirium screening tray', () => {
  it('leads with the count of screening results, which is zero', () => {
    render(new QuietPatient(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Screening results in the record: 0');
    expect(status).toContain('The record holds no negative screen; it holds no screen');
  });

  it('shows all three impressions verbatim', () => {
    render(new QuietPatient(), 0);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(3);
    expect(items[0]).toContain('Resting comfortably. No concerns.');
    expect(items[2]).toContain('Quiet. Declined breakfast.');
  });

  it('withholds the distinction until the impressions are reviewed', () => {
    render(new QuietPatient(), 0);
    expect(host.textContent).not.toContain('none is a screening result');
    const model = new QuietPatient();
    model.apply('review-the-charted-impression', 0);
    render(model, 1);
    expect(host.textContent).toContain('none is a screening result');
  });

  it('moves the count only when the result is recorded, not when screened', () => {
    const model = new QuietPatient();
    model.apply('screen-for-arousal', 0);
    render(model, 1);
    expect(host.querySelector('[role="status"]')!.textContent).toContain('Screening results in the record: 0');
    expect(host.querySelector('[role="status"]')!.textContent).toContain('is positive');
    model.apply('record-the-screen-result', 2);
    render(model, 3);
    expect(host.querySelector('[role="status"]')!.textContent).toContain('Screening results in the record: 1');
  });

  it('shows the repeated handover only while nothing is screened', () => {
    const model = new QuietPatient();
    model.advance(HANDOVER + 10);
    render(model, HANDOVER + 10);
    expect(host.textContent).toContain('about to read exactly like the first three');
    const screened = new QuietPatient();
    screened.apply('screen-for-arousal', 0);
    screened.advance(HANDOVER + 10);
    render(screened, HANDOVER + 10);
    expect(host.textContent).not.toContain('about to read exactly like the first three');
  });

  it('keeps the review out of the tray until the learner looks', () => {
    const model = new QuietPatient();
    model.apply('screen-for-arousal', 0);
    model.apply('escalate-on-the-positive-screen', 1);
    model.advance(REVIEW + 20);
    render(model, REVIEW + 20);
    expect(host.textContent).not.toContain('There was nothing to disagree with');
    model.apply('reassess', REVIEW + 21);
    render(model, REVIEW + 22);
    expect(host.textContent).toContain('no screening result of any kind');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new QuietPatient(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new QuietPatient(), 0);
    act(() => button(labels['screen-for-arousal'])!.click());
    expect(onAction).toHaveBeenCalledWith('screen-for-arousal');
  });

  it('names no antipsychotic and disables everything during a worked example', () => {
    const model = new QuietPatient();
    model.apply('review-boundaries', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['haloperidol', 'olanzapine', 'lorazepam']) expect(text).not.toContain(term);
    render(new QuietPatient(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
