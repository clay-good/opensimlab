# Design: two languages for the interface, one honest marker for the rest

## 1. String classes

| Class | Examples | First wave | Review needed |
| --- | --- | --- | --- |
| Interface | controls, labels, menus, settings, error text, catalog chrome, alarms' severity words | translated | translator only |
| Educator documentation | educator pages, curriculum view, review surface | translated | translator only |
| Root prose | landing, About, privacy statement, governance text | translated | translator plus maintainer check of claims |
| Clinical content | scenario briefings, objectives, timeline prompts, explainers, intervention cards, tutor rules, debrief templates, limitations, region profiles | English, marked | clinical review record per the global-reach requirement |

The line between interface and clinical content is drawn in the catalog itself: every string key
carries a class, and the build rejects a clinical-content key in an interface catalog. "Severity
word" on an alarm is interface; the alarm limit explanation is clinical.

## 2. Catalog format and coverage

Catalogs are flat JSON keyed by stable identifiers, one file per locale, with ICU-style plural
and placeholder syntax and no sentence assembled from fragments. English is the source catalog
and the fallback. A coverage report is generated at build: keys total, keys translated, keys
stale (English changed since translation), listed per locale and published at
`/translation-status` as a trust document — figure first, list behind a disclosure — so a
contributor can see what is left. A locale appears in the language selector only at 100%
non-stale interface coverage; below that it is buildable and testable but not offered, because a
learner meeting a placeholder token is worse than a learner meeting English.

## 3. The English-content marker

Under a non-English locale, each surface that shows clinical content carries one line at its top:
"This clinical content is shown in English until a clinically reviewed translation exists in
your language." It appears once per surface — briefing, cockpit tutor region, debrief, explainer
drawer, card drawer — and never as a modal or a toast, and it links to `/translation-status`
where the clinical-content translation state is listed per module. It is not a disclaimer that
the content is wrong; it is a statement of which language the learner is reading.

## 4. Pseudo-locales

Two synthetic locales live in the test matrix and are never offered to learners:

- `en-XA` expands every string by 40% with bracket markers, so truncation and overflow surface
  in CI. Forty percent is the expansion the layout spec's "twice the English length" tray
  scenario anticipates for a drug name; for running text it is the conventional allowance.
- `en-XB` mirrors the layout (right-to-left) with the same strings, so mirroring bugs are found
  before an Arabic catalog exists. Waveform time axes and numerics stay left-to-right under it,
  which is the requirement being tested.

## 5. Discoverability

The landing and About pages are prerendered per locale at `/es/` and `/pt-BR/` with reciprocal
`hreflang` including `x-default`, as the discoverability capability requires. Scenario briefings
are not localised in this wave and therefore declare no alternates; declaring one for a page whose
content is still English would be a false alternate.

## 6. Translator path

A translator copies the English catalog, fills it, and checks it in a browser-based coverage
page that reports missing and stale keys and renders a sample of surfaces, with no build tooling.
They return the file by pull request or by email. The catalog records the translator's name as
authorship, as every content contribution does, and the locale's row on `/translation-status`
names them. Machine translation is not used to seed a catalog, because a seeded catalog is a
reviewed-looking artifact nobody reviewed.

## 7. Alternatives considered

- **Translating scenarios first, interface later.** Rejected: scenario translations need clinical
  review this project cannot yet provide even in English.
- **Offering a locale at partial coverage with English fallback.** Rejected for interface strings:
  a mixed-language cockpit under time pressure is a usability hazard. Fallback remains the
  mechanism for stale keys between releases, with the coverage report naming them.
- **Machine-translated seed catalogs with human correction.** Rejected: provenance of every string
  must be a named person.
