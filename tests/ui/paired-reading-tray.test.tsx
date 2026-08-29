/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PairedReadingTray } from '../../src/modules/medical-surgical-nursing/PairedReadingTray';
import { PairedReading, PAIRED_READING_GAS_TICKS as GAS,
  PAIRED_READING_REVIEW_TICKS as REVIEW,
  type PairedReadingAction } from '../../src/modules/medical-surgical-nursing/paired-reading';

const labels: Record<PairedReadingAction, string> = {
  'record-the-oximeter-reading': 'Record the oximeter reading',
  'record-the-paired-values': 'Record both values together',
  'record-what-the-gap-is-not': 'State what the gap is and is not',
  'escalate-on-the-arterial-value': 'Escalate on the arterial value',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Arrange oximeter-independent observation',
  'check-oximeter': 'Check the device only',
  'check-patient': 'Observe the patient only',
  reassess: 'Reassess the device and the patient',
  handoff: 'Hand off both numbers',
  'reposition-the-probe': 'Reposition the probe',
  'warm-the-hand': 'Warm the hand',
  'trust-the-oximeter-trend': 'The numbers are steady, so she is stable',
  'the-device-standard-was-fixed': 'The 2025 standard fixed this',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: PairedReading, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<PairedReadingTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Paired oximetry reading tray', () => {
  it('shows the reading and says the sample has not returned', () => {
    render(new PairedReading(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Oximeter: 94% on air');
    expect(status).toContain('has not returned');
  });

  it('shows both numbers together once the sample returns', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    render(model, GAS + 10);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('94%');
    expect(status).toContain('Arterial saturation from the same minute: 86%');
  });

  it('withholds the mechanism until the gap is characterised', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    render(model, GAS + 10);
    expect(host.textContent).not.toContain('skin pigmentation changes that absorbance');
    expect(host.textContent).toContain('None of them explains a reading that is too high');
    model.apply('record-the-paired-values', GAS + 11);
    model.apply('record-what-the-gap-is-not', GAS + 12);
    render(model, GAS + 13);
    expect(host.textContent).toContain('skin pigmentation changes that absorbance');
    expect(host.textContent).toContain('moderate certainty');
  });

  it('keeps the arterial result out of the tray until the learner looks', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    render(model, GAS + 10);
    expect(host.textContent).not.toContain('Both numbers are from the same minute and the same patient');
    model.apply('reassess', GAS + 11);
    render(model, GAS + 12);
    expect(host.textContent).toContain('Both numbers are from the same minute and the same patient');
  });

  it('says the device is not at fault once the review is observed', () => {
    const model = new PairedReading();
    model.advance(GAS + 10);
    model.apply('escalate-on-the-arterial-value', GAS + 11);
    model.advance(GAS + REVIEW + 20);
    model.apply('reassess', GAS + REVIEW + 21);
    render(model, GAS + REVIEW + 22);
    expect(host.textContent).toContain('correctly by its own calibration');
    expect(host.textContent).toContain('no fault is found');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new PairedReading(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new PairedReading(), 0);
    act(() => button(labels['record-the-oximeter-reading'])!.click());
    expect(onAction).toHaveBeenCalledWith('record-the-oximeter-reading');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new PairedReading();
    model.apply('record-the-oximeter-reading', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-oximeter-reading'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no oxygen setting and disables everything during a worked example', () => {
    const model = new PairedReading();
    model.apply('review-boundaries', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['litres per minute', 'venturi', 'nasal cannula']) expect(text).not.toContain(term);
    render(new PairedReading(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
