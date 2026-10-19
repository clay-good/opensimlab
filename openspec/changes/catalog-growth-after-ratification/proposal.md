# Decide how the catalog grows past 256

## Summary

The catalog was ratified at 256 scenarios across 16 modules, and every module is at its planned
count. The multidomain catalog capability says the release "SHALL target exactly 256." That
number did its job: it stopped breadth from outrunning depth. It now has no rule for what comes
next, and the README's "not a roadmap" line is the only statement of growth policy.

This change adds a `learning/catalog-growth` capability that makes the ratified count a floor
rather than a ceiling, defines the breadth test a proposed module must pass before it is even
listed as planned, names the module candidates that currently look strongest and the evidence
each would need, and guarantees that no count anywhere in the product is ever typed by hand. It
commits to no new module and no date.

## Why

- **"Exactly 256" has become a wrong statement rather than a safeguard.** The gate was written to
  stop placeholders from being counted. It now reads as a ceiling, and the first scenario added
  after ratification would contradict it. The honest reading — count only what passes every
  gate — should be the rule, with the ratified number recorded as history.
- **Breadth proposals arrive without a test.** The existing requirement "Catalog Breadth Follows
  Demonstrated Engine Value" names the test — three meaningful actions, two distinct choices or
  timings, observable consequences, an engine-grounded debrief — but applies it to a scenario,
  not a module. A module is a route, a shell, a formulary, a review domain, and a landing-page
  promise. It needs its own test before it earns a "planned" card.
- **Some gaps are real.** Prehospital emergency care is time-critical, monitored, and rare in
  training (pediatric prehospital cases are rare enough that providers cannot rely on experience
  to stay proficient). Office-based procedural sedation emergencies happen where no anesthetist
  is present. Acute care of older adults and psychiatric emergencies with medical physiology are
  both underrepresented in simulation labs. None of these should be promised; all of them should
  be assessable by a stated rule.
- **The landing page counts must stay true as the catalog moves.** The landing capability already
  requires per-module counts to be declared in the registry and held against the scenario arrays
  by a test. Growth makes that rule load-bearing, and it should be restated where growth is
  specified.

## What changes

- Record 256 as the ratified count and define the playable count as whatever passes every gate,
  never less than the ratified count without a corrections-log entry explaining the removal.
- Define the module breadth test: at least eight distinct scenario proposals each passing the
  scenario training-value test, a declared environment shell from the existing set or a specified
  new one, a formulary whose every agent has a source, a named review domain, and a
  negative-transfer analysis for the setting.
- Publish candidate modules as proposals with their breadth-test status, not as planned modules,
  until the test is passed: prehospital and emergency medical services, office-based procedural
  sedation, acute care of older adults, psychiatric emergencies with medical physiology.
- Require every count a reader can see to be computed from the registry and the scenario arrays,
  including module cards, the About page, the review-status page, and structured data.

## Explicit non-goals

- No new module in this change, no date, and no count target above 256.
- No weakening of the scenario completion contract, the training-value test, or the
  runtime-utility boundary. Growth is subject to all of them.
- No change to the per-module planned counts of the sixteen existing modules.

## Success measures

- The catalog gate reports the playable count without an upper bound and fails if the count
  falls below the ratified count with no corrections-log entry, verified by tests.
- A module proposal document exists for each named candidate, stating its breadth-test status,
  and no candidate appears as planned on the landing page or in any count.
- Every reader-visible count is asserted against the registry and the scenario arrays by a test.
