/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeningococcalSepsisTray } from '../../src/modules/infectious-disease/MeningococcalSepsisTray';
import { MeningococcalSepsis, MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS as RESPONSE,
  type MeningococcalSepsisAction } from '../../src/modules/infectious-disease/meningococcal-sepsis';

const labels: Record<MeningococcalSepsisAction, string> = {
  'recognize-rash': 'Reconcile the rash and the whole patient',
  'call-senior': 'Call the senior clinical decision maker',
  'request-bloods': 'Request cultures, lactate, clotting, and PCR',
  'record-antimicrobial-intent': 'Record bounded antimicrobial intent',
  'record-fluid-intent': 'Record bounded fluid and critical-care intent',
  'escalate-consultant': 'Alert a consultant to attend in person',
  'review-boundaries': 'Review timing, markers, and the fluid ceiling',
  monitor: 'Arrange continuous observations and conscious level',
  'check-labs': 'Check laboratory evidence only',
  'check-perfusion': 'Check perfusion and conscious level only',
  reassess: 'Reassess bedside findings and laboratory response',
  handoff: 'Hand off unresolved shock and continuing care',
  'normal-markers-exclude': 'Declare sepsis excluded by the markers',
  'vaccination-excludes': 'Declare meningococcal disease excluded by vaccination',
  'delay-transfer-for-antibiotics': 'Hold transfer to give antimicrobials first',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: MeningococcalSepsis, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<MeningococcalSepsisTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Meningococcal sepsis tray', () => {
  it('shows the starting evidence without naming a drug or a dose', () => {
    render(new MeningococcalSepsis(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('non-blanching petechiae');
    expect(text).toContain('lactate 4.1 mmol/L');
    expect(text).toContain('MenACWY vaccinated, which does not cover serogroup B');
    expect(text).toContain('Recorded intent is neither a prescription nor proof');
    for (const agent of ['ceftriaxone', 'benzylpenicillin', 'cefotaxime', 'noradrenaline']) {
      expect(text.toLowerCase()).not.toContain(agent);
    }
    // Laboratory units such as "48 mg/L" are evidence; a dose or a weight-based volume is not.
    expect(text).not.toMatch(/\d+\s*(mg|mcg|g|mL)\s*(\/\s*kg|IV|IM|\b(?!\/))/);
    expect(text).toContain('No agent, dose, route, bolus volume, or vasoactive choice is selected here');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new MeningococcalSepsis(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const model = new MeningococcalSepsis();
    const onAction = render(model, 0);
    act(() => button(labels['recognize-rash'])!.click());
    expect(onAction).toHaveBeenCalledWith('recognize-rash');
  });

  it('marks a completed one-shot choice as unavailable without removing it', () => {
    const model = new MeningococcalSepsis();
    model.apply('recognize-rash', 0);
    const onAction = render(model, 1);
    const control = button(labels['recognize-rash'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the missing escalation once the authored one-hour review is inadequate', () => {
    const model = new MeningococcalSepsis();
    model.apply('record-antimicrobial-intent', 0);
    model.apply('record-fluid-intent', 1);
    model.advance(RESPONSE + 5);
    model.apply('reassess', RESPONSE + 6);
    render(model, RESPONSE + 7);
    expect(host.textContent).toContain('Telephone ownership has already happened; attendance in person has not.');
    expect(host.textContent).toContain('not by itself treatment failure');
  });

  it('disables every control while a worked example is playing', () => {
    render(new MeningococcalSepsis(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('reports an honest ending that is not recovery', () => {
    const model = new MeningococcalSepsis();
    for (const action of ['recognize-rash', 'call-senior', 'request-bloods', 'record-antimicrobial-intent',
      'record-fluid-intent', 'review-boundaries', 'monitor', 'reassess', 'handoff'] as const) {
      model.apply(action, 0);
    }
    render(model, 1);
    expect(host.textContent).toContain('This is not recovery or discharge readiness.');
  });
});

describe('Meningococcal sepsis tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new MeningococcalSepsis(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('names the pattern without naming a diagnosis', () => {
    render(new MeningococcalSepsis(), 0, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('Record the pattern you can see');
    expect(text).toContain('Recognition is not a diagnosis');
  });

  it('selects no agent, dose, or route when asking for intent', () => {
    const model = new MeningococcalSepsis();
    model.apply('recognize-rash', 0);
    model.apply('call-senior', 1);
    model.apply('request-bloods', 2);
    render(model, 3, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('Record bounded antimicrobial intent');
    expect(text).toContain('No agent, dose, route, dilution, or infusion is chosen here');
  });
});
