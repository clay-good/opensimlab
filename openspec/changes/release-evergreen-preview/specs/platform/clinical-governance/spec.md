# platform/clinical-governance Delta Specification

## ADDED Requirements

### Requirement: Promotion From Draft To Preview Is Earned By Evidence, Not Asserted

An item SHALL advance from `draft` to `preview` only when its kind's preview evidence contract
passes for its exact content version. The promotion SHALL be recorded with the content version and
the evidence that satisfied it. Bulk status changes not backed by per-item evidence SHALL be
rejected.

#### Scenario: An unfinished item stays draft

- **WHEN** a scenario, explainer, drug card, region profile, or debrief template fails any gate in
  its kind's evidence contract
- **THEN** it remains `draft`, stays out of the public build, and the gate names the failing gate

#### Scenario: A status flip without evidence is refused

- **WHEN** a change sets an item's status to `preview` without a passing exact-version evidence
  record
- **THEN** the release gate fails and names the item and the missing evidence

### Requirement: The Review-Status Surface Is Permanent And Itemized

The product SHALL publish a permanent, publicly reachable review-status surface stating, for the
running release, the exact count and full item list for each of `draft`, `preview`,
`source_checked`, `clinically_reviewed`, `institution_endorsed`, and `withdrawn`, together with the
current state of the editorial board. It SHALL NOT report an aggregate without the underlying list,
and the front page SHALL link to it.

#### Scenario: A reader can establish what is signed in one place

- **WHEN** a student, educator, or program director opens the review-status surface
- **THEN** they see that zero items are clinically reviewed, that the editorial board is empty, the
  named list of every preview item, and the date of the running release

#### Scenario: Growth cannot obscure review coverage

- **WHEN** the catalog reports its scenario count anywhere in the interface or documentation
- **THEN** the reviewed and unreviewed counts are reported with it, so a larger catalog cannot read
  as a more validated one

### Requirement: Public Reporting Is The Standing Detection Path At Release Scale

With the corpus public and unsigned, the project SHALL operate report intake as a standing
obligation: acknowledge a usable report within 5 working days, verify against an authoritative
source before changing any content, and append every confirmed correction permanently to
`CORRECTIONS.md`.

#### Scenario: A report is detection, not review

- **WHEN** any number of reports allege an error in an item
- **THEN** the item's maturity status does not change on report volume alone, and it changes only
  after reproduction and source verification; duplicate count affects priority only

#### Scenario: An unsafe teaching point is withdrawn ahead of schedule

- **WHEN** source verification confirms that published content could teach an unsafe practice
- **THEN** the item is marked `withdrawn` in the next release regardless of the release schedule,
  and the corrections log records what was wrong, its educational impact, and the timeline

#### Scenario: Intake failure is visible rather than silent

- **WHEN** report intake is disabled, unconfigured, or over quota
- **THEN** the interface states that reporting is currently unavailable and offers the repository
  issue path, because a public unreviewed corpus with no working correction path is not the
  arrangement this release is premised on

### Requirement: The Empty Board Is Published As Empty

While no clinician has signed content, `GOVERNANCE.md`, the governance dashboard, and the
review-status surface SHALL state that fact plainly and SHALL NOT describe any item as reviewed,
validated, verified, or endorsed. Recruiting named reviewers SHALL remain an open, publicly-listed
task after publication.

#### Scenario: Publication does not imply validation

- **WHEN** a visitor reads any page describing the catalog
- **THEN** no wording implies clinical validation, and the unsigned state is stated rather than
  inferable only from an absent badge

#### Scenario: The reviewer gap stays on the record

- **WHEN** the project is public and the board is still empty
- **THEN** the uncovered review domains are named individually on the governance surface, and the
  recruitment task remains listed as outstanding rather than closed by the release
