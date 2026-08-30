# platform/delivery Delta Specification

## ADDED Requirements

### Requirement: Every Content Kind Has A Defined Preview Evidence Contract

Preview publication SHALL derive its eight named gates — `build-integrity`, `sources`,
`safety-scope`, `completion-contract`, `tests`, `limitations`, `validation-report`, and
`face-validity-procedure` — from a kind-specific evidence rule for every reviewable content kind,
including `scenario`, `explainer`, `drug-card`, `region-profile`, and `debrief-template`. No kind
SHALL be evaluated against an empty evidence set as a stand-in for an unwritten contract.

#### Scenario: A drug card earns publication on its own evidence

- **WHEN** a drug card carries a citation and applicability envelope for every parameter, a unit
  test asserting at least one published reference value, its stated limitations, and no dose
  recommendation addressed to a real patient
- **THEN** the preview gate reports it publishable, and it ships labeled "Preview — not clinically
  reviewed"

#### Scenario: An unwritten contract fails closed rather than passing empty

- **WHEN** a reviewable item's kind has no evidence rule defined
- **THEN** the release gate blocks that item and names the missing kind rule as the reason, rather
  than reporting eight missing gates for an item whose contract was never specified

#### Scenario: Non-scenario evidence is checked, not asserted

- **WHEN** an explainer declares a clinical assertion with no source locator, or a region profile
  declares a technique with no regulatory or practice source
- **THEN** the `sources` gate fails for that item, it remains unpublished, and the gate names the
  specific assertion or entry

### Requirement: The Public Channel Is Preview And Is Deployed Continuously

The public deployment SHALL target the `preview` channel. A release SHALL be identified by its
build date and commit. The product SHALL NOT carry `alpha`, `beta`, `rc`, or any other staged
maturity label in its package version, its interface, its metadata, or its documentation.

#### Scenario: Deploying does not require a signature

- **WHEN** every preview gate passes and no content item is clinically reviewed
- **THEN** `npm run deploy` publishes the release, and no item appears in a reviewed or endorsed
  count, filter, badge, or pack

#### Scenario: A staged label cannot re-enter

- **WHEN** a build produces a package version, page, manifest, or document containing `alpha`,
  `beta`, or `rc` as a product maturity label
- **THEN** the release gate fails and names the file and value

#### Scenario: The reviewed channel is unaffected

- **WHEN** the reviewed channel is built while the editorial board is empty
- **THEN** it refuses exactly as before, naming every unsigned item and every uncovered domain

### Requirement: Public Release Requires The Honesty Surfaces To Be Present

A public release SHALL refuse to publish unless the not-for-clinical-use acknowledgement, the
persistent simulator marker, per-item maturity labeling, the limitations register, the corrections
log, the review-status surface, and a configured report intake are all present and reachable.

#### Scenario: Removing a disclosure blocks the release

- **WHEN** the acknowledgement gate, the per-item maturity label, the limitations register, the
  review-status route, or the corrections log is absent or unreachable
- **THEN** the preview release is refused and names the missing surface, because publishing
  unreviewed content is conditional on disclosing that it is unreviewed

#### Scenario: Report intake is required for the hosted site only

- **WHEN** a self-hoster builds the same release without report configuration
- **THEN** the build succeeds, and the report control truthfully states that reporting is
  unavailable on that host rather than silently sending upstream
