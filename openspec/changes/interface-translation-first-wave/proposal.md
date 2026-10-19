# Ship the interface in Spanish and Portuguese, honestly

## Summary

The global-reach capability requires every learner-facing string to live in a translation
catalog and a new language to need no code change. Nine source files mention a locale; there is
no catalog, no coverage report, and no second language. The product is usable only in English.

This change implements the translation infrastructure the capability already specifies and ships
a first wave of two interface locales, Spanish and Brazilian Portuguese, while keeping clinical
content — scenarios, explainers, tutor rules, debrief text — in English with an explicit
"shown in English" marker until a clinically reviewed translation exists. It defines what counts
as interface text versus clinical content, the coverage threshold a locale must reach before it
is offered, a pseudo-locale and a pseudo-right-to-left locale that CI exercises so layout breaks
cannot wait for a real translator, and a contribution path a translator can use without build
tooling.

## Why

- **The audience is not English-speaking by default.** Brazil has between 259 and 348 medical
  schools depending on the count, and Mexico about 147; Latin America and Lusophone Africa
  together hold a large share of the world's medical students, in regions where a free,
  offline, phone-first simulator addresses exactly the resource gap the product exists for.
  Spanish and Portuguese cover more of them than any other pair.
- **The clinical content cannot be translated by the same mechanism, and the spec says so.** A
  mistranslated protocol step is a clinical error, not a copy error, so a translated scenario
  needs its own review record. That review network does not exist for English yet. Translating
  the interface now and the content later is the only honest sequencing, provided the learner is
  told at every point which language they are reading and why.
- **Layout bugs do not need a translator to find.** Right-to-left mirroring, string expansion,
  and tray truncation are testable with pseudo-locales today. Waiting for a real catalog to
  discover that the syringe tray breaks at twice the English length is waiting for a bug report.
- **Discoverability follows.** The discoverability capability already requires reciprocal
  `hreflang` alternates where translations exist; a translated landing and About page is what
  makes a Spanish-language search find the product.

## What changes

- Define the string classes: interface, educator documentation, landing and About prose, and
  clinical content; only the first three are in the first wave.
- Externalise every interface string into a locale catalog with no concatenated fragments and
  a coverage report that CI publishes; a locale is offered to learners only at 100% interface
  coverage.
- Ship Spanish (`es`) and Brazilian Portuguese (`pt-BR`) interface locales, the landing and
  About pages in both, and `hreflang` alternates.
- Mark every clinical-content surface shown in English under a non-English locale with a
  one-line "shown in English until clinically reviewed in your language" notice, once per
  surface, never as a modal.
- Add a pseudo-locale (expanded, bracketed strings) and a pseudo-RTL locale to the test matrix.
- Document a translator path that needs no build tooling: a catalog file, a browser-based
  coverage check, and a pull request or an emailed file.

## Explicit non-goals

- No machine translation at build or run time. A catalog is written by a person and named.
- No translated clinical content in this wave. Scenario text, explainers, tutor rules, debrief
  templates, drug cards, and region profiles stay English and labelled until reviewed.
- No change to units, region, or formulary from language. Language and practice region remain
  independent settings, as the capability already requires.
- No locale beyond the two named, though the infrastructure must make the third a catalog file.

## Success measures

- Zero hard-coded learner-facing interface strings in source, verified by the existing
  test the capability names and a new catalog-coverage report.
- `es` and `pt-BR` at 100% interface coverage before they are offered; landing and About pages
  prerendered in both with reciprocal `hreflang` and `x-default`.
- The pseudo-locale and pseudo-RTL runs pass the layout, truncation, and reflow tests in CI.
- Every clinical-content surface under a non-English locale shows the English-content notice
  exactly once, verified over the route set.
