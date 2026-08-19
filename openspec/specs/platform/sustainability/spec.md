# platform/sustainability Specification

## Purpose

Most open-source educational tools die quietly: the maintainer moves on, the grant ends, the dependencies rot, and a program that built a course around it is stranded. A residency program deciding whether to adopt this is making a multi-year bet, and they are right to ask what happens if the author stops. This capability specifies the answers in advance.

## Requirements

### Requirement: The Project States Its Own Bus Factor

The repository SHALL publish, and keep current, an honest statement of who maintains the project, how many people could keep it running, and what an adopter should do if maintenance stops.

#### Scenario: An adopter can see the risk before committing

- **WHEN** a program director reads the maintenance statement
- **THEN** it names the current maintainers, states plainly how many independent people have merge rights and clinical review authority, and does not describe a single-maintainer project as though it were a foundation

#### Scenario: The statement is dated and reviewed

- **WHEN** the maintenance statement is older than 12 months
- **THEN** the build emits a warning and the governance dashboard lists it as due for review

### Requirement: The Project Survives Its Maintainer

The project SHALL be designed so that it keeps working, and can be picked up, without its original author.

#### Scenario: A released version keeps working indefinitely

- **WHEN** maintenance stops entirely
- **THEN** every previously released build continues to function, because it is static files with no service dependency, no license server, no API, and no expiring certificate in its runtime path

#### Scenario: The handover path is documented before it is needed

- **WHEN** the succession document is read
- **THEN** it states who holds the domain, the repository, and the release signing capability, and what the process is for transferring each to a successor or an institution

#### Scenario: An institution can take a permanent copy

- **WHEN** an institution wants insurance against project abandonment
- **THEN** the documentation describes how to archive a specific version, self-host it, and keep serving it under the license, with no action required from the project

### Requirement: Dependency Discipline

The project SHALL minimize and pin its runtime dependencies, and SHALL treat every added dependency as a long-term maintenance liability requiring justification.

#### Scenario: A new runtime dependency is argued for

- **WHEN** a pull request adds a runtime dependency
- **THEN** it records why the capability cannot reasonably be implemented directly, the dependency's maintenance status, and its transitive count, and the review may reject it on those grounds alone

#### Scenario: The dependency surface is bounded and measured

- **WHEN** the dependency report runs
- **THEN** it reports the total runtime dependency count and transitive size against a declared ceiling, and exceeding the ceiling fails the build

#### Scenario: The build is reproducible from a lockfile years later

- **WHEN** an old release is rebuilt from its tagged commit
- **THEN** the pinned lockfile and pinned toolchain reproduce the same output, and the documentation states the archived toolchain version

### Requirement: Supply Chain Integrity

The build and release path SHALL be defensible against tampering, because the artifact is served to learners as clinical teaching material.

#### Scenario: Releases are verifiable

- **WHEN** a release is published
- **THEN** it carries a build provenance attestation naming the source commit and the build environment, and the documentation explains how a self-hosting institution verifies it

#### Scenario: Dependency changes are visible in review

- **WHEN** a pull request changes the lockfile
- **THEN** the diff is surfaced in review with the added and changed packages named, and an automated audit reports known advisories

#### Scenario: No third-party code executes at runtime from elsewhere

- **WHEN** the deployed application runs
- **THEN** the content security policy admits no foreign origin, so a compromised third-party host cannot inject code into a learner's session

### Requirement: Contribution Is Possible Without The Maintainer

The project SHALL lower the cost of contribution so that clinicians and developers can add value without the maintainer as a bottleneck.

#### Scenario: A newcomer can make a first contribution unaided

- **WHEN** a new contributor follows the documented setup
- **THEN** they reach a running local build and a passing test suite from a clean machine in under 30 minutes, following documentation that is itself tested in continuous integration

#### Scenario: Clinical and code contributions are separately routed

- **WHEN** a clinician wants to fix a protocol and a developer wants to fix a rendering bug
- **THEN** each has a documented path suited to their skills, and the clinician's path requires no build tooling

#### Scenario: The review load is bounded by design

- **WHEN** contributions arrive faster than they can be reviewed
- **THEN** the documented triage policy states what is prioritized — clinical corrections first, then accessibility, then defects, then features — and the backlog is public rather than silent

### Requirement: Funding And Independence Are Disclosed

Any funding, sponsorship, or institutional support SHALL be publicly disclosed, and the project SHALL state its independence from commercial interests in the products it simulates.

#### Scenario: Funding sources are visible

- **WHEN** the project receives grant, institutional, or donated support
- **THEN** the source and amount category are disclosed in the repository, alongside a statement of what influence the funder does and does not have over content

#### Scenario: Independence from manufacturers is explicit

- **WHEN** the project simulates a drug or a device category
- **THEN** the documentation states that no manufacturer funds, reviews, or approves the content, and any exception would be disclosed on the affected content itself

#### Scenario: The project never becomes a sales channel

- **WHEN** the interface is reviewed
- **THEN** it contains no advertising, no sponsored content, no product placement, and no branded module, and this is stated as a standing commitment rather than a current fact

### Requirement: Honest Status Signaling

The project SHALL signal its maturity accurately so that no program adopts it expecting more than it is.

#### Scenario: Maturity is stated, not implied

- **WHEN** a visitor reads the project status
- **THEN** it states the current stage in plain terms, what is stable, what is expected to change, and what has not been validated, rather than presenting an early project as finished

#### Scenario: Breaking changes are announced with lead time

- **WHEN** a change will break authored scenarios or stored transcripts
- **THEN** it is announced at least one release in advance, with a migration path, because an instructor may have built a course on the old behavior
