/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LastKnownWellTray } from '../../src/modules/medical-surgical-nursing/LastKnownWellTray';
import { LastKnownWell, LAST_KNOWN_WELL_RECOLLECTION_TICKS as PRESSED,
  LAST_KNOWN_WELL_ASSESSMENT_TICKS as ASSESSMENT,
  type LastKnownWellAction } from '../../src/modules/medical-surgical-nursing/last-known-well';

const labels: Record<LastKnownWellAction, string> = {
  'record-last-known-well': 'Record last known well as a bound',
  'record-the-uncertain-recollection': 'Record the recollection as uncertain',
  'record-what-the-unknown-changes': 'State what the unknown changes',
  'activate-the-stroke-pathway': 'Activate the stroke pathway',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Arrange timed neurological observation',
  'check-the-timeline': 'Check the timeline only',
  'check-patient': 'Observe the patient only',
  reassess: 'Reassess the timeline and the patient',
  handoff: 'Hand off the bound and the empty field',
  'chart-the-recollection-as-onset': 'Chart onset as 03:00',
  'chart-last-known-well-as-onset': 'Chart onset as 22:40',
  'unknown-onset-means-nothing-offered': 'Unknown onset, so nothing to offer',
  'wait-for-the-family-to-confirm': 'Wait for the family to confirm',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: LastKnownWell, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<LastKnownWellTray assessment={model.snapshot(tick)} scenarioVersion="0.1.1"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Unwitnessed-onset tray', () => {
  it('shows the onset field as empty rather than hiding it', () => {
    render(new LastKnownWell(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Onset time: not known.');
    expect(status).toContain('an unwitnessed interval 7.5 hours wide');
  });

  it('marks the uncertain timeline entry as uncertain and the others not', () => {
    render(new LastKnownWell(), 0);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(3);
    expect(items.filter((text) => text.includes('(uncertain)'))).toHaveLength(1);
    expect(items.find((text) => text.includes('(uncertain)'))).toContain('about 03:00');
  });

  it('withholds the boundary prose until the boundaries are reviewed', () => {
    render(new LastKnownWell(), 0);
    expect(host.textContent).toContain('Review what an unknown onset does and does not license.');
    expect(host.textContent).not.toContain('surrogate for lesion age');
    const model = new LastKnownWell();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('surrogate for lesion age');
    expect(host.textContent).toContain('not the ward’s to make');
  });

  it('reports the pressed recollection once it has happened', () => {
    render(new LastKnownWell(), 0);
    expect(host.textContent).not.toContain('moved it by an hour');
    const model = new LastKnownWell();
    model.advance(PRESSED + 10);
    render(model, PRESSED + 10);
    expect(host.textContent).toContain('moved it by an hour and said she would not swear to it');
  });

  it('keeps the stroke team assessment out of the tray until the learner looks', () => {
    const model = new LastKnownWell();
    model.apply('activate-the-stroke-pathway', 0);
    model.advance(ASSESSMENT + 20);
    render(model, ASSESSMENT + 20);
    expect(host.textContent).not.toContain('The stroke team has assessed');
    model.apply('reassess', ASSESSMENT + 21);
    render(model, ASSESSMENT + 22);
    expect(host.textContent).toContain('The stroke team has assessed');
  });

  it('says a refused choice does not block a later appropriate handoff', () => {
    const model = new LastKnownWell();
    model.apply('chart-the-recollection-as-onset', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new LastKnownWell(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new LastKnownWell(), 0);
    act(() => button(labels['record-last-known-well'])!.click());
    expect(onAction).toHaveBeenCalledWith('record-last-known-well');
  });

  it('names no drug and disables everything during a worked example', () => {
    const model = new LastKnownWell();
    model.apply('review-boundaries', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['alteplase', 'tenecteplase', 'thrombectomy']) expect(text).not.toContain(term);
    render(new LastKnownWell(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Last-known-well tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new LastKnownWell(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('asks for the bound to be labelled as a bound', () => {
    render(new LastKnownWell(), 0, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('as a bound');
    expect(text).toContain('a claim nobody can support');
  });

  it('never asks for the recollection to be firmed up', () => {
    const model = new LastKnownWell();
    model.apply('record-last-known-well', 0);
    render(model, 1, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('in her own words');
    expect(text).not.toContain('pin the time down');
  });
});
