/**
 * interface-translation-first-wave → clinical content shown in English says so
 * once per surface. The marker renders only under a translated interface locale,
 * once at the top of each clinical surface, never on an interface-only one, and
 * the status page lists the clinical translation state per module.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ClinicalContentMarker } from '@platform/i18n/ClinicalContentMarker';
import { setActiveCatalog } from '@platform/i18n/messages';
import { TranslationStatusBody } from '@platform/i18n/TranslationStatusBody';
import type { LocaleCatalog } from '@platform/i18n/catalog';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { TutorPromptCard } from '@anesthesia/ui/TutorRegion';
import type { Prompt } from '@anesthesia/tutor/guidance';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { LIMITATIONS } from '@platform/docs/limitations';
import { MODULES } from '@platform/modules/registry';

const SPANISH: LocaleCatalog = { locale: 'es', translators: ['A. Translator'], provenance: 'human', messages: {} };
const markers = (markup: string) => (markup.match(/class="clinical-marker"/g) ?? []).length;

afterEach(() => setActiveCatalog(undefined));

describe('the English-content marker component', () => {
  it('renders nothing under English, the source', () => {
    setActiveCatalog(undefined);
    expect(renderToStaticMarkup(createElement(ClinicalContentMarker))).toBe('');
  });

  it('renders one line linking to the status page under a translated locale', () => {
    setActiveCatalog(SPANISH);
    const markup = renderToStaticMarkup(createElement(ClinicalContentMarker));
    expect(markers(markup)).toBe(1);
    expect(markup).toContain('href="/translation-status"');
    // The notice falls back to English text while the locale has not translated it.
    expect(markup).toContain('shown in English');
  });
});

const PROMPT: Prompt = {
  id: 'preoxygenate-orient',
  suggestion: 'Build oxygen reserve before the airway is taken away.',
  because: 'The oxygen control and the patient state show whether reserve is building.',
  concept: 'preoxygenation-and-safe-apnea-time',
  assistanceLevel: 'orient',
  sourceId: 'preoxygenation-and-safe-apnea-time',
  maturity: 'draft',
  ruleVersion: '0.1.0',
};

const prebrief = () => createElement(Prebrief, {
  limitations: LIMITATIONS, scenario: ROUTINE_INDUCTION, region: UNITED_STATES,
  onStart: () => {}, guidance: 'coached' as const, onGuidance: () => {},
});
const tutorCard = () => createElement(TutorPromptCard, {
  prompt: PROMPT, collapsed: false, whyOpen: false,
  onToggleCollapsed: () => {}, onToggleWhy: () => {}, onDismiss: () => {}, onOpenSource: () => {},
});

describe('the marker on clinical surfaces', () => {
  it('appears exactly once on the briefing and the tutor region under a translated locale', () => {
    setActiveCatalog(SPANISH);
    expect(markers(renderToStaticMarkup(prebrief()))).toBe(1);
    expect(markers(renderToStaticMarkup(tutorCard()))).toBe(1);
  });

  it('does not appear on those surfaces under English', () => {
    setActiveCatalog(undefined);
    expect(markers(renderToStaticMarkup(prebrief()))).toBe(0);
    expect(markers(renderToStaticMarkup(tutorCard()))).toBe(0);
  });

  it('is hidden with the clinical prose when the tutor card is collapsed', () => {
    setActiveCatalog(SPANISH);
    const collapsed = createElement(TutorPromptCard, {
      prompt: PROMPT, collapsed: true, whyOpen: false,
      onToggleCollapsed: () => {}, onToggleWhy: () => {}, onDismiss: () => {}, onOpenSource: () => {},
    });
    expect(markers(renderToStaticMarkup(collapsed))).toBe(0);
  });
});

/**
 * The debrief and the two cockpit drawers need a full session to render, so
 * their placement is pinned at the source: each carries the marker exactly
 * where the spec names it, and the interface-only crisis-injector drawer does
 * not. The component test above proves what the marker then does.
 */
describe('the marker is placed on every named surface and nowhere else', () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
  const uses = (source: string) => (source.match(/<ClinicalContentMarker \/>/g) ?? []).length;

  it('is in the briefing, the tutor region, and the debrief once each', () => {
    expect(uses(read('src/modules/anesthesia/ui/Prebrief.tsx'))).toBe(1);
    expect(uses(read('src/modules/anesthesia/ui/TutorRegion.tsx'))).toBe(1);
    expect(uses(read('src/modules/anesthesia/ui/Debrief.tsx'))).toBe(1);
  });

  it('is in the explainer drawer and the drug-card drawer, but not the crisis injector', () => {
    const cockpit = read('src/modules/anesthesia/ui/Cockpit.tsx');
    expect(uses(cockpit)).toBe(2);
    // The crisis injector is an interface control, not clinical teaching content.
    const open = cockpit.indexOf('open={crisisInjectorOpen');
    const injector = cockpit.slice(open, cockpit.indexOf('</Drawer>', open));
    expect(open).toBeGreaterThan(0);
    expect(uses(injector)).toBe(0);
  });
});

describe('the status page', () => {
  it('carries no marker — it is an interface surface, not clinical content', () => {
    setActiveCatalog(SPANISH);
    expect(markers(renderToStaticMarkup(createElement(TranslationStatusBody)))).toBe(0);
  });

  it('lists the clinical translation state of every available module', () => {
    setActiveCatalog(undefined);
    const markup = renderToStaticMarkup(createElement(TranslationStatusBody));
    const available = MODULES.filter((module) => module.status === 'available');
    expect(available.length).toBeGreaterThan(0);
    for (const module of available) expect(markup).toContain(module.displayName);
    expect(markup).toContain('no clinically reviewed translation in any language yet');
    // No module claims a translation that does not exist.
    expect(markup).not.toMatch(/translated into/i);
  });
});
