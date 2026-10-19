# platform/global-reach Delta Specification

## MODIFIED Requirements

### Requirement: Full Interface Translation

All learner-facing strings SHALL be externalized into per-locale translation catalogs keyed by
stable identifiers, each key classed as interface, educator documentation, root prose, or clinical
content, with no concatenated sentence fragments. The application SHALL select a locale from the
browser preference with a manual override that persists. A locale SHALL be offered to learners
only when its interface, educator-documentation, and root-prose coverage is 100% with no stale
keys, and the first wave SHALL ship Spanish (`es`) and Brazilian Portuguese (`pt-BR`). A build
SHALL publish a per-locale coverage report at `/translation-status`.

#### Scenario: A new language requires no code change

- **WHEN** a translator supplies a complete catalog for a new locale
- **THEN** the application renders fully in that locale after adding only the catalog file, and a test asserts that no user-facing string is hard-coded in source

#### Scenario: Partial translation degrades gracefully

- **WHEN** a catalog is missing a key
- **THEN** the English string is shown, the missing key is reported by the translation-coverage report, and no placeholder token is ever displayed to a learner

#### Scenario: An incomplete locale is not offered

- **WHEN** a locale's interface coverage is below 100% or any key is stale
- **THEN** it is absent from the language selector, buildable and testable in CI, and listed on `/translation-status` with its missing and stale keys behind a disclosure

#### Scenario: Right-to-left layout is correct

- **WHEN** a right-to-left locale such as Arabic is selected
- **THEN** the layout mirrors, numerics and waveform time axes retain their conventional left-to-right direction, and the monitor remains clinically conventional

#### Scenario: Layout breaks are found without a translator

- **WHEN** the CI matrix runs the pseudo-locale that expands every string by 40% and the pseudo-right-to-left locale
- **THEN** the no-layout-shift, tray-truncation, 320-pixel reflow, and mirroring tests pass under both, and neither pseudo-locale is offered to learners

#### Scenario: Translated clinical content is reviewed

- **WHEN** a translation covers scenario or protocol text
- **THEN** it carries its own clinical review record, because a mistranslated protocol step is a clinical error, not a copy error

#### Scenario: A clinical-content key cannot hide in an interface catalog

- **WHEN** a catalog entry classed as clinical content is supplied through the interface catalog
- **THEN** the build fails naming the key and its class, so the review requirement for clinical translation cannot be bypassed by misclassification

## ADDED Requirements

### Requirement: Clinical Content Shown In English Says So Once Per Surface

Under a non-English locale, every surface that displays clinical content not yet translated and
reviewed SHALL show, once at the top of that surface and never as a modal or toast, a one-line
statement that the clinical content is shown in English until a clinically reviewed translation
exists in the learner's language, linking to `/translation-status`.

#### Scenario: The marker is present and not in the way

- **WHEN** a learner using the Spanish interface opens a scenario briefing
- **THEN** the briefing's first line states that its clinical content is shown in English until reviewed in Spanish, the briefing is otherwise unchanged, and no overlay or interruption appears

#### Scenario: The marker appears exactly once per surface

- **WHEN** the route set is rendered under a non-English locale
- **THEN** each clinical-content surface carries the marker once, no interface-only surface carries it, verified by a test over every route

#### Scenario: The status page lists clinical translation per module

- **WHEN** `/translation-status` renders
- **THEN** it opens with the count of modules whose clinical content is reviewed in each offered locale — zero shown as zero — followed by the per-module list behind a disclosure

### Requirement: Translators Contribute Without Build Tooling

The repository SHALL provide a browser-based coverage check that accepts a catalog file, reports
missing and stale keys, and renders a sample of interface surfaces in that locale, so a translator
needs no development environment. Every catalog SHALL record its translators by name, and no
catalog SHALL be seeded by machine translation.

#### Scenario: A translator checks their work in a browser

- **WHEN** a translator loads a catalog file into the coverage page
- **THEN** it lists every missing and stale key and renders the catalog, cockpit, and debrief chrome in that locale, with no network request and no build step

#### Scenario: Authorship is named

- **WHEN** a locale is offered
- **THEN** its catalog names its translators, and `/translation-status` shows them beside the locale

#### Scenario: Machine seeding is refused

- **WHEN** a catalog is contributed with a provenance field declaring machine translation as its source
- **THEN** it is not merged, and the contribution guide states that every string must be authored by a named person

### Requirement: Localised Root Pages Declare Their Alternates

The landing page and the About page SHALL be prerendered in every offered locale under a
locale-prefixed path, with reciprocal `hreflang` alternates including `x-default`, and no page
whose content remains English SHALL declare a non-English alternate.

#### Scenario: A Spanish search finds the Spanish front door

- **WHEN** `/es/` and `/pt-BR/` are fetched
- **THEN** each is static HTML in that language with its own title and description within the discoverability limits, and each declares reciprocal alternates to `/`, the other locale, and `x-default`

#### Scenario: No false alternate

- **WHEN** a scenario briefing, whose clinical content is English, is fetched
- **THEN** it declares no non-English alternate, verified by the alternates check
