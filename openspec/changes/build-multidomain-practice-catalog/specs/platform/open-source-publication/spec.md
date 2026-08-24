# platform/open-source-publication Delta Specification

## ADDED Requirements

### Requirement: The Entire Product Is Public And MIT Licensed

Application code, authored scenario content, schemas, tutor rules, tests, evidence briefs, review and
endorsement records, corrections, documentation, build tooling, and infrastructure configuration
SHALL live in the public repository under the MIT License except for separately identified compatible
third-party assets.

#### Scenario: A clean clone contains the product source

- **WHEN** a stranger clones the public release commit
- **THEN** they can inspect and build every playable scenario, tutor rule, debrief, source record,
  maturity record, and static artifact without access to a private repository or service

#### Scenario: Private operational data stays out

- **WHEN** repository history and release artifacts are scanned
- **THEN** they contain no Worker secret, raw report, D1 export, private reviewer correspondence,
  credential, private key, environment file, or local Wrangler state

### Requirement: Third-Party Material Is Explicitly Compatible

Every non-original dependency, asset, dataset, translation, and copied excerpt SHALL have a
machine-readable source, author, license, modification, and redistribution record. The build SHALL
reject missing or incompatible records.

#### Scenario: Proprietary educational content is refused

- **WHEN** a contribution derives from a commercial question bank, paid simulation scenario,
  proprietary monitor implementation, protected media, or copyrighted table without permission
- **THEN** it is excluded and the scenario is re-authored from primary/authoritative sources and
  original expression or remains unbuilt

#### Scenario: A source citation is not a content license

- **WHEN** clinical facts are implemented from a publication
- **THEN** the repository records the factual source and locator while avoiding reproduction of
  protected prose, figures, tables, or media beyond applicable permission

### Requirement: Self-Hosting Does Not Depend On Cloudflare

The static simulator SHALL build and run on any conforming static host. Cloudflare report
infrastructure SHALL be optional and SHALL NOT be required for scenarios, tutoring, debrief,
progress, import/export, or offline use.

#### Scenario: Reporting is absent on a static-only fork

- **WHEN** a self-hoster supplies no report configuration
- **THEN** the static product remains complete, the report control truthfully states that upstream
  reporting is unavailable on that host, and it never silently sends to opensimlab.com

#### Scenario: A fork can provide its own correction route

- **WHEN** a self-hoster configures a compatible report endpoint
- **THEN** the interface identifies the responsible host/maintainer in the payload preview and
  privacy statement rather than implying upstream ownership

### Requirement: Public Contributions Follow The Same Evidence Contract

The repository SHALL document a browser-accessible scenario proposal path and a code contribution
path. Both SHALL require the same completion, evidence, limitation, maturity, and review rules as
maintainer-authored work.

#### Scenario: An educator proposes without build tooling

- **WHEN** an educator uses the published authoring schema and browser validator
- **THEN** they can submit an evidence brief and scenario proposal without installing the repository,
  and validation reports missing contract fields before submission

#### Scenario: Volume does not bypass quality

- **WHEN** a bulk or agent-authored contribution proposes many scenarios
- **THEN** each scenario independently passes sources, fixtures, objective reachability,
  distinctness, limitations, and maturity labeling; authorship method earns no exemption

### Requirement: Machine-Readable Public Artifacts Replace Hosted MCP

The static release SHALL publish catalog, scenario schema and metadata, competency/path, source,
limitation, maturity, correction, endorsement, and example-transcript manifests. This change SHALL
NOT deploy a hosted MCP server.

#### Scenario: An external auditor needs structured data

- **WHEN** an institution or local tool downloads the public manifests
- **THEN** it can enumerate the exact release catalog, versions, sources, review coverage,
  corrections, limitations, and endorsements without executing the simulator or calling a server

#### Scenario: MCP is reconsidered only with evidence

- **WHEN** a future proposal identifies at least three recurring agent workflows and passes a safety
  review against real-patient use and clinical decision support
- **THEN** it may specify a read-only, bounded, local adapter derived from the manifests; until then,
  no MCP deployment or operational surface is included
