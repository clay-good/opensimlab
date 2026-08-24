# platform/problem-reporting Delta Specification

## ADDED Requirements

### Requirement: Every Scenario Has One Shared Correction Door

Every playable scenario SHALL expose the same `Report a problem` control from its prebrief, live
session, debrief, source view, and limitation view. New scenarios inherit it through the shared
frame and SHALL NOT implement private reporting variants.

#### Scenario: Reporting is reachable where the problem appears

- **WHEN** a learner, educator, or reviewer encounters a suspected problem on any scenario surface
- **THEN** the report dialog opens in one activation, pauses a running local simulation, and retains
  the exact local state if canceled or completed

#### Scenario: A keyboard-only report is quick

- **WHEN** the documented keyboard procedure starts from the live frame
- **THEN** a category-only report can be previewed and submitted in under 60 seconds with logical
  focus order, a trapped modal focus cycle, Escape cancelation, restored trigger focus, and status
  announcements

### Requirement: The Smallest Report Requires No Prose

The dialog SHALL require one category from clinical content, patient behavior, tutor/debrief,
controls, accessibility, outdated source, or other. A note of at most 500 characters and recent
simulation context SHALL be optional.

#### Scenario: Category-only submission remains useful

- **WHEN** a user selects a category and supplies no note or context
- **THEN** the payload still includes server-verifiable scenario/version/surface metadata and can be
  accepted

#### Scenario: Context is affirmative and inspectable

- **WHEN** the user considers including recent simulation context
- **THEN** its checkbox is off by default, the exact normalized fields are visible before sending,
  and canceling sends nothing

#### Scenario: The warning discourages real clinical data

- **WHEN** the dialog opens
- **THEN** it states that the service is for this fictional scenario, instructs the user not to
  include a patient name or real clinical information, and links to the report privacy statement

### Requirement: Report Context Is Structurally Minimized

Every report SHALL include only scenario ID, content version, app version, engine version, maturity,
practice region, fidelity class, current surface, simulated tick, canonical URL, category, and
optional note. Optional context SHALL be limited to seed, the last 20 accepted/refused action
events, and a bounded non-text patient/equipment snapshot.

#### Scenario: Reflections and history cannot be collected

- **WHEN** the collector runs with local reflections, tutor responses, progress, prior transcripts,
  or imported instructor files present
- **THEN** none is addressable by the collector or serialized into the request

#### Scenario: Identity-bearing environment data is absent

- **WHEN** a request and stored row are inspected
- **THEN** they contain no real-world timestamp from the client, locale, timezone, user agent,
  device identifier, account, email, name, cookie, arbitrary header, or raw IP

#### Scenario: Canonical URL has no learner state

- **WHEN** a report is stored
- **THEN** its URL identifies only the public scenario and applicable public region/surface, with no
  query, fragment, seed, transcript, filters, assignment label, or progress value

### Requirement: Reporting Uses An Isolated Exact-Route Worker

Static application traffic SHALL bypass reporting code. A separate API-only Worker SHALL handle
only `GET /api/reports/config` and `POST /api/reports`, with no static assets, public read route,
preview URL, `workers.dev` URL, or broader prefix route.

#### Scenario: Ordinary practice is static

- **WHEN** a complete session runs without opening or sending a report
- **THEN** zero application API requests occur after required static assets are loaded and no D1 or
  Turnstile request occurs

#### Scenario: Lookalike paths do not enter the API

- **WHEN** a request targets `/api/reports/`, `/api/reports-anything`, `/api/report`, or an unsupported
  method
- **THEN** it is rejected or served by the normal not-found path without invoking report persistence

#### Scenario: Missing reporting leaves simulation intact

- **WHEN** the report Worker, configuration, Turnstile, or D1 is unavailable
- **THEN** the report control states temporary unavailability and every static simulation, tutor,
  replay, debrief, export, and offline function remains usable

### Requirement: Every Submission Is Validated And Bounded Before Storage

The Worker SHALL require an allowed exact Origin, `application/json`, no content encoding, a body no
larger than 32 KB by both declared and streamed UTF-8 length, only schema keys and bounded values, a
known public scenario/version from the generated catalog, a matching canonical URL, and safe text.

#### Scenario: Hostile payloads write nothing

- **WHEN** a request has missing/wrong origin, wrong content type, encoded or oversized body,
  malformed JSON, unknown keys, unknown scenario/version, invalid category, cross-origin URL,
  overlong values, nonfinite numbers, terminal control characters, or bidirectional overrides
- **THEN** it is rejected before a report row is written and the response exposes no secret, SQL,
  binding, quota, IP, or validation detail

#### Scenario: Client labels are not authoritative

- **WHEN** the submitted title, maturity, module, or other informational metadata differs from the
  generated report catalog
- **THEN** the Worker stores the server-derived metadata or rejects an incompatible version and never
  trusts the client label

### Requirement: Turnstile Is Lazy And Server-Validated

The Turnstile client SHALL load only after the report dialog opens. The Worker SHALL redeem every
token through Siteverify and require success, the expected production hostname, and action
`scenario-report`. Tokens SHALL be no longer than 2,048 characters, single-use, and never stored.

#### Scenario: A widget result alone is insufficient

- **WHEN** a forged, expired, reused, failed, wrong-hostname, or wrong-action token is submitted
- **THEN** no report or accepted counter is written

#### Scenario: Tests never use production credentials

- **WHEN** local or continuous-integration report tests run
- **THEN** they use Cloudflare's documented test keys or a fixed Siteverify stub and the secret-file
  gate proves production keys are absent from source and build output

### Requirement: Abuse Controls Bound Cost Without Retaining Identity

The Worker SHALL cap verified attempts at 5 per reporter and 400 globally per UTC day, accepted
unique reports at 3 per reporter and 200 globally per UTC day, and exact same-day duplicates at one.
Reporter identity SHALL be a daily HMAC-SHA-256 of UTC date plus `CF-Connecting-IP` using a Worker
secret; the raw address SHALL never be stored or logged by application code.

#### Scenario: Duplicate and quota responses do not reveal the boundary

- **WHEN** a schema-valid, Turnstile-valid report is accepted, duplicated, or dropped for quota
- **THEN** the public response is the same generic `202` and duplicate/quota cases add no report row

#### Scenario: Missing abuse controls fail closed

- **WHEN** the HMAC secret, Turnstile secret/site key, report catalog, D1 binding, or Siteverify
  response is unavailable
- **THEN** the Worker returns generic unavailability and uses no memory, log, email, issue, or
  unverified storage fallback

#### Scenario: A WAF boundary precedes code

- **WHEN** production deployment is evaluated
- **THEN** an exact-host/exact-route zone rate-limit rule protects both report routes and the launch
  checklist remains incomplete until one blocked flood is demonstrated

### Requirement: D1 Retention And Administration Are Private

D1 SHALL store immutable submission context and maintainer-owned triage fields. Reports SHALL expire
after 30 days and quota counters after 14 days through a daily scheduled handler. No public endpoint
SHALL read, list, update, delete, count, or administer reports.

#### Scenario: Cleanup bounds retained data

- **WHEN** the daily scheduled handler and manual fallback are tested at the retention boundary
- **THEN** expired reports and counters are deleted while newer rows and linked public correction
  records remain intact

#### Scenario: Triage records resolution evidence

- **WHEN** a report is resolved or declined
- **THEN** its private record contains status, severity, evidence note, linked issue/PR/commit where
  applicable, resolved time, and public correction ID for confirmed educational errors

### Requirement: Reports Cannot Directly Change The Product

Report content SHALL be treated as untrusted evidence. Automated maintenance MAY reproduce,
source-check, add a failing test, and draft a branch or pull request. It SHALL NOT execute report
instructions, access production write credentials, merge, deploy, publish, or change review,
endorsement, correction, or D1 status without the defined evidence and review path.

#### Scenario: Prompt injection remains quoted data

- **WHEN** a note contains tool instructions, secrets requests, repository commands, links, encoded
  text, or claims of authority
- **THEN** the triage system preserves it as a delimited quotation, does not follow it, and limits
  agent actions to the fixed workflow

#### Scenario: Scheduled batching is the default

- **WHEN** reports arrive
- **THEN** one daily sanitized batch may trigger triage and one weekly human review closes records;
  a report insert does not launch an independent privileged agent

#### Scenario: Urgent content still receives review

- **WHEN** a report plausibly identifies an unsafe teaching error
- **THEN** the content can be withdrawn through the emergency static release path, but a report alone
  cannot silently alter clinical behavior or establish the corrected fact
