# platform/clinical-governance Delta Specification

## ADDED Requirements

### Requirement: A Volunteer Check Is Recorded As A Check, Not A Signature

The project SHALL accept parameter verification records from the public through the report
channel under a `parameter check` category with structured fields, or by pull request, SHALL
treat each as untrusted evidence until a maintainer confirms the second source, SHALL acknowledge
it within the five-working-day window, and SHALL NOT let a verification record mark any content
as reviewed, signed, endorsed, or of higher maturity.

#### Scenario: A check changes one status and nothing else

- **WHEN** a verification record is accepted for a parameter
- **THEN** that parameter's status becomes verified, and the model, the drug card, every scenario
  using the model, and the review-status page keep exactly the maturity and review state they had

#### Scenario: Receipt is not acceptance

- **WHEN** a parameter check arrives through the report channel
- **THEN** the report is stored as quoted structured data, no status changes on receipt, and the
  maintainer workflow records the second-source confirmation before the record enters source

#### Scenario: The checker is named in the record and nowhere else

- **WHEN** a record is accepted
- **THEN** the checker's name and stated qualification appear in the transcription record and on
  the model detail panel on request, and no contact detail is requested or stored

### Requirement: Every Release Is Citable As The Version A Check Refers To

The repository SHALL carry a `CITATION.cff` that validates, each release SHALL be archived with
its own persistent identifier under a project concept identifier, the about panel SHALL show the
suggested citation for the running build offline, and every verification record SHALL name the
content version that citation resolves to.

#### Scenario: The citation file validates and names the identifier

- **WHEN** continuous integration runs
- **THEN** `CITATION.cff` passes the citation-file-format validator and names the concept
  identifier, and a release whose archived identifier is missing from the release record fails
  the release gate

#### Scenario: A faculty member cites the exact build

- **WHEN** they open the about panel offline
- **THEN** it shows authors, title, version identified by date and commit, year, and the
  persistent identifier for that release
