# platform/adoption Delta Specification

## ADDED Requirements

### Requirement: Institutions Receive A Static Audit And Adoption Pack

For each public release, the project SHALL be able to generate a static adoption pack containing the
exact catalog and pack versions, competency mappings, scenario maturity, sources, limitations,
corrections, accessibility conformance, privacy/data flow, security model, build provenance, named
review records, organizational endorsements, conflicts, expirations, and excluded preview content.

#### Scenario: Procurement can evaluate without a sales call

- **WHEN** an institution downloads an adoption pack
- **THEN** every claim resolves to a public repository record, no contact or account is required, and
  the pack states which functions work offline and which optional report data reaches Cloudflare

#### Scenario: The pack cannot imply complete review

- **WHEN** any scenario or dependency is preview, overdue, withdrawn, region-incompatible, or outside
  an endorsement
- **THEN** it is excluded from reviewed coverage totals and listed by ID, version, status, and reason

### Requirement: Courses Can Pin Reviewed Static Content Without Learner Accounts

An educator SHALL be able to create a shareable course link that pins a public release, domain-pack
versions, selected scenario IDs, practice region, guidance level, and reviewed-only policy. The link
SHALL contain no learner or cohort identifier and SHALL require no server state.

#### Scenario: A semester sees stable content

- **WHEN** learners open a pinned course link throughout a semester
- **THEN** they receive the exact selected compatible versions from static release assets and see any
  later correction or withdrawal notice before starting an affected scenario

#### Scenario: Reviewed-only fails visibly

- **WHEN** pinned content loses current review or is withdrawn
- **THEN** the link does not silently substitute preview content; it identifies the affected item and
  offers the educator a current compatible reviewed release when one exists

### Requirement: Organizational Sign-Off Is Public, Scoped, And Revocable

An organization MAY endorse an exact release or subset only through the organizational record
defined by clinical governance. The product SHALL render the organization, authorized scope,
learner population, region, expiration, exclusions, and revocation state wherever the endorsement is
claimed.

#### Scenario: An endorsement is verifiable

- **WHEN** an educator selects an organization-endorsed badge
- **THEN** the exact public record and signature-artifact hash are available without an account and
  match the current scenario and content versions

#### Scenario: Endorsement expires or is revoked

- **WHEN** the record reaches expiration, is revoked, or no longer covers a changed dependency
- **THEN** the badge and endorsed distribution claim disappear, historical records remain public,
  and the underlying content falls to its independently supported maturity

### Requirement: Adoption Never Creates Instructor Surveillance

Institutional use SHALL preserve learner-controlled local practice. Course links, adoption packs,
endorsements, and report infrastructure SHALL NOT expose whether a learner opened, attempted,
repeated, failed, or completed a scenario.

#### Scenario: Instructor review requires learner export

- **WHEN** an educator wants to review an attempt or aggregate a cohort
- **THEN** each learner deliberately exports a previewed file and the educator imports files locally;
  no background enrollment, beacon, completion callback, or server roster exists

#### Scenario: A report is not a performance record

- **WHEN** a learner reports a scenario problem during an institutional course
- **THEN** D1 contains no course, institution, assignment, learner, performance, or stable reporter
  field and the institution cannot query the report service

## MODIFIED Requirements

### Requirement: Assignment Links Carry Public Configuration Only

Assignment and course links SHALL encode only public release, scenario/path selection, practice
region, guidance, deterministic seed policy, optional human-readable assignment label, and reviewed-
only policy. They SHALL contain no learner, roster, transcript, progress, or report identifier.

#### Scenario: A cohort can rehearse the same case privately

- **WHEN** an educator shares one deterministic assignment link
- **THEN** learners receive the same public patient seed and content version while each attempt and
  tutor history remains only on that learner's device

#### Scenario: An assignment label cannot enter reporting silently

- **WHEN** a learner opens reporting from an assigned scenario
- **THEN** the assignment label and full assignment URL are excluded from required and optional
  context
