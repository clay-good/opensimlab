/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AfferentLimbTray } from '../../src/modules/medical-surgical-nursing/AfferentLimbTray';
import { AfferentLimb, AFFERENT_LIMB_PRESSURE_TICKS as PRESSURE,
  AFFERENT_LIMB_ARRIVAL_TICKS as ARRIVAL,
  type AfferentLimbAction } from '../../src/modules/medical-surgical-nursing/afferent-limb';

const labels: Record<AfferentLimbAction, string> = {
  'record-the-met-criteria': 'Record the met criteria',
  'record-the-obstacles': 'Record the obstacles plainly',
  'call-the-response-team': 'Call the response team',
  'state-the-concern-explicitly': 'State the concern to a person',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Increase observation',
  'check-criteria': 'Check the criteria only',
  'check-availability': 'Check who is available',
  reassess: 'Reassess criteria and availability',
  handoff: 'Hand off the call and its basis',
  'call-the-doctor-first': 'Call the covering doctor first',
  'wait-for-the-ward-round': 'Wait for the ward round',
  'document-and-wait': 'Document the concern and wait',
  'ask-permission-to-call': 'Ask the charge nurse for permission',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: AfferentLimb, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<AfferentLimbTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Escalation threshold tray', () => {
  it('states the threshold first and says the call has not been made', () => {
    render(new AfferentLimb(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('3 of 5 activation criteria met');
    expect(status).toContain('requires 1');
    expect(status).toContain('The call has not been made');
  });

  it('lists every criterion with its own verdict', () => {
    render(new AfferentLimb(), 0);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(5);
    expect(items.filter((text) => text.startsWith('Met'))).toHaveLength(3);
    expect(items.filter((text) => text.startsWith('Not met'))).toHaveLength(2);
  });

  it('names the obstacles as non-clinical once recorded', () => {
    render(new AfferentLimb(), 0);
    expect(host.textContent).not.toContain('None of these is a clinical finding');
    const model = new AfferentLimb();
    model.apply('record-the-obstacles', 0);
    render(model, 1);
    expect(host.textContent).toContain('None of these is a clinical finding');
    expect(host.textContent).toContain('unwritten, they simply win');
  });

  it('shows the repeated pressure only while no call has been made', () => {
    const model = new AfferentLimb();
    model.advance(PRESSURE + 10);
    render(model, PRESSURE + 10);
    expect(host.textContent).toContain('has said it again');
    const called = new AfferentLimb();
    called.apply('call-the-response-team', 0);
    called.advance(PRESSURE + 10);
    render(called, PRESSURE + 10);
    expect(host.textContent).not.toContain('has said it again');
  });

  it('keeps the arrival out of the tray until the learner looks', () => {
    const model = new AfferentLimb();
    model.apply('call-the-response-team', 0);
    model.advance(ARRIVAL + 10);
    render(model, ARRIVAL + 10);
    expect(host.textContent).not.toContain('has taken over');
    model.apply('reassess', ARRIVAL + 11);
    render(model, ARRIVAL + 12);
    expect(host.textContent).toContain('has taken over');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new AfferentLimb(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new AfferentLimb(), 0);
    act(() => button(labels['call-the-response-team'])!.click());
    expect(onAction).toHaveBeenCalledWith('call-the-response-team');
  });

  it('leaves the call available after permission was refused', () => {
    const model = new AfferentLimb();
    model.apply('ask-permission-to-call', 0);
    render(model, 1);
    expect(button(labels['call-the-response-team'])!.getAttribute('aria-disabled')).toBe('false');
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('names no treatment and disables everything during a worked example', () => {
    const model = new AfferentLimb();
    model.apply('call-the-response-team', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['noradrenaline', 'antibiotic', 'litres per minute']) expect(text).not.toContain(term);
    render(new AfferentLimb(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
