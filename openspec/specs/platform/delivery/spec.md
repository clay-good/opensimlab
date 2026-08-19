# platform/delivery Specification

## Purpose

Covers how Open-SimLab is built, tested, measured, and shipped: the static build, the routing scheme at opensimlab.com, the performance budgets that keep it usable on modest hardware, and the release process that keeps clinical content and model provenance trustworthy.

## Requirements

### Requirement: Static Build, No Runtime Server

The production artifact SHALL be a set of static files — HTML, JavaScript, CSS, JSON, and media — deployable to any static host, with no server-side rendering, no runtime function, and no origin service.

#### Scenario: The build runs anywhere

- **WHEN** the documented build command runs on a clean checkout with a pinned toolchain
- **THEN** it produces the static output directory, and the same commit produces a byte-identical bundle on a second machine

#### Scenario: Deployment is a file copy

- **WHEN** the output directory is served by any static file server
- **THEN** the application functions completely, including deep links and offline installation

### Requirement: Route Scheme

The application SHALL serve the anesthesiology module at `/anesthesia`, reserve `/oncology` and `/cardiology` for later modules, and serve a landing page at `/` that explains the project and routes the visitor to a module. Deep links into a scenario SHALL be shareable and SHALL carry no learner data.

#### Scenario: A module deep link works cold

- **WHEN** a visitor opens `/anesthesia/scenario/rapid-sequence-induction` with an empty cache
- **THEN** the application loads directly into that scenario's briefing screen, and the same link works offline once the pack is cached

#### Scenario: An unbuilt module route is honest

- **WHEN** a visitor opens `/oncology` before that module exists
- **THEN** a page states that the module is planned, describes what it will cover, and links to the anesthesiology module, rather than returning a generic error

#### Scenario: Links carry no state about the learner

- **WHEN** any shareable link is generated
- **THEN** it encodes only the module, the scenario, and optionally a scenario configuration, and never a transcript, progress, or identifier

### Requirement: Performance Budgets

The application SHALL meet, on a mid-range 2020 Android device over a 4G-class connection: Largest Contentful Paint under 2.0 seconds, Interaction to Next Paint under 200 ms, Cumulative Layout Shift under 0.1, and a time to first interactive cockpit action under 3.0 seconds. Budgets SHALL be enforced in continuous integration.

#### Scenario: A regression blocks the merge

- **WHEN** a pull request pushes any budget beyond its threshold on the throttled reference profile
- **THEN** the performance job fails and reports the metric, the previous value, and the new value

#### Scenario: The main thread stays free during simulation

- **WHEN** a scenario runs at 5× for 5 minutes
- **THEN** no main-thread task exceeds 50 ms, measured by the long-task observer in the automated run

### Requirement: Test Strategy

The repository SHALL maintain unit tests for the solver and physiology, golden-vector parity tests against the Hypnos Python reference, property tests for conservation and monotonicity invariants, deterministic end-to-end scenario replays, accessibility scans, offline tests, bundle-size checks, and architecture tests enforcing the forward-only and no-third-party-request boundaries. All SHALL run on every pull request.

#### Scenario: A scenario replay is the regression net

- **WHEN** any engine change is proposed
- **THEN** every bundled scenario's recorded transcript is replayed and its state-trace hash compared, and any intended change of behavior requires the new hashes to be committed with a written justification

#### Scenario: Invariants are property-tested

- **WHEN** the property suite runs
- **THEN** it asserts across randomized inputs that compartment amounts stay non-negative, that mass is conserved without elimination, that effect-site concentration never exceeds the running maximum plasma concentration for a bolus-only history, and that the Hill function is monotone in concentration

### Requirement: Release And Provenance

Each release SHALL record the application version, the Hypnos dataset version and commit, the golden-vector hashes, the clinical review records for all bundled content, and a human-readable changelog that separates behavior changes from cosmetic ones.

#### Scenario: A physiological change is announced as such

- **WHEN** a release alters any simulated output
- **THEN** the changelog states which scenarios and parameters changed, by how much, and why, in a section distinct from interface changes

#### Scenario: The running build identifies itself

- **WHEN** a learner opens the about panel
- **THEN** it shows the application version, the build commit, the Hypnos dataset version, and the build date, all readable offline

### Requirement: Contribution Path For Clinicians

The repository SHALL document how a clinician educator with no build tooling can propose a scenario, report a physiological inaccuracy, or supply a translation.

#### Scenario: A scenario can be proposed without a local environment

- **WHEN** an educator follows the documented contribution path
- **THEN** they can author a scenario file against the published schema, validate it in the browser-based validator, and submit it without installing the project locally
