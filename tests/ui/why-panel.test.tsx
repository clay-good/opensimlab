/**
 * @vitest-environment jsdom
 *
 * The Why panel's reading list.
 *
 * The panel names the term that moved a number whatever happens, but the
 * explainer behind it is the point of opening the panel. The terms added most
 * recently — hypoxic tachycardia, hypoxic myocardial failure, the volatile's
 * effect on the circulation — had no entry, so the learner most in need of the
 * safe-apnoea explainer was the one who would not be offered it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TERM_EXPLAINER_IDS, WhyPanel } from '@anesthesia/ui/WhyPanel';
import { EXPLAINERS } from '@anesthesia/content/explainers';

it.each(['etco2MmHg', 'fio2', 'meanArterialMmHg'] as const)('keeps authored %s explanations separate from generic physiology attribution', (field) => {
  const explanation = 'These are authored teaching states, not predicted physiology or treatment kinetics.';
  const markup = renderToStaticMarkup(<WhyPanel open field={field}
    value={field === 'meanArterialMmHg' ? 71 : null} authoredExplanation={explanation}
    attribution={[{ variable: field, terms: [{ termId: 'propofol-vasodilation', label: 'Unrelated drug effect', contribution: -10, share: 1, teachingModel: true }] }]}
    onClose={() => {}} onOpenExplainer={() => {}} onOpenDrugCard={() => {}} />);
  const container = document.createElement('div'); container.innerHTML = markup;
  expect(container.querySelector('.numeric')?.textContent?.trim()).toMatch(field === 'meanArterialMmHg' ? /^71/ : /^--/);
  expect(container.textContent).toContain(explanation);
  expect(container.textContent).not.toContain('Unrelated drug effect');
  expect(container.textContent).not.toContain('Ranked contributors');
  expect(container.textContent).not.toContain('baseline puts it');
});

/**
 * Every attribution term id the physiology can emit, read from the source.
 *
 * Read rather than listed, so a term added to the engine appears here without
 * anyone remembering to add it — which is exactly what did not happen last time.
 */
function emittedTerms(): string[] {
  const dir = join(process.cwd(), 'src/modules/anesthesia/physiology');
  const found = new Set<string>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue;
    const source = readFileSync(join(dir, name), 'utf8');
    // Driver tuples: ['term-id', 'Label', value, teaching]
    for (const match of source.matchAll(/\[\s*'([a-z0-9-]+)',\s*'[^']+',/g)) found.add(match[1]!);
    // Direct recorder calls: recorder.add(variable, 'term-id', ...)
    for (const match of source.matchAll(/recorder\.add\([^,]+,\s*'([a-z0-9-]+)'/g)) found.add(match[1]!);
  }
  return [...found].sort();
}

describe('every term the engine can emit has something to read', () => {
  const terms = emittedTerms();

  it('finds the terms at all, so this file is not passing on an empty list', () => {
    expect(terms.length).toBeGreaterThan(10);
    expect(terms).toContain('propofol-vasodilation');
    expect(terms).toContain('hypoxic-myocardial-failure');
  });

  it.each(emittedTerms().map((term) => [term] as const))('%s', (term) => {
    const explainerId = TERM_EXPLAINER_IDS[term];
    expect(explainerId, `${term} has no explainer; add one to TERM_EXPLAINERS`).toBeDefined();
    expect(EXPLAINERS.some((explainer) => explainer.id === explainerId),
      `${term} points at explainer "${explainerId}", which does not exist`).toBe(true);
  });

  it('points at no explainer that does not exist', () => {
    // The other direction: a mapping left behind after an explainer is renamed
    // would silently stop offering the reading.
    const ids = new Set(EXPLAINERS.map((explainer) => explainer.id));
    for (const [term, explainerId] of Object.entries(TERM_EXPLAINER_IDS)) {
      expect(ids, `${term} points at a missing explainer`).toContain(explainerId);
    }
  });

  it('sends every hypoxic term to the safe-apnoea explainer', () => {
    // They all raise the same question: how much time was there, and what was
    // spent of it.
    for (const term of terms.filter((candidate) => candidate.startsWith('hypoxic-'))) {
      expect(TERM_EXPLAINER_IDS[term]).toBe('preoxygenation-and-safe-apnea-time');
    }
  });
});
