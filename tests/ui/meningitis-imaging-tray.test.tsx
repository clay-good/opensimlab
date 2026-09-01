/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeningitisImagingTray } from '../../src/modules/infectious-disease/MeningitisImagingTray';
import { MeningitisImaging, MENINGITIS_IMAGING_CEILING_TICKS as CEILING,
  MENINGITIS_IMAGING_RESULT_TICKS as RESULT,
  type MeningitisImagingAction } from '../../src/modules/infectious-disease/meningitis-imaging';

const labels: Record<MeningitisImagingAction, string> = {
  'record-triggering-features': 'Record the features and their absences',
  'activate-time-critical-owners': 'Activate time-critical ownership',
  'record-antimicrobial-intent': 'Record bounded antimicrobial intent',
  'compare-criteria-sets': 'Compare the published criteria sets',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Arrange continuous observation',
  'check-features': 'Check neurological features only',
  'check-labs': 'Check laboratory evidence only',
  reassess: 'Reassess features and laboratory evidence',
  handoff: 'Hand off the features and what the wait cost',
  'scan-first-is-safer': 'Scan first, to be safe',
  'delay-antimicrobials-for-the-puncture': 'Hold antimicrobials until the puncture',
  'normal-crp-excludes': 'Exclude it on the normal C-reactive protein',
  'negative-gram-stain-excludes': 'Exclude it on the negative Gram stain',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: MeningitisImaging, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<MeningitisImagingTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Meningitis imaging tray', () => {
  it('withholds the criteria comparison until it is asked for', () => {
    render(new MeningitisImaging(), 0);
    expect(host.querySelectorAll('li')).toHaveLength(0);
    expect(host.textContent).toContain('before assuming the question has one answer');
  });

  it('shows all five sets, and which way each falls', () => {
    const model = new MeningitisImaging();
    model.apply('compare-criteria-sets', 0);
    render(model, 1);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(5);
    expect(items.filter((text) => text.includes('image before puncture'))).toHaveLength(3);
    expect(items.filter((text) => text.includes('no imaging indicated'))).toHaveLength(2);
    expect(host.textContent).toContain('the patient did not change between those readings');
    expect(host.textContent).toContain('7%, 32%, and 65%');
  });

  it('records the absences as deliberately as the presences', () => {
    render(new MeningitisImaging(), 0);
    expect(host.textContent).toContain('Absent: focal deficit, seizure, papilloedema');
    expect(host.textContent).toContain('the absences are recorded as deliberately as the presences');
  });

  it('never contradicts itself once intent is recorded after the ceiling', () => {
    const model = new MeningitisImaging();
    model.advance(CEILING + 10);
    model.apply('record-antimicrobial-intent', CEILING + 20);
    render(model, CEILING + 30);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    // The recorded fact wins over the sticky ceiling flag, so the banner cannot claim nothing
    // was recorded on a screen that also reports when it was.
    expect(status).toContain('after the hour had passed');
    expect(status).not.toContain('no antimicrobial intent recorded');
  });

  it('counts the ceiling down and reports it passing', () => {
    render(new MeningitisImaging(), 600);
    expect(host.querySelector('[role="status"]')!.textContent).toContain('59 simulated min remain');
    const passed = new MeningitisImaging();
    passed.advance(CEILING + 10);
    render(passed, CEILING + 10);
    expect(host.querySelector('[role="status"]')!.textContent)
      .toContain('The ceiling has passed, and that is reported rather than hidden');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new MeningitisImaging(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new MeningitisImaging(), 0);
    act(() => button(labels['compare-criteria-sets'])!.click());
    expect(onAction).toHaveBeenCalledWith('compare-criteria-sets');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new MeningitisImaging();
    model.apply('record-triggering-features', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-triggering-features'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('keeps the scan result out of the tray until it is observed', () => {
    const model = new MeningitisImaging();
    model.apply('record-antimicrobial-intent', 0);
    model.advance(RESULT + 10);
    render(model, RESULT + 10);
    expect(host.textContent).not.toContain('It changed no management');
    model.apply('reassess', RESULT + 11);
    render(model, RESULT + 12);
    expect(host.textContent).toContain('It changed no management');
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new MeningitisImaging();
    model.apply('record-antimicrobial-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['ceftriaxone', 'vancomycin', 'amoxicillin', 'dexamethasone']) {
      expect(text).not.toContain(agent);
    }
    render(new MeningitisImaging(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Meningitis imaging tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new MeningitisImaging(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('asks for the features before any rule is consulted', () => {
    render(new MeningitisImaging(), 0, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('before any rule is consulted');
  });

  it('separates the treatment from the imaging question', () => {
    const model = new MeningitisImaging();
    model.apply('record-triggering-features', 0);
    model.apply('activate-time-critical-owners', 1);
    render(model, 2, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('treatment must not wait for it');
    expect(text).not.toContain('scan first');
  });
});
