# Implementation plan: interface translation, first wave

## 1. Infrastructure

- [x] Choose the catalog format (flat JSON, ICU plural and placeholder syntax); add key classes;
  write the loader with English fallback and no placeholder leakage. `src/platform/i18n/catalog.ts`:
  flat keyed messages, each English key classed interface, educator, root-prose, or clinical;
  ICU-style placeholders and plurals; a translation that is missing, stale (its English changed),
  unfillable, or clinical falls back to English, and English that cannot be filled throws.
- [ ] Externalise every interface, educator-documentation, and root-prose string; make the
  hard-coded-string test pass. `tests/unit/externalised-strings.test.ts` is that test, applied to
  each surface once it moves; every surface it does not list remains. Each surface below reads from
  `src/platform/i18n/messages.ts` and renders the same English (count, then what stays data):
  - Shared chrome: the site bar (26), the trust documents' chrome (8), the not-found page (19, one
    list the static 404 and the client view both render, after the two had drifted), the update
    notice (5), the first-visit acknowledgement (7; the not-for-clinical-use statement stays one
    constant because every export carries it), the educator pages' navigation (one list, not three
    copies).
  - Trust documents, root prose: `/translation-status` (12), `/verification-queue` (16),
    `/corrections` (16; policy, triage, entries stay typed data), `/review-status` (16), the
    limitations register (7), `/privacy` (29, plus its practice-history controls, 16),
    `/governance` (28; board, coverage, framework records stay typed data), `/validation` (43;
    figures, rows, sources stay generated), and a planned module's page (12).
  - Cockpit: the shell (44: the skip link, rehearsal-branch notice, mobile buttons, overflow
    menu, sound toggle, shortcuts heading, stopped-engine and hidden-tab dialogs, drug-card headings,
    review markers, confidence badges, and resize handles; its screen-reader announcements of
    clinical state stay engine wording), the keyboard shortcut reference (14; the two that state a
    dose, epinephrine and the arrest shock, are the catalog's first clinical keys and stay English
    in every locale, and emergency medicine's Review tab is its own message rather than an edit of
    the English), the status bar (18), the session menu's note, classroom, vibration, and narration
    controls (22), the rapid-cycle and classroom pause panels (11), the private tutor's card and
    the worked-example bar (21; narration stays authored), the analysis region and patient profile
    with the monitor's morphology heading (36; ASA categories and waveform descriptions stay
    clinical), the concentration and Why panels (30; model notes, citations, attribution terms, and
    the CSV header stay data), the return suggestion (10), the goal-path recommendation (3), the
    crisis injector's controls (6; crisis names, boundaries, and its two model limits stay data).
  - Briefing and debrief: the briefing's section headings and facilitator link (7), its controls,
    practice region, limitations links, guidance levels, and start and watch controls (17; each
    module's authored orientation stays with its scenarios, and the anaesthesia orientation, which
    placed the monitor on the right and the controls along the bottom, now names them instead,
    because the cockpit reflows), the debrief's
    shared shell (45; scenario framing and episode labels stay clinical), its reasoning-notes panel
    and rapid-cycle offer (9), the nursing NCJMM list (7, educator).
  - Educator pages: the facilitator guide (71, with its prebrief and debrief templates),
    `/for-educators` (59, markup byte-identical), `/curriculum` (16), `/review` (14, outcome words
    shared with the debrief), `/content-review` (34, markup byte-identical; item titles stay the
    content they name).
  - Front door, root prose: the landing page and `/about`'s own words (18), and their copy in
    `src/landing/content.ts` (66: the tagline, three facts, seven sections, nine questions, the
    reviewer invitation, footer labels), which keeps its exports and reads the catalog through
    getters. The landing markup is byte-identical; `/about` differs in one number, where its
    catalogue paragraph had said 240 titles by hand while 256 shipped and now reads the registry.
    The suggested citation stays fixed text, held against `CITATION.cff`.
  - The catalog is split by surface. With every surface in one module, the front door downloaded
    every surface's words and its route reached 150.5 KB against a 150 KB budget. The core
    (`messages.ts`: site bar, document chrome, not-found, acknowledgement, update notice, front
    door) stays on every page; `messages-documents`, `messages-educator`, and `messages-session`
    register themselves when a surface imports them, and `all-messages.ts` assembles the whole
    catalog for coverage, the pseudo-locales, and the tests. The landing route is 137.5 KB.
    `tests/unit/i18n-groups.test.ts` fails any file that uses a group's key without importing that
    group, because `t` throws on an unregistered key and would do it on the route that forgot.
  - Out of scope by design: `/gallery` and `/frame-budget` are noindex development surfaces whose
    text is component names, sample data, and a device measurement, not interface a learner or
    educator reads.
  - Prerendered pages: each module's index and each scenario's static briefing (10; sixteen
    hand-typed headings that were each a module's name and "simulator" are now one message;
    text identical to the previous build).
  - The action cockpit's generic controls: every Cancel (17, one message), the teaching-model badge
    (9), and the tray, pump-settings, free-dose, and out-of-region labels. What remains in
    `ActionCockpit.tsx` names clinical interventions, parameters, and model limits ("Start 20%
    lipid", "Tidal volume", "Never shock asystole or PEA") and stays English as clinical content.
  - Every module's trays, audited for generic controls among their clinical labels: the
    worked-example notice (129 copies), the loading line (62), the think-time heading (62), Confirm
    choice (4), and the source prefixes (14) are six messages used 271 times across 130 files.
    The rest is each lab's clinical step and boundary wording and stays English.
  - Still to move: the cockpit's screen-reader announcements, which describe clinical state and
    need the same split before any of them moves.
- [x] Generate the coverage report at build; publish `/translation-status` as a trust document.
  Its sentence claiming the test locales ran on every build was untrue and is corrected: they are
  applied by hand in development until CI runs them. The prerendered page computes coverage from the catalogs at build: languages offered (none),
  interface strings so far, each contributed locale's translated and stale counts, the two test
  locales, and that clinical content stays English in every module.
- [x] Add `en-XA` (40% expansion) and `en-XB` (mirrored) to the CI matrix; run layout-shift,
  truncation, 320 px reflow, and mirroring tests under both. `npm run layout:pseudo`
  (`scripts/check-pseudo-layout.ts`) starts the development server, where `?pseudo=` applies a
  test locale, and with Playwright 1.63.0 (pinned, about six weeks old) loads thirteen pages using
  externalised strings at 320 px under each locale: every trust document, the three educator pages,
  the clinical review index, and a facilitator guide. It fails on sideways scroll, a site-bar or
  footer element past the edge, a raw `{placeholder}`, a missing direction, or a locale that did
  not apply. It runs in `npm run ci` and as its own step in the GitHub workflow, which installs
  Chromium. Its first run found that the en-XA padding was one unbroken run of dots that could
  not wrap and scrolled three pages sideways; real translations wrap, so the padding now comes
  in short space-separated groups, and all five pages were clean. Widening it to twelve found
  `/for-educators` scrolling sideways at 320 px in English too, on an inline code path with no break
  points; code in reading prose now wraps. Layout shift is not measured yet, and the cockpit and
  debrief, which need a running session, are not in the page list.
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
