# engine/pharmacology Delta Specification

## ADDED Requirements

### Requirement: A Public Verification Queue Lists Every Unchecked Parameter

The application SHALL publish a verification queue at `/verification-queue`, opening with the
count of verified and pending parameters, listing every parameter without a verified
transcription record grouped by model with its value, unit, primary source locator, any known
corrigendum, the second-source kinds accepted for that model, and the content version, and
stating the check procedure in one paragraph. The queue SHALL render offline and SHALL agree with
the transcription records in source.

#### Scenario: The queue and the source agree

- **WHEN** the queue renders
- **THEN** its pending count equals the number of parameters whose transcription record lacks a
  checker, and a test fails the build on disagreement

#### Scenario: A corrigendum is named where it bites

- **WHEN** a parameter's source publication has a corrigendum affecting it
- **THEN** the queue entry names the corrigendum and states that the transcribed value follows it,
  so a check against the original table does not confirm the uncorrected number

#### Scenario: The finding comes before the list

- **WHEN** the page renders
- **THEN** the two counts are the first content, a zero is shown as zero, and the grouped list sits
  behind a disclosure rendered closed but present in the served HTML

### Requirement: A Verification Record Names Its Checker, Source, And Version

A verification record SHALL name the model, parameter, value and unit checked, the content
version, the primary locator, the second source with its kind and locator, the checker's name and
stated qualification, the date, and any discrepancy. It SHALL be accepted only when the checker
is not the transcriber, the second-source kind is one the model accepts, a maintainer has
confirmed the second source, and the content version is current. A discrepancy SHALL open a
correction rather than a verified record.

#### Scenario: A self-check is refused

- **WHEN** a record's checker name equals the transcriber's
- **THEN** it is refused with the reason and the parameter remains pending

#### Scenario: An old version does not verify the current one

- **WHEN** a record names a content version older than the current model-set revision
- **THEN** it is kept as history, the parameter remains pending, and the queue says a check exists
  for an earlier version

#### Scenario: A discrepancy becomes a correction

- **WHEN** a record reports that the second source disagrees with the transcribed value
- **THEN** no verified record is written, a correction is opened under the public corrections
  process, and the queue entry shows the disputed status until it resolves

#### Scenario: Verified means exactly one thing

- **WHEN** the model detail panel marks a parameter verified
- **THEN** it reads the same record the queue reads, and the panel shows the checker's name, the
  second source, and the date on request
