/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidentalClotTray } from '../../src/modules/oncology/IncidentalClotTray';
import { IncidentalClot } from '../../src/modules/oncology/incidental-clot';
import { INCIDENTAL_CLOT_QUESTION_TICKS as QUESTION, INCIDENTAL_CLOT_SERVICE_TICKS as SERVICE, type IncidentalClotAction } from '../../src/modules/oncology/incidental-clot';

const labels: Record<IncidentalClotAction, string> = {
  'record-the-finding-and-how-it-was-found': 'Record the finding and how it was found',
  'record-the-certainty-of-the-recommendation': 'Record the strength and the certainty',
  'record-the-benefit-and-the-harm-together': 'Record the benefit and the harm together',
  'record-this-patients-bleeding-risk': 'Record his own bleeding risk',
  'escalate-to-the-treating-service': 'Ask the treating service for a decision',
  'record-the-decision-as-shared': 'Record it as a decision made with him',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-report': 'Check the report only',
  reassess: 'Reassess observations and the report',
  handoff: 'Hand off the finding and the open decision',
  'incidental-so-no-action-needed': 'Incidental, so no action needed',
  'a-pe-is-a-pe-so-anticoagulate-now': 'A PE is a PE, so anticoagulate now',
  'wait-for-symptoms-before-deciding': 'Wait for symptoms before deciding',
  'leave-it-for-the-clinic-letter': 'Leave it for the clinic letter',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: IncidentalClot, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<IncidentalClotTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Incidental-clot tray', () => {
  it('states the strength and the certainty, first', () => {
    render(new IncidentalClot(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('conditional');
    expect(status).toContain('very low certainty');
    expect(host.textContent).toContain('Incidental describes how it was found');
  });

  it('names the bleeding history before any decision is framed', () => {
    render(new IncidentalClot(), 0);
    expect(host.textContent).toContain('bled intermittently from the primary tumour for two months');
  });

  it('withholds the paired figures until they are recorded together', () => {
    render(new IncidentalClot(), 0);
    expect(host.textContent).not.toContain('89 fewer deaths');
    const model = new IncidentalClot();
    model.apply('record-the-benefit-and-the-harm-together', 0);
    render(model, 1);
    expect(host.textContent).toContain('89 fewer deaths');
    expect(host.textContent).toContain('128 more major bleeds');
  });

  it('keeps the service reply out of the tray until the learner has looked', () => {
    const model = new IncidentalClot();
    model.apply('escalate-to-the-treating-service', 0);
    model.advance(SERVICE + 10);
    render(model, SERVICE + 10);
    expect(host.textContent).not.toContain('The treating service has answered');
    model.apply('reassess', SERVICE + 11);
    render(model, SERVICE + 12);
    expect(host.textContent).toContain('The treating service has answered');
  });

  it('shows the patient’s own question once he has asked it', () => {
    const model = new IncidentalClot();
    model.advance(QUESTION + 10);
    render(model, QUESTION + 10);
    expect(host.textContent).toContain('the bleeding frightened him more than anything else has');
    expect(host.textContent).toContain('He is not refusing anything');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new IncidentalClot(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new IncidentalClot(), 0);
    act(() => button(labels['escalate-to-the-treating-service'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-to-the-treating-service');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new IncidentalClot();
    model.apply('record-the-finding-and-how-it-was-found', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-finding-and-how-it-was-found'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no anticoagulant and disables everything during a worked example', () => {
    const model = new IncidentalClot();
    model.apply('record-the-benefit-and-the-harm-together', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['enoxaparin', 'apixaban', 'rivaroxaban', 'warfarin', 'heparin']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new IncidentalClot(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
