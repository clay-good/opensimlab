/**
 * @vitest-environment jsdom
 *
 * The demonstration as the viewer meets it.
 *
 * The script itself is covered against the engine in tests/unit/demonstration.
 * What is covered here is the part that only exists in the interface: that the
 * strip is saying something from the first frame, that a beat's action is
 * performed once rather than once per render, and that "take the controls"
 * genuinely stops the script.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import { useDemonstration } from '@anesthesia/demo/useDemonstration';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { DEMONSTRATION_SECONDS } from '@anesthesia/demo/demonstration';

interface HarnessProps {
  readonly second: number;
  readonly active: boolean;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly onFinished: () => void;
  readonly onTakeControls: () => void;
}

function Harness(props: HarnessProps) {
  const demonstration = useDemonstration({
    active: props.active,
    tick: Math.round(props.second * TICKS_PER_SECOND),
    act: props.act,
    onFinished: props.onFinished,
  });
  return createElement(DemonstrationBar, {
    beat: demonstration.beat,
    progress: demonstration.progress,
    onTakeControls: props.onTakeControls,
  });
}

describe('the demonstration strip', () => {
  let container: HTMLDivElement;
  let root: Root;
  let performed: Omit<LearnerAction, 'tick'>[];
  let finished: number;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    performed = [];
    finished = 0;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const show = (second: number, active = true, onTakeControls = () => {}) => {
    act(() => {
      root.render(createElement(Harness, {
        second,
        active,
        act: (action) => { performed.push(action); },
        onFinished: () => { finished += 1; },
        onTakeControls,
      }));
    });
    return container.querySelector('.demo-bar');
  };

  const text = () => container.querySelector('.demo-bar__text')?.textContent ?? '';

  it('is saying something on the very first frame', () => {
    const bar = show(0);
    expect(bar).not.toBeNull();
    expect(text().length).toBeGreaterThan(40);
  });

  it('shows nothing at all when no demonstration is running', () => {
    expect(show(120, false)).toBeNull();
  });

  it('moves on to the next beat as the clock advances', () => {
    show(0);
    const opening = text();
    show(200);
    expect(text()).not.toBe(opening);
    expect(text()).toContain('mg/kg');
  });

  it('performs each action once, not once per render', () => {
    // The bug this exists to catch gives the patient the induction dose on
    // every render rather than once, which in a five-times-speed session is
    // dozens of boluses.
    show(0);
    show(20);
    show(20);
    show(20);
    const oxygen = performed.filter(
      (action) => action.type === 'ventilator'
        && (action.payload as { fio2?: number }).fio2 === 1,
    );
    expect(oxygen).toHaveLength(1);
  });

  it('catches up rather than skipping when the clock jumps', () => {
    show(0);
    show(320);
    const types = performed.map((action) => action.type);
    expect(types).toContain('bolus');
    expect(types).toContain('laryngoscopy');
    expect(performed.filter((a) => a.type === 'bolus')).toHaveLength(2);
  });

  it('starts the script over when the session is reset', () => {
    show(0);
    show(20);
    expect(performed).toHaveLength(1);
    show(0);
    show(20);
    expect(performed).toHaveLength(2);
  });

  it('reports progress as a percentage a screen reader can read', () => {
    show(DEMONSTRATION_SECONDS / 2);
    const meter = container.querySelector('[role="progressbar"]');
    expect(meter?.getAttribute('aria-valuenow')).toBe('50');
    expect(meter?.getAttribute('aria-valuemax')).toBe('100');
  });

  it('never reports more than complete, however long the session runs on', () => {
    show(DEMONSTRATION_SECONDS * 4);
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('hands the controls back when the script runs out', () => {
    show(0);
    expect(finished).toBe(0);
    show(DEMONSTRATION_SECONDS + 1);
    expect(finished).toBe(1);
  });

  it('offers a way out at every single beat', () => {
    const taken: number[] = [];
    for (let second = 0; second <= DEMONSTRATION_SECONDS; second += 10) {
      show(second, true, () => taken.push(second));
      const button = [...container.querySelectorAll('button')]
        .find((element) => element.textContent === 'Take the controls');
      expect(button, `no exit at ${second}s`).toBeDefined();
      act(() => { button!.click(); });
    }
    expect(taken.length).toBeGreaterThan(30);
  });

  it('narrates politely, so it does not talk over a screen reader', () => {
    show(0);
    expect(container.querySelector('.demo-bar__text')?.getAttribute('aria-live')).toBe('polite');
  });

  it('says which region to look at, for someone who cannot see the ring', () => {
    show(0);
    expect(container.querySelector('.visually-hidden')?.textContent).toContain('monitor');
  });

  it('keeps long keyboard-readable narration separate from both worked-example controls', () => {
    const narration = `${'Read the current observation before continuing. '.repeat(12)}The final sentence remains available.`;
    const advance = vi.fn(); const take = vi.fn();
    act(() => root.render(createElement(DemonstrationBar, {
      beat: { atSecond: 0, narration, focus: 'actions' }, progress: 0.1,
      awaitingAdvance: true, onAdvance: advance, onTakeControls: take,
    })));
    const reader = container.querySelector<HTMLElement>('.demo-bar__narration')!;
    const controls = container.querySelector('.demo-bar__controls')!;
    expect(reader.getAttribute('role')).toBe('region');
    expect(reader.getAttribute('aria-label')).toBe('Worked example narration');
    expect(reader.tabIndex).toBe(0);
    expect(reader.querySelector('.demo-bar__label')?.textContent).toBe('Paused to read');
    expect(reader.querySelector('.demo-bar__text')?.textContent).toContain(narration);
    expect(reader.querySelector('.demo-bar__text')?.getAttribute('aria-live')).toBe('polite');
    expect(reader.parentElement).toBe(controls.parentElement);
    expect(reader.contains(controls)).toBe(false); expect(reader.querySelector('button')).toBeNull();
    const buttons = [...controls.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['Continue example', 'Take the controls']);
    expect(buttons.every((button) => !button.disabled)).toBe(true);
    act(() => { buttons[0]!.click(); buttons[1]!.click(); });
    expect(advance).toHaveBeenCalledOnce(); expect(take).toHaveBeenCalledOnce();

    show(0);
    expect([...container.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['Take the controls']);
  });

  it('resets only changed narration to its beginning without remounting or losing keyboard focus', () => {
    const render = (narration: string, progress: number) => act(() => root.render(createElement(DemonstrationBar, {
      beat: { atSecond: 0, narration, focus: 'actions' }, progress,
      awaitingAdvance: true, onAdvance: () => {}, onTakeControls: () => {},
    })));
    render('Read this long first decision. '.repeat(20), 0.1);
    const reader = container.querySelector<HTMLElement>('.demo-bar__narration')!;
    const next = container.querySelector<HTMLButtonElement>('.demo-bar__controls button')!;
    reader.focus(); reader.scrollTop = 160;
    render('Read this long first decision. '.repeat(20), 0.2);
    expect(reader.scrollTop).toBe(160); expect(document.activeElement).toBe(reader);

    render('The next decision starts here. '.repeat(20), 0.3);
    expect(container.querySelector('.demo-bar__narration')).toBe(reader);
    expect(reader.scrollTop).toBe(0); expect(document.activeElement).toBe(reader);
    next.focus(); reader.scrollTop = 90;
    render('A third decision has different evidence.', 0.4);
    expect(container.querySelector('.demo-bar__controls button')).toBe(next);
    expect(reader.scrollTop).toBe(0); expect(document.activeElement).toBe(next);
  });
});
