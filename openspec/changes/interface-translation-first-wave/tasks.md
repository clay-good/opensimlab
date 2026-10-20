# Implementation plan: interface translation, first wave

## 1. Infrastructure

- [x] Choose the catalog format (flat JSON, ICU plural and placeholder syntax); add key classes;
  write the loader with English fallback and no placeholder leakage. `src/platform/i18n/catalog.ts`:
  flat keyed messages, each English key classed interface, educator, root-prose, or clinical;
  ICU-style placeholders and plurals; a translation that is missing, stale (its English changed),
  unfillable, or clinical falls back to English, and English that cannot be filled throws.
- [ ] Externalise every interface, educator-documentation, and root-prose string; make the
  hard-coded-string test pass. Started: the site bar, on every page, reads its 26 strings from
  `src/platform/i18n/messages.ts` and renders the same English. Every other surface, and the
  hard-coded-string test, remain.
- [x] Generate the coverage report at build; publish `/translation-status` as a trust document.
  The prerendered page computes coverage from the catalogs at build: languages offered (none),
  interface strings so far, each contributed locale's translated and stale counts, the two test
  locales, and that clinical content stays English in every module.
- [ ] Add `en-XA` (40% expansion) and `en-XB` (mirrored) to the CI matrix; run layout-shift,
  truncation, 320 px reflow, and mirroring tests under both. Started: `pseudoLocale` generates
  both, marked `pseudo` so they can never ship, and a test renders through `en-XA`. The layout
  tests under each, which need an active-locale switch, remain.
- [x] Fail the build on a clinical-content key in an interface catalog. `catalogProblems` refuses
  it, along with unknown keys, changed placeholders, an anonymous catalog, and any provenance but
  human; `tests/unit/i18n-catalog.test.ts` runs it over every shipped catalog.

## 2. Locales

- [ ] Author `es` and `pt-BR` catalogs with named translators; reach 100% non-stale coverage
  before enabling the selector entry.
- [ ] Prerender `/es/` and `/pt-BR/` landing and About pages; add reciprocal `hreflang` and
  `x-default`; extend the alternates test to assert no false alternate on English content.
- [ ] Translate the privacy statement and governance text; maintainer check of every claim.

## 3. Clinical-content marker

- [ ] Add the once-per-surface English-content marker to briefing, cockpit tutor region, debrief,
  explainer drawer, card drawer; route test for presence and uniqueness.
- [ ] List clinical translation state per module on `/translation-status`.

## 4. Contribution path

- [ ] Build the browser-based coverage page (file in, missing/stale out, sample render; no
  network).
- [ ] Document the translator path; refuse machine-seeded catalogs by provenance field.

## 5. Budget

- [ ] Ship catalogs as lazy per-locale chunks; measure the interactive and precache budgets in
  Brotli under each locale and record the result.
