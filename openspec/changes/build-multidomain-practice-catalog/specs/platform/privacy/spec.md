# platform/privacy Delta Specification

## MODIFIED Requirements

### Requirement: Simulation And Tutoring Are Unobservable By Design

Scenario use, actions, patient state, tutor interventions, reflections, debriefs, progress,
recommendations, repeats, imports, and exports SHALL remain on the device and SHALL create no
application API request. The only permitted behavioral network action is a report the user
explicitly previews and submits under `platform/problem-reporting`.

#### Scenario: A full private session is silent

- **WHEN** a learner browses the catalog, installs a domain pack, runs and repeats a scenario,
  reflects, reads the debrief, and receives a recommendation without sending a report
- **THEN** network recording shows only requested static asset fetches and zero report, telemetry,
  analytics, error-reporting, or learner-state requests

#### Scenario: Opening the report dialog has a narrow third-party request

- **WHEN** a learner opens the report dialog
- **THEN** the privacy disclosure identifies Cloudflare Turnstile, its script loads only then, no
  simulation context is transmitted to Turnstile, and closing the dialog submits no report

#### Scenario: Sending is explicit

- **WHEN** a learner submits a report
- **THEN** the exact application payload was visible immediately before submission, optional context
  was off by default, and no field outside the report schema leaves the device

### Requirement: No Accounts, Learner Backend, Or Surveillance

The application SHALL have no learner login, account, session cookie, cloud progress, telemetry,
cross-learner comparison, instructor observation, or server-side learner state. D1 SHALL store only
anonymous problem reports and bounded abuse counters.

#### Scenario: The backend cannot reconstruct a learner

- **WHEN** D1 rows and application logs are inspected
- **THEN** they contain no raw IP, account, email, name, user agent, device identifier, stable
  reporter identifier, learner history, prior session, reflection, real-world client timestamp, or
  arbitrary request header

#### Scenario: Daily quota identity expires by construction

- **WHEN** the same network address reports on two UTC dates
- **THEN** the application HMAC subjects differ because the date is included, and neither value can
  be reversed without the Worker secret and source address

### Requirement: Learner Data Remains Locally Controlled

Transcripts, reflections, preferences, progress, tutor history, and instructor-review imports SHALL
be stored only on the learner's device. Sharing SHALL occur only through a deliberately exported
file whose contents are previewed.

#### Scenario: Report collection cannot access local learner stores

- **WHEN** architecture tests inspect the report collector's dependency graph and runtime behavior
- **THEN** it can read only the current public scenario metadata plus the separately constructed
  optional bounded context object and cannot import or enumerate progress, reflection, transcript
  history, or instructor stores

#### Scenario: Optional report context is not a transcript export

- **WHEN** a user includes recent context
- **THEN** it contains at most the declared seed, 20 recent accepted/refused action events, and a
  bounded non-text current snapshot, with no reflection, prior event history, or local comparison

### Requirement: Privacy Claims Describe Static And Reporting Boundaries Separately

The privacy page SHALL be readable in under two minutes and SHALL distinguish static simulator
requests, local learner storage, lazy Turnstile behavior, report payload, report retention, D1
administration, Cloudflare platform visibility, and self-hosted behavior. Each claim SHALL map to a
named automated test or documented manual verification.

#### Scenario: “Nothing leaves” is no longer overclaimed

- **WHEN** any landing, catalog, scenario, report, repository, or adoption copy is scanned
- **THEN** it does not state that nothing ever leaves the device; it states that simulation and
  tutoring stay local and only a problem report the user chooses to send leaves

#### Scenario: Self-host responsibility is clear

- **WHEN** the application runs on a non-upstream host
- **THEN** the privacy page identifies that host as responsible for its static requests and any
  configured reporting, and the upstream project receives nothing unless the host explicitly and
  visibly configures an upstream route

## REMOVED Requirements

### Requirement: No Request To Any Origin Other Than The Application Origin

**Reason:** Lazy Cloudflare Turnstile necessarily loads from and validates with Cloudflare after the
user opens reporting. The replacement requirement permits this exact reporting dependency while
preserving zero third-party requests during ordinary simulation.

### Requirement: No Server-Side Storage Of Any Kind

**Reason:** Anonymous problem reports require bounded D1 storage. The replacement requirement
forbids learner storage and narrows server state to reports and abuse counters.
