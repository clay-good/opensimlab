# Implementation plan: interface translation, first wave

## 1. Infrastructure

- [x] Choose the catalog format (flat JSON, ICU plural and placeholder syntax); add key classes;
  write the loader with English fallback and no placeholder leakage. `src/platform/i18n/catalog.ts`:
  flat keyed messages, each English key classed interface, educator, root-prose, or clinical;
  ICU-style placeholders and plurals; a translation that is missing, stale (its English changed),
  unfillable, or clinical falls back to English, and English that cannot be filled throws.
- [ ] Externalise every interface, educator-documentation, and root-prose string; make the
  hard-coded-string test pass. Started: the site bar (26 strings), the trust documents' shared
  chrome (8 strings), and the cockpit's rapid-cycle and classroom pause panels (11 strings), and
  the session menu's note, classroom, vibration and narration controls (22 strings), each now its
  own component, the return suggestion (10, its reason one plural message rather than fragments),
  the nursing debrief's NCJMM list (7, classed educator), and the facilitator guide (71 strings,
  educator: page, headings, item labels, absent reasons, and its fixed prebrief and debrief
  templates), `/translation-status` (12 strings, root prose), `/verification-queue` (16, root prose), each now its
  own component, the goal-path recommendation (3), the update notice (5), and the first-visit
  acknowledgement (7, root prose; the not-for-clinical-use statement itself stays one constant
  because every export carries it), and the debrief's reasoning-notes panel and rapid-cycle offer
  (9), the shared briefing's section headings and facilitator link (7), and the not-found page (19,
  now one list that the static 404 and the client view both render, after the two had drifted), and
  the practice-history controls on `/privacy` (16, plurals as messages), and the `/corrections` page's
  own words (16, root prose; its policy, triage, and entries stay typed data), `/review-status`
  (16, root prose), the limitations register's own words (7), and the privacy statement's prose
  (29) read from `src/platform/i18n/messages.ts` and render the same English.
  `tests/unit/externalised-strings.test.ts` is the hard-coded-string test, applied to each surface
  once it is externalised; every other surface remains.
- [x] Generate the coverage report at build; publish `/translation-status` as a trust document.
  Its sentence claiming the test locales ran on every build was untrue and is corrected: they are
  applied by hand in development until CI runs them. The prerendered page computes coverage from the catalogs at build: languages offered (none),
  interface strings so far, each contributed locale's translated and stale counts, the two test
  locales, and that clinical content stays English in every module.
- [x] Add `en-XA` (40% expansion) and `en-XB` (mirrored) to the CI matrix; run layout-shift,
  truncation, 320 px reflow, and mirroring tests under both. `npm run layout:pseudo`
  (`scripts/check-pseudo-layout.ts`) starts the development server, where `?pseudo=` applies a
  test locale, and with Playwright 1.63.0 (pinned, about six weeks old) loads five pages using
  externalised strings at 320 px under each locale. It fails on sideways scroll, a site-bar or
  footer element past the edge, a raw `{placeholder}`, a missing direction, or a locale that did
  not apply. It runs in `npm run ci` and as its own step in the GitHub workflow, which installs
  Chromium. Its first run found that the en-XA padding was one unbroken run of dots that could
  not wrap and scrolled three pages sideways; real translations wrap, so the padding now comes
  in short space-separated groups, and all five pages are clean. Layout shift is not measured
  yet; a surface joins the page list when it is externalised.
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
