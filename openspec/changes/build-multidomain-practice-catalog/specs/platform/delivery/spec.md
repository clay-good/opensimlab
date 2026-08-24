# platform/delivery Delta Specification

## MODIFIED Requirements

### Requirement: Static Product With An Optional Isolated Report Service

The complete learning product SHALL build as static HTML, JavaScript, CSS, JSON, fonts, media, and
domain packs. No scenario, tutor, progress, debrief, replay, import/export, search, or institutional
audit function SHALL require runtime server code. A separately deployed API-only Worker MAY support
the exact problem-report routes.

#### Scenario: The static build works anywhere

- **WHEN** a clean release artifact is served from a conforming static host with no API Worker
- **THEN** every installed learning function operates and only report submission is marked
  unavailable

#### Scenario: Static traffic avoids Worker logic

- **WHEN** production serves HTML, assets, domain packs, deep links, or service-worker updates
- **THEN** those requests use the static asset path and never invoke report validation or D1

#### Scenario: Reporting deploys independently

- **WHEN** the report Worker is deployed, disabled, rolled back, or unavailable
- **THEN** the byte-identical static simulator release continues operating and its report config
  check fails closed

### Requirement: Domain Packs Are Versioned Release Artifacts

Each domain pack SHALL declare its content version, required shell and capability versions, asset
integrity hashes, size, scenario IDs, sources, tutor rules, fixtures required at runtime, and offline
cache group.

#### Scenario: A release identifies every pack

- **WHEN** a release record is generated
- **THEN** it names the exact pack versions and hashes used by its catalog and the shell refuses an
  unlisted or integrity-invalid pack

#### Scenario: The base route stays light

- **WHEN** a first-time visitor loads the catalog without opening a module
- **THEN** no playable domain pack is downloaded before selection except the smallest curated first-
  run scenario explicitly included in the base budget

### Requirement: Release Gates Match Maturity Claims

Preview publication SHALL require build integrity, sources, safety scope, completion contract,
tests, limitations, honest maturity, validation report, and documented face-validity procedure.
Clinical review and organizational endorsement SHALL gate only their corresponding status, badges,
reviewed-only distribution, and adoption claims.

#### Scenario: Automated success can publish preview but not authority

- **WHEN** all preview gates pass and no qualified clinician has signed the content
- **THEN** the release may deploy the item as preview and SHALL NOT include it in clinically reviewed
  or institution-endorsed counts, filters, badges, or packs

#### Scenario: A reviewed-only pack is strict

- **WHEN** a reviewed-only adoption pack is built
- **THEN** every included content item has current exact-version review, no overdue or withdrawn
  dependency, compatible regional scope, and complete public records

#### Scenario: Endorsement is release-specific

- **WHEN** an organization-endorsed pack is generated
- **THEN** every included item and version falls within the organization's signed scope and the pack
  embeds the endorsement expiration and revocation check record

### Requirement: Report Infrastructure Has Separate Security And Cost Gates

A production report deployment SHALL require exact route configuration, no public preview or
`workers.dev` URL, D1 migration, Turnstile hostname/action configuration, Worker secrets, WAF rate
limit, disabled persisted invocation logs where configurable, scheduled retention, test-key suite,
live accepted/duplicate/invalid/quota/cleanup checks, and a kill switch.

#### Scenario: Incomplete provisioning cannot accept reports

- **WHEN** any required binding, key, secret, route, catalog, or validation dependency is missing
- **THEN** config/submission fails closed, writes no fallback record, and the static release remains
  healthy

#### Scenario: Free-tier usage is bounded in code

- **WHEN** all application acceptance ceilings are reached for 30 consecutive days
- **THEN** retained report rows cannot exceed 6,000 before cleanup and code changes are required to
  raise verified-attempt or accepted-report ceilings

### Requirement: Test Strategy Covers Catalog, Tutor, Governance, And Reporting

Continuous integration SHALL add catalog-count/distinctness/completion, domain-pack integrity and
rollback, tutor truthfulness and mode equivalence, maturity/record invalidation, adoption-pack scope,
report payload minimization, route isolation, Turnstile validation, hostile request, quotas, dedupe,
retention, prompt-injection boundary, and static-without-reporting tests to the existing solver,
scenario, accessibility, performance, offline, architecture, and source gates.

#### Scenario: A scenario cannot inflate the catalog

- **WHEN** a pull request registers a scenario lacking any completion-contract field or reference
  fixture
- **THEN** the catalog gate fails before build publication and reports the missing evidence

#### Scenario: A tutor regression cannot teach a false observation

- **WHEN** an engine or scenario change makes a tutor claim false for any reachable seed
- **THEN** deterministic tutor replay fails and identifies the rule, transcript, tick, expected
  observation, and actual state

#### Scenario: A report collector broadens silently

- **WHEN** report code imports a learner store, adds an undeclared payload key, selects context by
  DOM sweep, or enables context by default
- **THEN** architecture, schema, privacy, and integration gates fail

### Requirement: The Running Release Exposes Public Audit Artifacts

Each release SHALL publish static manifests for catalog, schemas, paths, competencies, sources,
limitations, maturity, reviews, endorsements, corrections, pack integrity, and deterministic example
transcripts. These artifacts SHALL be available offline with the applicable pack and SHALL require no
MCP or API service.

#### Scenario: A release can be audited without executing code

- **WHEN** an institution downloads the manifests for a release
- **THEN** it can verify scenario inventory, versions, maturity coverage, source currency,
  limitations, corrections, endorsements, and pack hashes without running JavaScript or contacting a
  private service

## REMOVED Requirements

### Requirement: Release Cannot Publish Until Every Clinical And Face-Validity Sign-Off Passes

**Reason:** Clinical sign-off now advances exact content to `clinically_reviewed`; it does not block
honestly labeled preview deployment. Face-validity procedure and results remain mandatory for a
complete preview module, while named acceptance is represented through maturity records.

**Migration:** Existing release commands split into preview and reviewed/endorsed channels. No
existing unsigned content is relabeled as reviewed.
