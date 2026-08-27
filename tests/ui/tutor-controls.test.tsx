/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalPreference } from '@platform/ui';
import {
  TUTOR_INTRODUCTION_PREFERENCE, TutorIntroduction, TutorPromptCard,
} from '@anesthesia/ui/TutorRegion';
import type { Prompt } from '@anesthesia/tutor/guidance';

const PROMPT: Prompt = {
  id: 'preoxygenate-orient',
  suggestion: 'First goal: build oxygen reserve before the airway is taken away.',
  because: 'The visible oxygen control and patient state show whether reserve is building.',
  concept: 'preoxygenation-and-safe-apnea-time',
  assistanceLevel: 'orient',
  sourceId: 'preoxygenation-and-safe-apnea-time',
  maturity: 'draft',
  ruleVersion: '0.1.0',
};

describe('Requirement: Tutor controls stay optional and reachable', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        get length() { return values.size; },
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      } satisfies Storage,
    });
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('offers an authoritative source link for a scenario-specific prompt without an explainer', () => {
    act(() => root.render(createElement(TutorPromptCard, {
      prompt: { ...PROMPT, concept: undefined, sourceHref: 'https://doi.org/10.2337/dc26-s006' },
      collapsed: false, whyOpen: true, onToggleCollapsed: vi.fn(), onToggleWhy: vi.fn(),
      onDismiss: vi.fn(), onOpenSource: vi.fn(),
    })));
    const source = container.querySelector('a')!;
    expect(source.textContent).toBe('Full source');
    expect(source.href).toBe('https://doi.org/10.2337/dc26-s006');
    expect(source.rel).toBe('noreferrer');
    expect(source.target).toBe('_blank');
  });

  it('permanently dismisses the introduction through one clearly named control', () => {
    function IntroductionHarness() {
      const [dismissed, setDismissed] = useLocalPreference(TUTOR_INTRODUCTION_PREFERENCE, false);
      return dismissed
        ? createElement('p', null, 'Introduction dismissed')
        : createElement(TutorIntroduction, { onDismissPermanently: () => setDismissed(true) });
    }
    act(() => root.render(createElement(IntroductionHarness)));
    const button = [...container.querySelectorAll('button')]
      .find((candidate) => candidate.textContent === "Don't show this again")!;
    act(() => button.click());
    expect(localStorage.getItem(`opensimlab.${TUTOR_INTRODUCTION_PREFERENCE}`)).toBe('true');
    expect(container.textContent).toBe('Introduction dismissed');

    act(() => root.unmount());
    root = createRoot(container);
    act(() => root.render(createElement(IntroductionHarness)));
    expect(container.textContent).toBe('Introduction dismissed');
  });

  it('collapses to one keyboard-operable expansion control without losing context', () => {
    const expand = vi.fn();
    act(() => root.render(createElement(TutorPromptCard, {
      prompt: PROMPT,
      collapsed: true,
      whyOpen: false,
      onToggleCollapsed: expand,
      onToggleWhy: vi.fn(),
      onDismiss: vi.fn(),
      onOpenSource: vi.fn(),
    })));
    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('Private tutor · Orient');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).not.toContain(PROMPT.suggestion);
    act(() => button.click());
    expect(expand).toHaveBeenCalledOnce();
  });

  it('keeps all 3 explanation depths and exposes expansion state', () => {
    const toggleWhy = vi.fn();
    const openSource = vi.fn();
    act(() => root.render(createElement(TutorPromptCard, {
      prompt: PROMPT,
      collapsed: false,
      whyOpen: false,
      onToggleCollapsed: vi.fn(),
      onToggleWhy: toggleWhy,
      onDismiss: vi.fn(),
      onOpenSource: openSource,
    })));
    expect(container.textContent).toContain(PROMPT.suggestion);
    expect(container.textContent).not.toContain(PROMPT.because);
    const why = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Why this now?')!;
    expect(why.getAttribute('aria-expanded')).toBe('false');
    act(() => why.click());
    expect(toggleWhy).toHaveBeenCalledOnce();
    const source = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Full source')!;
    act(() => source.click());
    expect(openSource).toHaveBeenCalledOnce();
  });
});
