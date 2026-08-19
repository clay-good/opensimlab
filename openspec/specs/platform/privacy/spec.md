# platform/privacy Specification

## Purpose

Guarantees that using Open-SimLab is unobservable. A learner practicing an intubation they are anxious about, or repeating a scenario they failed, generates no record anyone else can see. This is a design constraint, not a policy promise: the architecture must make surveillance impossible rather than merely forbidden.

## Requirements

### Requirement: No Telemetry, No Analytics, No Third-Party Requests

The production bundle SHALL contain no analytics library, no error-reporting service, no advertising or tracking code, and no request to any origin other than the one serving the application.

#### Scenario: A third-party request fails the build

- **WHEN** the production bundle is scanned in continuous integration
- **THEN** any script, font, style, or image referencing a foreign origin fails the build, naming the reference

#### Scenario: A full session generates no outbound traffic

- **WHEN** a complete session is run with network recording enabled after first load
- **THEN** zero requests are observed beyond the initial asset fetch

#### Scenario: A strict content security policy is enforced

- **WHEN** response headers are inspected
- **THEN** a content security policy restricts connect, script, style, font, and image sources to self, with no unsafe-inline script, and the policy is verified by an automated header test

### Requirement: No Accounts And No Server-Side State

The application SHALL have no login, no user account, no session cookie, and no server-side storage of any kind. The hosting layer SHALL serve static assets only.

#### Scenario: No credential surface exists

- **WHEN** the application is inspected
- **THEN** there is no sign-in, sign-up, password, or federated identity control anywhere, and no code path transmits a credential

#### Scenario: Server logs cannot reveal learner behavior

- **WHEN** the hosting configuration is reviewed
- **THEN** it serves static assets, retains no per-request identity, and the documentation states what the host necessarily sees, namely asset requests and their originating network address

### Requirement: All Learner Data Stays On The Device

Transcripts, preferences, progress, and debriefs SHALL be stored only in the browser's local storage on that device, and sharing SHALL happen only through a file the learner exports deliberately.

#### Scenario: Sharing is an explicit file action

- **WHEN** a learner wants to send a session to an instructor
- **THEN** they export a transcript file and share it themselves through their own channel, and the application provides no upload, no share link, and no cloud destination

#### Scenario: An exported transcript contains no identifiers

- **WHEN** an exported transcript is inspected
- **THEN** it contains the scenario, the engine and dataset versions, the seed, and the action list only, with no device fingerprint, no browser identifier, no locale-derived identity, and no timestamps tied to real-world clock time

### Requirement: Honest, Short, Verifiable Privacy Statement

The application SHALL include a privacy statement written in plain language, readable in under two minutes, that states what is stored, where, and what leaves the device, and that points at the enforcing tests.

#### Scenario: The statement matches the code

- **WHEN** the privacy statement is compared to the enforcement tests
- **THEN** each claim maps to a named test, and a release checklist item requires that mapping to be current
