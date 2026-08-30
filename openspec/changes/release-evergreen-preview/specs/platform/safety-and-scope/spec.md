# platform/safety-and-scope Delta Specification

## ADDED Requirements

### Requirement: Unreviewed Status Is Disclosed Alongside The Not-For-Clinical-Use Statement

Because the public release ships content that no clinician has signed, the first-load
not-for-clinical-use statement SHALL also state that the content is not clinically reviewed, and
that statement SHALL be acknowledged once before the cockpit becomes interactive. The persistent
chrome marker SHALL continue to identify the application as a simulator.

#### Scenario: First load discloses both facts together

- **WHEN** a visitor loads the application for the first time on a device
- **THEN** the acknowledgement states both that this is an educational simulator not for clinical
  use and that its content has not been clinically reviewed, and links to the review-status surface

#### Scenario: Exports carry both statements

- **WHEN** any transcript, log, chart image, or CSV is exported
- **THEN** the exported artifact embeds the not-for-clinical-use statement, the unreviewed-content
  statement, the release identifier, and the engine and model-set versions

#### Scenario: Dropping the staged label does not drop the caveat

- **WHEN** the product no longer carries an `alpha` label
- **THEN** the per-item maturity label and the unreviewed-content statement remain present at every
  surface that previously relied on the staged label to convey immaturity
