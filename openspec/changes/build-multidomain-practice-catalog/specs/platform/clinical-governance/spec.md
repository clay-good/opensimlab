# platform/clinical-governance Delta Specification

## MODIFIED Requirements

### Requirement: Clinical Content Has Exact, Visible Maturity

Every scenario, capability, protocol, drug card, tutor rule, explanation, debrief rule, alarm
threshold, and normal-range value SHALL carry one of `draft`, `preview`, `source_checked`,
`clinically_reviewed`, `institution_endorsed`, or `withdrawn`. The public interface SHALL display
the status and resolve it to the exact content-version evidence.

#### Scenario: Complete unsigned content can be learned from honestly

- **WHEN** a content item passes technical, evidence-presence, source, limitation, safety-scope, and
  scenario-completion gates but lacks named clinical review
- **THEN** it may ship as `preview`, is visibly labeled “Preview — not clinically reviewed,” and is
  excluded from reviewed-only claims and adoption packs

#### Scenario: Preview is not a hidden disclaimer

- **WHEN** a learner sees a preview catalog card, briefing, live tutor directive, debrief, or source
  drawer
- **THEN** the preview status is communicated by text and icon at that surface and no reviewed or
  endorsed styling or wording appears

#### Scenario: Draft and withdrawn content are not playable

- **WHEN** an item is `draft` or `withdrawn`
- **THEN** it is excluded from public playable packs; a withdrawn item retains a public reason,
  affected versions, correction or supersession reference, and safe replacement when one exists

### Requirement: Review And Endorsement Bind Exact Versions And Scope

`source_checked`, `clinically_reviewed`, and `institution_endorsed` SHALL require machine-readable
records bound to the exact content version. Clinical, tutor, objective, limitation, or numeric
changes SHALL invalidate prior coverage unless a machine-checkable nonclinical-diff policy applies.

#### Scenario: Source checking is not clinical review

- **WHEN** an independent person verifies transcription and source locators
- **THEN** the item may become `source_checked` but is not called clinically reviewed and carries no
  reviewer acceptance of simulated behavior

#### Scenario: Named reviewers accept bounded claims

- **WHEN** an item becomes `clinically_reviewed`
- **THEN** its record names qualified reviewers, credentials, institutions, domains, conflicts,
  review method, sources, limitations accepted, version, region, signed date, and review-by date

#### Scenario: An organization signs only what it evaluated

- **WHEN** an item is displayed as institution endorsed
- **THEN** a public record names the organization, authorized signer and role, authority statement,
  exact scenarios/modules and versions, learner population, region, exclusions, method, conflicts,
  signature-artifact hash, signed date, expiration within 24 months, and revocation state
- **AND** wording says “endorsed by [organization] for [scope]” rather than “certified” or universally
  approved

#### Scenario: A clinical change removes stale authority

- **WHEN** reviewed or endorsed content changes clinically
- **THEN** the new content version falls back to the highest status supported by records for that
  version and every stale badge, reviewed-only pack entry, and endorsement claim disappears

### Requirement: Named Editorial Coverage Is Public But Does Not Block Preview Construction

The project SHALL maintain a public board of credentialed clinicians and educators with declared
identity, qualification, institution, review scope, joined date, and conflicts. Missing domain
coverage SHALL block advancement to `clinically_reviewed`, not the publication of honestly labeled
preview content.

#### Scenario: A new domain has no reviewer yet

- **WHEN** a complete module lacks a qualified reviewer for one or more declared review domains
- **THEN** its scenarios may publish as preview, the governance dashboard names the uncovered
  domains and items, and reviewed-only distribution excludes them

#### Scenario: Reviewed coverage matches specialist scope

- **WHEN** pediatric, obstetric, neonatal, toxicologic, or other specialist content advances to
  clinically reviewed
- **THEN** at least one named reviewer has declared qualifications covering that domain and any
  conflict rule requiring an independent co-reviewer is satisfied

### Requirement: Guideline Currency Changes Status Rather Than Hiding History

Every guidance-derived item SHALL record issuing body, title, version/year, date consulted, source
locator, and review-by date no more than 24 months after clinical review. Supersession or expiration
SHALL be visible and SHALL affect maturity.

#### Scenario: Review expires

- **WHEN** a clinically reviewed item reaches its review-by date
- **THEN** it is marked review overdue immediately, excluded from newly generated reviewed-only
  adoption packs, and falls to `source_checked` or `preview` after a 30-day grace period unless
  renewed

#### Scenario: Guidance is superseded urgently

- **WHEN** an issuing body replaces guidance and the old behavior may teach unsafe practice
- **THEN** affected content is withdrawn pending reassessment rather than remaining available during
  a calendar grace period

### Requirement: Public Corrections Begin In The Scenario And End In The Repository

Every scenario SHALL provide the bounded anonymous correction path defined by
`platform/problem-reporting`. Confirmed clinical or educational errors SHALL create an append-only
public correction record. Reporting SHALL be treated as detection, not review or sign-off.

#### Scenario: A report is reproducible without a project account

- **WHEN** a user submits a category-only or context-enabled report
- **THEN** maintainers can identify the exact public scenario/version/surface and, when consented,
  replay the bounded recent context without receiving an account, contact address, reflection, or
  prior history

#### Scenario: A report does not establish truth

- **WHEN** one or many reports allege a clinical error
- **THEN** the item's status changes only after reproduction, authoritative source verification,
  severity assessment, and the applicable review path; duplicate count affects priority only

#### Scenario: A confirmed correction remains public

- **WHEN** a clinical or educational error is fixed
- **THEN** `CORRECTIONS.md` and its machine-readable record append the affected IDs/versions, what was
  wrong, potential learning impact, source verification, mitigation/withdrawal timeline, changed
  release, and reporter attribution only when explicitly and separately provided outside the
  anonymous report system

#### Scenario: Urgent error disables content quickly

- **WHEN** source verification finds that content could teach unsafe practice
- **THEN** the item is marked withdrawn in the next emergency static release regardless of catalog
  targets, and review/endorsement records visibly stop applying

### Requirement: Governance Is Auditable At Item, Scenario, Module, And Release Level

Public machine-readable records and rendered dashboards SHALL enumerate maturity, source checks,
clinical reviews, organizational endorsements, overdue items, withdrawals, limitations, and
corrections without presenting an aggregate alone.

#### Scenario: An institution evaluates one release

- **WHEN** a program director downloads the adoption pack for a release
- **THEN** it lists every included scenario/version, status, sources, limitations, corrections,
  reviewers, endorsements, conflicts, expiration, region, and excluded preview item

#### Scenario: Catalog size cannot hide review gaps

- **WHEN** the public catalog reports 240 scenarios
- **THEN** it also reports exact counts and item lists for preview, source-checked, clinically
  reviewed, institution-endorsed, overdue, and withdrawn content

## REMOVED Requirements

### Requirement: Unreviewed Clinical Content Cannot Reach Production

**Reason:** This absolute publication gate prevents complete work from being used or reviewed in
public. It is replaced by exact maturity labels and separate gates for preview publication,
clinical-review claims, reviewed-only packs, and organizational endorsements.

**Migration:** Existing unsigned anesthesia content becomes `preview`; no prior signature is
invented. Existing version, source, limitation, and review-gap records remain visible.
