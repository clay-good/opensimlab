# platform/clinical-governance Specification

## Purpose

Establishes why a professor should trust this simulator with their students. Defines the editorial board, the named clinical review every piece of content passes, the currency tracking that stops guidance going stale, the corrections process when something is wrong, and the public audit trail that lets a skeptical reader check all of it. Without this capability the rest of the project is a toy.

## Requirements

### Requirement: Named Editorial Board With Declared Interests

The project SHALL maintain a public editorial board of credentialed clinicians and educators, recorded in `GOVERNANCE.md`, each entry naming the person, their credential, their institution, their scope of review, the date they joined, and a declaration of competing interests.

#### Scenario: The board is verifiable by a stranger

- **WHEN** a professor evaluating the tool opens the governance page
- **THEN** they see each reviewer's full name, credential (for example MD, DO, MBBS, CRNA, MSN), specialty, institution, and competing-interest declaration, with no anonymous or pseudonymous reviewers of clinical content

#### Scenario: Competing interests are declared, not merely absent

- **WHEN** a reviewer has a financial relationship with a drug or device manufacturer relevant to the content they review
- **THEN** that relationship is stated on the governance page and on every content item they signed off, and a second reviewer without that relationship must co-sign the item

#### Scenario: Board coverage matches the content

- **WHEN** the module ships pediatric, obstetric, or critical-care content
- **THEN** at least one board member whose declared scope covers that domain has reviewed it, and the build fails if a content domain has no qualified reviewer

### Requirement: Every Clinical Assertion Is Signed

Every scenario, crisis protocol, drug card, concept explainer, debrief template, alarm threshold, and normal-range value SHALL carry a machine-readable `clinical_review` record naming the reviewer, their credential, the review date, the content version reviewed, and the sources consulted.

#### Scenario: Unreviewed clinical content cannot reach production

- **WHEN** a content item lacks a `clinical_review` record, or its record references a content version older than the current one
- **THEN** the release build excludes that item, the build log names it, and the surface that would have shown it degrades gracefully rather than showing unreviewed text

#### Scenario: A learner can see who signed what

- **WHEN** a learner opens any clinical content item and selects its provenance control
- **THEN** they see the reviewer's name and credential, the review date, and the sources, without leaving the session

#### Scenario: Re-review is triggered by change, not by calendar alone

- **WHEN** a content item's text or any numeric value in it changes
- **THEN** its review record is invalidated and the item requires re-review before the next release

### Requirement: Guideline Currency Is Tracked And Surfaced

Every item deriving from a published guideline SHALL record the guideline name, its issuing body, its publication year, and a `review_by` date no more than 24 months after the last review. The application SHALL display the guideline and year to the learner.

#### Scenario: A learner can judge how current the guidance is

- **WHEN** the malignant hyperthermia protocol is displayed
- **THEN** it names its source as the MHAUS acute-crisis protocol with the version consulted, and shows the date the content was last clinically reviewed

#### Scenario: Stale content is flagged before it misleads

- **WHEN** an item passes its `review_by` date
- **THEN** the build emits a warning, the governance dashboard lists it as overdue, and after 30 further days the item is marked in the interface as pending re-review

#### Scenario: A superseded guideline is caught

- **WHEN** an issuing body publishes a new version of a guideline the project cites
- **THEN** the maintainers record the supersession in the currency register, and every item citing the old version is queued for re-review

### Requirement: Review Is Capturable In Place

A clinician SHALL be able to record what is wrong with a specific clinical claim at the point where they meet it, without an account, an issue tracker, or any tool other than the browser they are already using, and SHALL be able to hand the resulting notes back as a single file.

#### Scenario: A reviewer flags a claim where they read it

- **WHEN** a reviewer reading a drug card, explainer or scenario briefing sees something wrong
- **THEN** they can record what is wrong against that item's id, choose how serious it is, and suggest a correction, without leaving the page or losing their place

#### Scenario: A reviewer can work through everything systematically

- **WHEN** a reviewer wants to know what is left to look at
- **THEN** a single surface lists every reviewable clinical item, marks which they have already flagged, and states how many remain, so the review is bounded rather than open-ended

#### Scenario: Notes come back as one file

- **WHEN** a reviewer has finished
- **THEN** they export one human-readable file containing every note with the item id, the content version and the application version, which a maintainer can act on directly and which a reviewer can read before sending

#### Scenario: Nothing is transmitted

- **WHEN** notes are recorded
- **THEN** they are held on that reviewer's device only, no request is made to any origin, and the reviewer sends the file themselves or does not

#### Scenario: A flag is not a signature

- **WHEN** a reviewer records notes
- **THEN** nothing about that act marks the content as reviewed, signed, or covered by a review record, because flagging what is wrong and taking professional responsibility for what is right are different things

### Requirement: Public Corrections Process

The project SHALL provide a clearly-signposted way to report a clinical inaccuracy, SHALL acknowledge reports within 5 working days, and SHALL maintain a public, permanent corrections log.

#### Scenario: A clinician can report an error in under two minutes

- **WHEN** a clinician spots an inaccuracy mid-session
- **THEN** a "report a clinical issue" control is reachable from that content item, pre-fills the item id, content version, and app version, and opens a public issue without requiring an account with this project

#### Scenario: Corrections are permanent and visible

- **WHEN** a clinical error is corrected
- **THEN** an entry is appended to `CORRECTIONS.md` stating what was wrong, the potential educational impact, who reported it, what changed, and in which release, and the entry is never deleted or rewritten

#### Scenario: A serious error triggers an immediate release

- **WHEN** a reported error could teach an unsafe practice
- **THEN** it is triaged as urgent, the affected content is disabled in the next build regardless of the release schedule, and the corrections log records the timeline

### Requirement: Content Is Versioned Independently Of Code

Clinical content SHALL carry its own semantic version, changeable without a code change, and every session transcript SHALL record the content version it ran under.

#### Scenario: A debrief can be reproduced years later

- **WHEN** a transcript recorded under an earlier content version is reopened
- **THEN** the application states which content version it ran under, what has changed in the content since, and whether any change affects the debrief's conclusions

#### Scenario: An instructor can pin a version for a course

- **WHEN** a course runs across a semester
- **THEN** the instructor can pin a content version so every student sees identical material, and the pinned version is displayed in the interface

### Requirement: The Limitations Register

The project SHALL maintain a public register of what the simulator does not model, where its physiology is known to be simplified, and where a learner could draw a wrong conclusion. It SHALL be linked from the interface, not buried in a repository file.

#### Scenario: The register is specific, not a disclaimer

- **WHEN** the limitations register is read
- **THEN** each entry names the specific simplification, the clinical situation where it would mislead, and the correct clinical understanding — for example that the simulator does not model regional anesthesia block spread, coagulopathy, or acid-base compensation beyond a stated approximation

#### Scenario: Limitations are surfaced where they bite

- **WHEN** a learner enters a scenario whose teaching points sit near a known limitation
- **THEN** the briefing names that limitation in one sentence before the session starts

### Requirement: Governance Is Auditable From Outside

All governance records — the board, the review sign-offs, the currency register, the corrections log, and the limitations register — SHALL live in the public repository in machine-readable form, and a governance dashboard SHALL render their current state.

#### Scenario: An institution can audit before adopting

- **WHEN** a program director evaluates the tool for their curriculum
- **THEN** they can see, without contacting anyone, the full review coverage, the overdue items, the corrections history, and the declared interests

#### Scenario: Coverage gaps are visible rather than implied

- **WHEN** the governance dashboard renders
- **THEN** it states the percentage of clinical content under current review, lists every overdue or unreviewed item by name, and does not report an aggregate figure without the underlying list
